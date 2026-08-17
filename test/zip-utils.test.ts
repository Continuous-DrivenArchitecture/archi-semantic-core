import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { extractArchiModelXml } from '../src/archive.js';
import { parseArchiModel } from '../src/index.js';

/** CRC-32 (IEEE 802.3), matching what the zip reader itself verifies. */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

type ZipEntrySpec = { name: string; content: string; method: 'stored' | 'deflate' };

/**
 * Builds a minimal, spec-valid ZIP archive (PKZIP APPNOTE local file
 * header + central directory + end-of-central-directory record) from
 * scratch, for testing `extractArchiModelXml` against real ZIP structure
 * without depending on any external file or third-party sample.
 */
function buildZip(entries: ZipEntrySpec[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8');
    const contentBytes = Buffer.from(entry.content, 'utf8');
    const compressionMethod = entry.method === 'stored' ? 0 : 8;
    const data = entry.method === 'stored' ? contentBytes : deflateRawSync(contentBytes);
    const checksum = crc32(contentBytes);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(checksum, 14); // crc32
    localHeader.writeUInt32LE(data.length, 18); // compressed size
    localHeader.writeUInt32LE(contentBytes.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    const localHeaderOffset = offset;
    localParts.push(localHeader, nameBytes, data);
    offset += localHeader.length + nameBytes.length + data.length;

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(checksum, 16); // crc32
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(contentBytes.length, 24);
    centralHeader.writeUInt16LE(nameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(localHeaderOffset, 42);
    centralParts.push(centralHeader, nameBytes);
  }

  const localSection = Buffer.concat(localParts);
  const centralSection = Buffer.concat(centralParts);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central directory start disk
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSection.length, 12);
  eocd.writeUInt32LE(localSection.length, 16); // central directory offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localSection, centralSection, eocd]);
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Zipped" id="model-zipped" version="5.0.0">
  <folder name="Business" id="folder-business" type="business">
    <element xsi:type="archimate:BusinessActor" name="Customer" id="element-customer"/>
  </folder>
</archimate:model>`;

describe('extractArchiModelXml', () => {
  it('returns plain XML text unchanged (not a zip)', () => {
    expect(extractArchiModelXml(Buffer.from(SAMPLE_XML, 'utf8'))).toBe(SAMPLE_XML);
  });

  it('extracts model.xml from a zip using the Stored (uncompressed) method', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'stored' }]);
    expect(extractArchiModelXml(zip)).toBe(SAMPLE_XML);
  });

  it('extracts model.xml from a zip using the Deflate method', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'deflate' }]);
    expect(extractArchiModelXml(zip)).toBe(SAMPLE_XML);
  });

  it('finds model.xml even when other entries (e.g. images/) come first', () => {
    const zip = buildZip([
      { name: 'images/icon.png', content: 'fake-png-bytes', method: 'stored' },
      { name: 'model.xml', content: SAMPLE_XML, method: 'deflate' },
    ]);
    expect(extractArchiModelXml(zip)).toBe(SAMPLE_XML);
  });

  it('the extracted XML round-trips through parseArchiModel', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'deflate' }]);
    const model = parseArchiModel(extractArchiModelXml(zip));
    expect(model.elements).toHaveLength(1);
    expect(model.elements[0]?.name).toBe('Customer');
  });

  it('throws a clear error when the zip has no model.xml entry', () => {
    const zip = buildZip([{ name: 'other.xml', content: SAMPLE_XML, method: 'stored' }]);
    expect(() => extractArchiModelXml(zip)).toThrow(/archimate-zip-missing-entry/);
  });

  it('throws when a Stored entry fails its CRC-32 check', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'stored' }]);
    zip[39] = zip[39]! + 1; // first payload byte: local header (30) + "model.xml" (9)
    expect(() => extractArchiModelXml(zip)).toThrow(/archimate-zip-crc-mismatch/);
  });

  it('rejects a Deflate entry whose compressed payload is corrupt', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'deflate' }]);
    zip[39] = zip[39]! + 1; // first compressed payload byte
    // Either zlib itself fails to inflate the corrupt stream, or — if it
    // inflates to garbage — our CRC-32 check catches it. Both are integrity
    // failures; the deterministic CRC path is covered by the test below.
    expect(() => extractArchiModelXml(zip)).toThrow();
  });

  it('rejects a zip whose central directory CRC does not match the payload', () => {
    const zip = buildZip([{ name: 'model.xml', content: SAMPLE_XML, method: 'deflate' }]);
    const centralHeaderOffset = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02])); // central directory signature
    const flipped = (zip.readUInt32LE(centralHeaderOffset + 16) ^ 0xffffffff) >>> 0;
    zip.writeUInt32LE(flipped, centralHeaderOffset + 16);
    expect(() => extractArchiModelXml(zip)).toThrow(/archimate-zip-crc-mismatch/);
  });

  it('handles UTF-8 content with multibyte characters correctly (plain XML path)', () => {
    const xmlWithUnicode = SAMPLE_XML.replace('Customer', 'Cliente é ñ 日本語');
    expect(extractArchiModelXml(Buffer.from(xmlWithUnicode, 'utf8'))).toBe(xmlWithUnicode);
  });

  it('handles UTF-8 content with multibyte characters correctly (zip path)', () => {
    const xmlWithUnicode = SAMPLE_XML.replace('Customer', 'Cliente é ñ 日本語');
    const zip = buildZip([{ name: 'model.xml', content: xmlWithUnicode, method: 'deflate' }]);
    expect(extractArchiModelXml(zip)).toBe(xmlWithUnicode);
  });
});
