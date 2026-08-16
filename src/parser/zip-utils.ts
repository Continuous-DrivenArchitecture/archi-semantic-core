import { inflateRawSync } from 'node:zlib';

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const END_OF_CENTRAL_DIRECTORY_MIN_SIZE = 22;
/** ZIP allows a trailing comment up to 65535 bytes after the EOCD record; scan that far back at most. */
const MAX_COMMENT_SIZE = 0xffff;

const MODEL_ENTRY_NAME = 'model.xml';
const STORED = 0;
const DEFLATE = 8;

/** Precomputed CRC-32 (IEEE 802.3) lookup table — implementation kept local so no Node version-specific `zlib.crc32` availability is assumed. */
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

/**
 * Reads a `.archimate` file's raw bytes and returns the model XML text,
 * whether the file is plain XML or the zip-archive variant Archi's own
 * `ArchiveManager` writes when a model has embedded images (`model.xml` +
 * an `images/` entry per custom icon, zipped together under the same
 * `.archimate` extension — see Archi's own source, not just observed
 * samples: `useArchiveFormat()`/`saveModelToArchiveFile()` in
 * `com.archimatetool.editor.model.impl.ArchiveManager`).
 *
 * Pass the result to {@link parseArchiModel}. Kept as a separate step
 * (rather than folded into `parseArchiModel` itself) so that function's
 * `(xml: string) => ArchiModel` contract never changes: callers who know
 * their input is always plain XML text can keep calling it directly.
 *
 * Only the `model.xml` entry is decoded; embedded images are not
 * extracted (see {@link ArchiProfile.imagePath} for how to locate them by
 * name if needed — this function does not resolve image bytes).
 *
 * Throws if the input looks like a zip but has no `model.xml` entry, uses
 * a compression method other than Stored/Deflate (Archi never writes
 * anything else), fails its CRC-32 integrity check, or is a
 * truncated/corrupt zip.
 */
export function extractArchiModelXml(bytes: Uint8Array): string {
  if (!looksLikeZip(bytes)) {
    return decodeUtf8(bytes);
  }

  const buffer = toBuffer(bytes);
  const centralDirectory = readEndOfCentralDirectory(buffer);
  const entry = findEntry(buffer, centralDirectory, MODEL_ENTRY_NAME);
  if (!entry) {
    throw new Error(`archimate-zip-missing-entry: no "${MODEL_ENTRY_NAME}" entry found in the zip archive`);
  }

  const data = readEntryData(buffer, entry);
  if (crc32(data) !== entry.crc32) {
    throw new Error('archimate-zip-crc-mismatch: model.xml failed its CRC-32 integrity check');
  }
  return decodeUtf8(data);
}

function looksLikeZip(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  );
}

function toBuffer(bytes: Uint8Array): Buffer {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function decodeUtf8(bytes: Uint8Array): string {
  return Buffer.isBuffer(bytes) ? bytes.toString('utf8') : Buffer.from(bytes).toString('utf8');
}

interface CentralDirectoryLocation {
  offset: number;
  entryCount: number;
}

/** Scans backward for the End Of Central Directory record — its offset is not fixed when a trailing zip comment is present. */
function readEndOfCentralDirectory(buffer: Buffer): CentralDirectoryLocation {
  const searchStart = Math.max(0, buffer.length - END_OF_CENTRAL_DIRECTORY_MIN_SIZE - MAX_COMMENT_SIZE);
  for (let position = buffer.length - END_OF_CENTRAL_DIRECTORY_MIN_SIZE; position >= searchStart; position -= 1) {
    if (buffer.readUInt32LE(position) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return {
        entryCount: buffer.readUInt16LE(position + 10),
        offset: buffer.readUInt32LE(position + 16),
      };
    }
  }
  throw new Error('archimate-zip-invalid: could not find the End Of Central Directory record');
}

interface ZipEntry {
  compressionMethod: number;
  compressedSize: number;
  crc32: number;
  localHeaderOffset: number;
}

function findEntry(buffer: Buffer, location: CentralDirectoryLocation, name: string): ZipEntry | null {
  let offset = location.offset;

  for (let i = 0; i < location.entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error('archimate-zip-invalid: malformed central directory entry');
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

    if (fileName === name) {
      return { compressionMethod, compressedSize, crc32: buffer.readUInt32LE(offset + 16), localHeaderOffset };
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return null;
}

function readEntryData(buffer: Buffer, entry: ZipEntry): Buffer {
  const { localHeaderOffset } = entry;
  if (buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error('archimate-zip-invalid: malformed local file header');
  }

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  switch (entry.compressionMethod) {
    case STORED:
      return compressedData;
    case DEFLATE:
      return inflateRawSync(compressedData);
    default:
      throw new Error(`archimate-zip-unsupported-compression: compression method ${entry.compressionMethod} is not supported`);
  }
}
