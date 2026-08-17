# archi-semantic-core

[![npm version](./.github/assets/badges/version.svg?v=0.4.1)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License](./.github/assets/badges/license.svg)](./LICENSE)

[![English](./.github/assets/badges/lang-en.svg)](README.md) [![Deutsch](./.github/assets/badges/lang-de-active.svg)](README.de.md) [![Español](./.github/assets/badges/lang-es.svg)](README.es.md) [![Français](./.github/assets/badges/lang-fr.svg)](README.fr.md) [![Nederlands](./.github/assets/badges/lang-nl.svg)](README.nl.md) [![Português](./.github/assets/badges/lang-pt.svg)](README.pt.md) [![中文](./.github/assets/badges/lang-zh.svg)](README.zh.md)

Ein TypeScript-Parser für native `.archimate`-Modelldateien, die mit dem
Desktop-Editor [Archi](https://www.archimatetool.com/) erstellt wurden.

`archi-semantic-core` liest das native XML-Format von Archi und wandelt es in
ein sauberes, stark typisiertes `ArchiModel` um, das Ordner, Elemente,
Beziehungen, Views, Diagrammobjekte, Diagrammverbindungen, Notizen,
Eigenschaften, visuelle Gestaltung, Specializations/Profiles sowie die
nativen semantischen Details enthält, die zum Arbeiten mit dem Modell nötig
sind, ohne die interne XML-Struktur von Archi zu kennen. Außerdem liest es
die ZIP-Archiv-Variante des `.archimate`-Dateiformats.

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## Inhaltsverzeichnis

- [Wofür dieses Paket gedacht ist](#wofür-dieses-paket-gedacht-ist)
- [Was dieses Paket nicht ist](#was-dieses-paket-nicht-ist)
- [Wo es einzuordnen ist](#wo-es-einzuordnen-ist)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [Öffentliche Typen](#öffentliche-typen)
- [Native und semantische Typen](#native-und-semantische-typen)
- [Automatische Indizes für Containment und Verbindungen](#automatische-indizes-für-containment-und-verbindungen)
- [Geometrie: bounds und bendpoints](#geometrie-bounds-und-bendpoints)
- [Junction-Semantik](#junction-semantik)
- [Beziehungsspezifische native Attribute](#beziehungsspezifische-native-attribute)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [Visuelle Gestaltung](#visuelle-gestaltung)
- [Native `<feature>`-Einträge und Label Expressions](#native-feature-einträge-und-label-expressions)
- [Specializations und Profiles](#specializations-und-profiles)
- [Komprimierte `.archimate`-Dateien (ZIP)](#komprimierte-archimate-dateien-zip)
- [Validierung](#validierung)
- [Leistung](#leistung)
- [Beispiele](#beispiele)
- [Was abgedeckt wird](#was-abgedeckt-wird)
- [Was außerhalb des Umfangs liegt](#was-außerhalb-des-umfangs-liegt)
- [Anforderungen und Modulformat](#anforderungen-und-modulformat)
- [Entwicklung](#entwicklung)
- [Designprinzip](#designprinzip)
- [Nützlich gefunden?](#nützlich-gefunden)
- [Lizenz](#lizenz)

## Wofür dieses Paket gedacht ist

Verwenden Sie dieses Paket, wenn Sie programmatisch mit einem Archi-Modell
arbeiten möchten und dabei das Parsen unabhängig von Rendering, Bearbeitung,
Qualitätsregeln oder der Konvertierung in andere Austauschformate halten
wollen.

Der Parser konzentriert sich auf zwei Aufgaben:

- das Bewahren nativer Archi-Informationen, die zum semantischen Modell gehören;
- das Bereitstellen dieser Informationen über eine kleine, typisierte TypeScript-API.

Er interpretiert das Modell nicht für einen anderen Standard neu.

## Was dieses Paket nicht ist

Dieses Paket parst das **native** `.archimate`-Dateiformat von Archi
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — das Format,
das Archi selbst auf der Festplatte liest und schreibt.

Es ist **kein** Parser oder Generator für das
[ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/)
und besitzt weder UI noch Editor, Renderer oder eine Engine für
Diagramm-Routing.

Das sind eigenständige Belange und gehören in separate Pakete.

Dieses Projekt steht in keiner Verbindung zu Archi, dem Archi-Tool-Projekt
oder The Open Group und wird von keinem von ihnen unterstützt oder
befürwortet.

## Wo es einzuordnen ist

`archi-semantic-core` ist der erste Grundstein des
Continuous-DrivenArchitecture-Ökosystems: eine getreue, typisierte semantische
Darstellung davon, wie ein Entwurf im Archi-Editor aufgebaut ist. Nachgelagerte
Werkzeuge nutzen diese Darstellung für Wirkungsanalyse,
Abweichungserkennung und Architekturentwicklung — Schichten, die darüber einen
navigierbaren Graphen aufbauen können, statt dass dieses Paket selbst einer sein
will.

## Installation

```sh
npm install @cda/archi-semantic-core
```

## Verwendung

```ts
import {
  parseArchiModel,
  validateArchiModel,
} from '@cda/archi-semantic-core';

const model = parseArchiModel(xml);

console.log(model.elements);
console.log(model.relationships);
console.log(model.views);

console.log(model.elements[0].type);
// z. B. "ApplicationComponent", nicht "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` akzeptiert ausschließlich XML-Text. Das Einlesen einer
Datei von der Festplatte, die Verwendung der File API des Browsers oder das
Abrufen von XML über das Netzwerk liegt in der Verantwortung des Aufrufers.
Dadurch bleibt das Paket in Node.js, Browser-Bundlern und Tests einsetzbar,
ohne an eine bestimmte I/O-Umgebung gekoppelt zu sein.

Archi kann eine `.archimate`-Datei auch als ZIP-Archiv speichern (das
geschieht automatisch, sobald das Modell eingebettete Bilder enthält). Lesen
Sie die rohen Bytes ein und übergeben Sie sie zunächst an
`extractArchiModelXml`, falls die Datei in beiden Formen vorliegen könnte:

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate');
const xml = extractArchiModelXml(bytes); // verarbeitet reines XML oder ein ZIP-Archiv
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

Parst nativen Archi-XML-Text zu einem semantischen Modell.

Wirft eine Exception, wenn die Eingabe kein String ist oder das XML nicht
wohlgeformt ist.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Prüft die strukturelle Integrität eines bereits geparsten Modells — fehlende
bzw. doppelte Identifikatoren, hängende Referenzen, nicht auflösbare native
Junction-Werte. Siehe [Validierung](#validierung) für die vollständige Liste
der Prüfungen.

Dieser Validator ist kein Linter für die Qualität der
Unternehmensarchitektur. Ein Modell kann strukturell gültig sein und
trotzdem eine schlechte Architektur abbilden.

### `extractArchiModelXml(bytes: Uint8Array): string`

> Nur Node: exportiert aus dem Unterpfad `@cda/archi-semantic-core/archive`
> (nutzt `node:zlib`; der Root-Einstiegspunkt bleibt browser-sicher).

Liefert den XML-Text des Modells aus den rohen Bytes einer
`.archimate`-Datei, unabhängig davon, ob die Datei reines XML oder Archis
ZIP-Archiv-Variante ist (`model.xml` plus einen `images/`-Eintrag pro
eingebettetem benutzerdefiniertem Icon, gemeinsam gezippt — siehe
[Komprimierte `.archimate`-Dateien (ZIP)](#komprimierte-archimate-dateien-zip)).
Übergeben Sie das Ergebnis an `parseArchiModel`.

Wirft eine Exception, wenn die Eingabe wie ein ZIP aussieht, aber keinen
`model.xml`-Eintrag enthält, eine andere Komprimierungsmethode als
Stored/Deflate verwendet (Archi schreibt nie etwas anderes), die
CRC-32-Integritätsprüfung nicht besteht oder ein
abgeschnittenes/beschädigtes ZIP ist.

### `getLabelExpression(features: ArchiFeature[]): string | null`

Liefert den rohen Label-Expression-Template-String (z. B.
`"${name}\n${property:First}"`) aus den `features` eines
Diagrammobjekts/einer Verbindung/einer Notiz, oder `null`, wenn keine
gesetzt ist. Siehe
[Native `<feature>`-Einträge und Label Expressions](#native-feature-einträge-und-label-expressions).

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

Wertet eine Label Expression gegen das Modell aus und löst `${name}`,
`${documentation}`, `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${content}`, `${type}`, `${strength}`,
`${accessType}`, `${wordwrap:count:expression}`, `${if:...}` und `${nvl:...}`
auf — einschließlich Ausdrücken, die innerhalb der Argumente eines anderen
Ausdrucks verschachtelt sind. Gibt `null` zurück, wenn das Objekt überhaupt
kein `labelExpression`-Feature besitzt.

### Öffentliche Typen

Das Paket exportiert:

- `ArchiModel`
- `ArchiModelMetadata`
- `ArchiFolder`
- `ArchiElement`
- `ArchiJunctionType`
- `ArchiRelationship`
- `ArchiAccessType`
- `ArchiView`
- `ArchiDiagramObject`
- `ArchiDiagramConnection`
- `ArchiNote`
- `ArchiBounds`
- `ArchiBendpoint`
- `ArchiStyle`
- `ArchiFontStyle`
- `ArchiFeature`
- `ArchiProfile`
- `ArchiProperty`
- `ArchiValidationResult`
- `ArchiValidationIssue`

## Native und semantische Typen

Elemente und Beziehungen stellen beide Werte bereit:

- `xsiType`: der native XML-Wert, zum Beispiel `"archimate:BusinessActor"`;
- `type`: der um das Namespace-Präfix bereinigte semantische Wert, zum
  Beispiel `"BusinessActor"`.

Diese Ableitung ist generisch. Der Parser muss nicht jeden möglichen
Archi-Typ im Voraus fest codiert haben.

Querverweise wie `sourceId`, `targetId`, `archimateElementId`,
`referencedModelId` und die Endpunkte von Diagrammverbindungen sind einfache
String-Identifikatoren.

Das Paket liefert absichtlich keine Lookup-Hilfsfunktionen mit. Aufrufer, die
wiederholte Lookups benötigen, können eigene `Map<string, ...>`-Indizes
passend zu ihrem jeweiligen Anwendungsfall aufbauen.

## Automatische Indizes für Containment und Verbindungen

Das native XML drückt Containment nur über Verschachtelung aus (ein
`<child>` innerhalb eines `<child>`, ein `<folder>` innerhalb eines
`<folder>`). `parseArchiModel` führt einen zusätzlichen O(n)-Ableitungsschritt
aus, sodass jedes übergeordnete Element die IDs seiner Kinder bereits
vorberechnet und in Quellreihenfolge vorliegen hat — ein Durchlaufen des
Baums auf Seiten des Aufrufers ist nicht nötig:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // direkte untergeordnete Diagrammobjekte (nicht verschachtelt)
  diagramConnectionIds: string[]; // jede Verbindung in der View, unabhängig von der Verschachtelungstiefe
  noteIds: string[];              // direkte untergeordnete Notizen (nicht verschachtelt)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // Diagrammobjekte, die direkt in diesem verschachtelt sind
  connectionIds: string[];  // Verbindungen, deren source dieses Diagrammobjekt ist
}

interface ArchiFolder {
  containedIds: string[];   // Elemente/Beziehungen/Views direkt darin (nicht Unterordner)
}
```

Die Unterordner-Hierarchie wird umgekehrt ausgedrückt: Folgen Sie der
`parentId` jedes Ordners selbst, statt sie im `containedIds` eines
übergeordneten Ordners zu suchen.

## Geometrie: bounds und bendpoints

```ts
interface ArchiBounds {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface ArchiBendpoint {
  startX: number | null;
  startY: number | null;
  endX: number | null;
  endY: number | null;
}
```

**`ArchiBounds.x`/`.y` eines verschachtelten Diagrammobjekts oder einer
verschachtelten Notiz sind relativ zum Ursprung des jeweiligen übergeordneten
Elements, nicht absolute Canvas-Koordinaten** — so speichert Archi selbst
verschachtelte Geometrie nativ. Ein Diagrammobjekt mit `parentId:
'group-1'` und `bounds: { x: 10, y: 10, ... }` befindet sich 10px rechts und
10px unterhalb der oberen linken Ecke von `group-1`, nicht der View. Um
absolute Koordinaten zu erhalten, summieren Sie `x`/`y` entlang der
`parentId`-Kette bis zur Wurzel. Objekte auf oberster Ebene (`parentId ===
null`) haben bereits view-relative (d. h. absolute) Koordinaten.

Jedes der vier `ArchiBounds`-Felder kann unabhängig voneinander `null` sein
— der Parser erfindet niemals eine `0` für ein fehlendes oder
nicht-numerisches `x`/`y`/`width`/`height`-Attribut. `validateArchiModel`
prüft nicht, ob bounds vollständig sind; behandeln Sie ein `null`-Feld als
"kann nicht positioniert werden", so wie es der Mapper von
`archi-open-exchange` tut.

`ArchiBendpoint`-Werte entsprechen Archis eigener nativer Darstellung: Jeder
Bendpoint speichert sein eigenes Start-/End-Paar statt eines einzelnen
Mittelpunkts, wodurch sich eine gebogene Verbindung ohne zusätzliche
Geometrielogik rekonstruieren lässt.

## Junction-Semantik

Archi speichert die AND/OR-Identität eines Junction über ein natives
`type`-Attribut, das vom `xsi:type` des Elements getrennt ist.

Für ein Junction stellt der Parser sowohl den interpretierten semantischen
Wert als auch den ursprünglichen nativen Wert bereit:

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

Die Dekodierungsregeln lauten:

| Natives Junction-`type` | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| fehlt | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| jeder andere Wert | `null` | ursprünglicher Wert |

Unbekannte native Werte werden niemals erraten oder verworfen.

`parseArchiModel` gelingt weiterhin, während `validateArchiModel`
`unrecognized-junction-type` meldet, wenn der native Wert eines Junction
nicht aufgelöst werden kann.

Für jedes Nicht-Junction-Element gilt:

```ts
junctionType === null
rawJunctionType === null
```

## Beziehungsspezifische native Attribute

### Access

`AccessRelationship.accessType` wird bereitgestellt als:

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

Es wird aus Archis nativer `0`-`3`-Darstellung dekodiert.

Bei einer `AccessRelationship` wird das Feld immer zu einem Wert aufgelöst.
Fehlt das native Attribut, verwendet der Parser Archis nativen Standardwert:
`'Write'`.

Bei jedem anderen Beziehungstyp ist `accessType` `null`.

### Influence

`InfluenceRelationship.strength` enthält den nativen Freitext-Modifikator,
zum Beispiel `"+"`.

Es ist `null` bei jedem anderen Beziehungstyp und auch dann, wenn der native
Wert leer oder nicht vorhanden ist.

### Association

`AssociationRelationship.directed` wird für Association-Beziehungen zu einem
Boolean aufgelöst, wobei `false` als nativer Standardwert verwendet wird,
wenn das Attribut fehlt.

Bei jedem anderen Beziehungstyp ist `directed` `null`.

## Visuelle Gestaltung

Diagrammobjekte, Verbindungen und Notizen stellen ihre nativen Füll-, Linien-
und Schriftfarben sowie ihre Schriftart bereit, sofern gesetzt:

```ts
interface ArchiStyle {
  fillColor: string | null;   // z. B. "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // nativer SWT-FontData-String, unverändert
  fontName: string | null;    // aus `font` dekodiert
  fontSize: number | null;    // aus `font` dekodiert, in Punkt
  fontStyle: ArchiFontStyle | null; // { bold, italic }, aus `font` dekodiert
  lineWidth: number | null;   // Pixel
  alpha: number | null;       // Fülldeckkraft, 0-255; bei einer Connection immer `null` (keine Füllung)
}
```

`node.style` ist `null` — nicht ein Objekt, bei dem jedes Feld `null` ist —
wenn keines von `fillColor`/`lineColor`/`fontColor`/`font`/`lineWidth`/`alpha`
gesetzt ist, sodass Aufrufer günstig zwischen "keine Formatierung
gespeichert" und "Formatierung gespeichert, aber alles ungesetzt"
unterscheiden können.

`fontName`/`fontSize`/`fontStyle` werden aus Archis eigener nativer
SWT-`FontData.toString()`-Serialisierung dekodiert (z. B.
`"1|Segoe UI|9.0|1|WINDOWS|...|700|..."`: Formatversion | Name | Größe(pt) |
Stil-Bitmaske | Plattform | ...native Schriftdaten). Nur die ersten vier
Felder werden dekodiert; ein String, der nicht diesem Format entspricht,
lässt diese drei Felder `null`, während der rohe `font`-String weiterhin
erhalten bleibt — niemals erraten.

Der native alternative Figur-/Icon-Selektor eines `DiagramObject` wird
ebenfalls unverändert und uninterpretiert bereitgestellt (seine Bedeutung ist
figurspezifisch und wird von Archis eigener UI pro Elementtyp festgelegt):

```ts
interface ArchiDiagramObject {
  figureType: string | null; // rohes natives `type`-Attribut, z. B. "0" oder "1"
}
```

Der native Connection-Routing-Code eines `ArchiView` wird auf dieselbe Weise
bereitgestellt — unverändert, uninterpretiert, da Archis eigene Nummerierung
dafür bereits einmal geändert wurde (ein Wert von `1` war reserviert und
wurde in Archis Quellcode entfernt):

```ts
interface ArchiView {
  connectionRouterType: number | null; // rohes natives Attribut: 0 = manuelle Bendpoints, 2 = orthogonal
}
```

## Native `<feature>`-Einträge und Label Expressions

Diagrammobjekte, Verbindungen und Notizen stellen Archis generische
`<feature name="..." value="..."/>`-Erweiterungseinträge unverändert bereit:

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

Die bekannteste Verwendung dieses Mechanismus sind
[Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)
(`name="labelExpression"`), die anpassen, welchen Text ein Diagrammobjekt
anstelle des einfachen Elementnamens anzeigt. Zwei Funktionen arbeiten damit:

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" — die Vorlage, unausgewertet

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" — gegen das Modell ausgewertet
```

`resolveLabelExpression` unterstützt die "Core"-Platzhalter des Wikis — jene,
die sich allein aus dem Objekt selbst auflösen lassen, ohne den
Modellgraphen zu durchlaufen: `${name}`, `${documentation}`, `${content}`
(Notes), `${type}`, `${strength}`, `${accessType}` (Access-/Influence-
Verbindungen), `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${wordwrap:count:expression}`,
`${if:cond:val}`, `${if:cond:val1:val2}` und `${nvl:cond:val}` —
einschließlich Ausdrücken, die innerhalb der Argumente eines anderen
Ausdrucks verschachtelt sind (z. B.
`${if:${property:key}:<<${property:key}>>}`).

Die "Reference Prefix"-Formen des Wikis (`$parent{...}`, `$source{...}`,
`$model{...}`, `$<relationship>:source{...}` usw.) werden **nicht**
unterstützt, da sie den Modellgraphen durchlaufen müssten (übergeordnete
View/Ordner, verbundene Beziehungen) statt nur das Objekt selbst zu lesen.
Diese bleiben unverändert und unaufgelöst in der Ausgabe erhalten — sie
werden nie stillschweigend verworfen. `${specialization}` und `${viewpoint}`
werden ebenfalls nicht aufgelöst.

Bei einem `DiagramObject`, das auf einer `archimateElementId` basiert, lösen
sich Platzhalter gegen das zugrunde liegende `ArchiElement` auf. Bei einer
`DiagramConnection`, die auf einer `archimateRelationshipId` basiert, lösen
sie sich gegen die zugrunde liegende `ArchiRelationship` auf. Bei einer
Group/`DiagramModelReference` (ohne zugrunde liegendes Element) lösen sich
nur `${name}`/`${type}` auf, ausgehend vom `name`/`xsiType` des visuellen
Objekts selbst; `${documentation}`/`${property:*}` lösen sich in diesem Fall
zu einem leeren String auf.

## Specializations und Profiles

Archis Specializations (benannte Untertypen, die in der UI als `<<Name>>`
angezeigt werden) und generische Profiles (wiederverwendbare, benannte
Mengen von Eigenschaften) sind beide native `<profile>`-Elemente an der
Modellwurzel, die sich nur durch einen Boolean unterscheiden:

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // der ArchiMate-Typ, auf den eingeschränkt wird, falls vorhanden
  specialization: boolean;      // true = Specialization, false = generisches Profile
  imagePath: string | null;     // Referenz auf benutzerdefiniertes Icon, nicht zu Bytes aufgelöst
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

`specialization` ist standardmäßig `true` (Archis eigener dokumentierter
EMF-Standardwert), wenn das native Attribut fehlt — das entspricht der Art,
wie die EMF/XMI-Serialisierung Attribute weglässt, die ihrem deklarierten
Standardwert entsprechen.

Elemente und Beziehungen referenzieren Profiles über die ID:

```ts
interface ArchiElement {
  profiles: string[]; // Werte von ArchiProfile.id; leer, wenn keine gesetzt sind
}

interface ArchiRelationship {
  profiles: string[]; // gleiche Form — Specializations gelten auch für Beziehungen
}
```

Dies ist gegen Archis eigenen Quellcode abgesichert (die `Profile`-EClass von
`archimate.ecore` und `IProfile.java`), nicht nur anhand beobachteter
Beispieldateien.

## Komprimierte `.archimate`-Dateien (ZIP)

Archi speichert ein Modell automatisch als ZIP-Archiv — `model.xml` plus
einen `images/`-Eintrag pro eingebettetem benutzerdefiniertem Icon, alles
unter derselben `.archimate`-Erweiterung — sobald das Modell eingebettete
Bilder enthält und nicht in einem Git-versionierten Ordner gespeichert ist
(Archis eigener `ArchiveManager` bevorzugt innerhalb von Git-Ordnern ein
Layout aus reinem XML plus einem benachbarten `images/`-Ordner, damit
Bild-Binärdaten diff-freundlich bleiben). Eine ZIP-Variante der
`.archimate`-Datei ist binär, nicht Text — sie vor der Formaterkennung mit
einem Text-Decoder zu lesen, würde sie unwiederbringlich beschädigen.

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate'); // als Bytes lesen, nicht als Text
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` erkennt die ZIP-Signatur und dekodiert die Eingabe
entweder direkt als UTF-8-Text (reines XML) oder entpackt sie und dekodiert
den `model.xml`-Eintrag (ZIP-Archiv) — unter Verwendung von Nodes
eingebautem `zlib`, ohne zusätzliche Abhängigkeit. Eingebettete Bilder werden
nicht extrahiert; verwenden Sie `ArchiProfile.imagePath` oder den Bildpfad
eines `DiagramModelImageProvider` nur als Referenz auf die
`images/`-Einträge des Archivs, falls Sie diese selbst lokalisieren müssen.

## Validierung

`validateArchiModel` baut eine einzige globale ID-Menge auf, die alle sieben
ID-tragenden Sammlungen umfasst (folders, elements, relationships, views,
diagram objects, diagram connections, notes — Archi bezieht alle IDs,
semantische wie visuelle, aus demselben gemeinsamen Pool), und prüft dann:

| Code | Ausgelöst durch |
| --- | --- |
| `missing-id` | Ein Eintrag hat überhaupt keine `id`. |
| `duplicate-id` | Dieselbe `id` tritt an mehr als einem Eintrag auf, an beliebiger Stelle im Modell. |
| `broken-relationship-source` | Die `sourceId` einer Beziehung lässt sich zu keiner bekannten ID auflösen. |
| `broken-relationship-target` | Die `targetId` einer Beziehung lässt sich zu keiner bekannten ID auflösen. |
| `unrecognized-junction-type` | Das native `type`-Attribut eines `Junction`-Elements ist weder `""`/fehlend (And) noch `"or"` (Or). |
| `broken-diagram-object-element` | Die `archimateElementId` eines Diagrammobjekts lässt sich zu keiner bekannten ID auflösen. |
| `broken-diagram-object-model-reference` | Die `referencedModelId` eines `DiagramModelReference` lässt sich zu keiner bekannten ID auflösen. |
| `broken-diagram-connection-relationship` | Die `archimateRelationshipId` einer Verbindung lässt sich zu keiner bekannten ID auflösen. |
| `broken-diagram-connection-source` | Die `sourceId` einer Verbindung lässt sich zu keiner bekannten ID auflösen. |
| `broken-diagram-connection-target` | Die `targetId` einer Verbindung lässt sich zu keiner bekannten ID auflösen. |

Jedes Issue trägt einen `path`-Locator (z. B.
`"relationships[rel-1].sourceId"`) in das zurückgegebene `ArchiModel` —
nicht in das ursprüngliche XML —, sodass es sich direkt bis zu dem Feld
zurückverfolgen lässt, das fehlgeschlagen ist.

`{ valid: true, errors: [] }` bedeutet, dass jeder ID-tragende Eintrag eine
eindeutige, nicht leere ID hat und jede Querreferenz, die dieser Validator
prüft, aufgelöst werden kann — er prüft weder die Vollständigkeit von
`ArchiBounds` noch `ArchiProfile`/`profiles`-Referenzen noch irgendetwas mit
Bezug zu Style oder Features.

## Leistung

Parsen und Validierung skalieren **linear** mit der Modellgröße: IDs und
Querreferenzen werden einmalig in einzelnen `Map`/`Set`-Durchläufen
indiziert, sodass kein Codepfad `model.elements`/`model.relationships` pro
Eintrag erneut durchsucht. `resolveLabelExpression` ist **O(1) pro Knoten**
— seine Element-/Beziehungs-Lookups laufen über pro Modell gecachte
`Map`-Indizes, wodurch das Auflösen von Label Expressions für alle
Diagrammobjekte eines großen Modells günstig bleibt.

Ein Performance-Regressionstest (`test/performance.test.ts`) erzwingt
dies: Er parst und validiert ein synthetisches Modell mit 20.000
Elementen, 20.000 Beziehungen und 20.000 Diagrammobjekten innerhalb eines
festen Zeitbudgets und prüft, dass die Parse-Zeit bei doppelter
Modellgröße linear wächst.

## Beispiele

Kopierfertige Konsum-Rezepte für das geparste Modell — `.archimate`-Dateien
lesen (XML oder ZIP), Indizierung und Abfragen, Impact-Analyse über den
Beziehungsgraphen, Validierung als Pipeline-Gate und Auflösung von Label
Expressions. Siehe [examples/README.md](examples/README.md).

## Was abgedeckt wird

- Modellmetadaten: id, name, native Version, `purpose` und Eigenschaften auf Modellebene.
- Ordner, einschließlich leerer Ordner, Hierarchie, Pfad, Dokumentation und Eigenschaften.
- ArchiMate-Elemente und -Beziehungen, generisch bewahrt.
- Vorberechnete Containment-/Verbindungs-ID-Indizes (`childrenIds`,
  `connectionIds`, `diagramObjectIds`, `diagramConnectionIds`, `noteIds`,
  `containedIds`) — kein Durchlaufen des Baums nötig, um herauszufinden, was
  in was enthalten ist.
- Native AND/OR-Semantik von Junction.
- Beziehungsspezifische Access-, Influence- und Association-Attribute.
- Views mit nativem `viewpoint`, `connectionRouterType`, verschachtelten
  Diagrammobjekten, Notizen, Verbindungen und Bendpoints.
- `DiagramModelReference`-Knoten, einschließlich `referencedModelId`.
- Generische visuelle Container wie Archis `Group`, einschließlich ihrer
  eigenen `documentation` und des nativen alternativen Figur-/Icon-Selektors
  (`figureType`).
- Dokumentation und Eigenschaften.
- Visuelle Gestaltung: Füll-/Linien-/Schriftfarben, Schriftname/-größe/
  -fett/-kursiv, Linienbreite, Fülldeckkraft (`alpha`).
- Archis generische `<feature>`-Erweiterungseinträge und darauf aufbauende
  Label Expressions (roher Vorlagen-String und ausgewertetes Ergebnis für
  das "Core"-Platzhalter-Set).
- Specializations und generische Profiles sowie die Elemente/Beziehungen,
  die sie referenzieren.
- Beide `.archimate`-Dateiformen: reines XML und Archis ZIP-Archiv-Variante.
- Strukturelle Validierung (`validateArchiModel`): fehlende/doppelte IDs und
  hängende Referenzen über alle sieben ID-tragenden Sammlungen hinweg —
  siehe [Validierung](#validierung).
- Numerische XML-Zeichenreferenzen wie `&#xD;&#xA;`, dekodiert in Text.

Sammlungen bewahren die Reihenfolge des Quell-XML.

## Was außerhalb des Umfangs liegt

- Import oder Export des ArchiMate Model Exchange File Format.
- Bearbeiten oder Verändern eines Modells.
- Serialisieren eines `ArchiModel` zurück in natives `.archimate`-XML.
- Rendering, Diagrammerstellung, automatisches Routing oder UI.
- Extrahieren der eingebetteten Bild-*Bytes* aus einer ZIP-Archiv-
  `.archimate`-Datei — nur der `imagePath`-Referenzstring wird bewahrt.
- Die "Reference Prefix"-Formen von Label Expressions (`$parent{...}`,
  `$source{...}`, `$model{...}`, `$<relationship>:source{...}` usw.), die
  den Modellgraphen durchlaufen müssten, statt ein einzelnes Objekt zu
  lesen. Die Platzhalter `${specialization}` und `${viewpoint}` werden
  ebenfalls nicht ausgewertet.
- Archis Sketch- und Canvas-Views als semantische `ArchiView`s. Diese
  verwenden Wurzeltypen außerhalb von `archimate:` und werden generisch
  bewahrt statt als ArchiMate-Views neu interpretiert.

## Anforderungen und Modulformat

Node.js:

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

Das Paket ist ausschließlich als ESM verfügbar:

```json
{
  "type": "module"
}
```

CommonJS `require('@cda/archi-semantic-core')` wird nicht
unterstützt.

Ein moderner Browser-Bundler kann das Paket ebenfalls verwenden.

## Entwicklung

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Designprinzip

`archi-semantic-core` soll **Archis native Modellsemantik** verstehen.

Es soll nicht wissen, wie ein anderes Format, Renderer, Editor oder
Austauschstandard diese Semantik repräsentiert.

Diese Grenze hält den Parser als Grundlage für weitere
Continuous-DrivenArchitecture-Werkzeuge wiederverwendbar.

## Nützlich gefunden?

Wenn `archi-semantic-core` dir erspart hat, Archis natives `.archimate`-Format
selbst per Reverse Engineering zu entschlüsseln, gib dem Projekt doch einen ⭐.
Es hilft anderen Entwicklern, die mit Archi arbeiten, es zu entdecken.

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
