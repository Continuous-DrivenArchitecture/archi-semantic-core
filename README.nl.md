# archi-semantic-core

[![npm version](./.github/assets/badges/version.svg?v=0.4.0)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License](./.github/assets/badges/license.svg)](./LICENSE)

[![English](./.github/assets/badges/lang-en.svg)](README.md) [![Deutsch](./.github/assets/badges/lang-de.svg)](README.de.md) [![Español](./.github/assets/badges/lang-es.svg)](README.es.md) [![Français](./.github/assets/badges/lang-fr.svg)](README.fr.md) [![Nederlands](./.github/assets/badges/lang-nl-active.svg)](README.nl.md) [![Português](./.github/assets/badges/lang-pt.svg)](README.pt.md) [![中文](./.github/assets/badges/lang-zh.svg)](README.zh.md)

Een TypeScript-parser voor native `.archimate`-modelbestanden, gemaakt door de
desktop-editor [Archi](https://www.archimatetool.com/).

`archi-semantic-core` leest het native XML-formaat van Archi en zet dit om in
een schoon, sterk getypeerd `ArchiModel` met folders, elementen, relaties,
views, diagramobjecten, diagramverbindingen, notities, eigenschappen, visuele
styling, Specializations/Profiles en de native semantische details die nodig
zijn om met het model te werken zonder de XML-structuur van Archi te hoeven
kennen. Het leest ook de zip-archiefvariant van het `.archimate`-bestandsformaat.

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## Inhoudsopgave

- [Waarvoor dit pakket dient](#waarvoor-dit-pakket-dient)
- [Wat dit pakket niet is](#wat-dit-pakket-niet-is)
- [Waar dit past](#waar-dit-past)
- [Installatie](#installatie)
- [Gebruik](#gebruik)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [Publieke types](#publieke-types)
- [Ruwe en semantische types](#ruwe-en-semantische-types)
- [Automatische indexen voor containment en verbindingen](#automatische-indexen-voor-containment-en-verbindingen)
- [Geometrie: bounds en bendpoints](#geometrie-bounds-en-bendpoints)
- [Semantiek van Junction](#semantiek-van-junction)
- [Relatiespecifieke native attributen](#relatiespecifieke-native-attributen)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [Visuele styling](#visuele-styling)
- [Native `<feature>`-items en Label Expressions](#native-feature-items-en-label-expressions)
- [Specializations en Profiles](#specializations-en-profiles)
- [Gecomprimeerde `.archimate`-bestanden (zip)](#gecomprimeerde-archimate-bestanden-zip)
- [Validatie](#validatie)
- [Prestaties](#prestaties)
- [Voorbeelden](#voorbeelden)
- [Wat wordt ondersteund](#wat-wordt-ondersteund)
- [Wat buiten scope valt](#wat-buiten-scope-valt)
- [Vereisten en moduleformaat](#vereisten-en-moduleformaat)
- [Ontwikkeling](#ontwikkeling)
- [Ontwerpprincipe](#ontwerpprincipe)
- [Handig gevonden?](#handig-gevonden)
- [Licentie](#licentie)

## Waarvoor dit pakket dient

Gebruik dit pakket wanneer je programmatisch met een Archi-model wilt werken,
waarbij het parsen losstaat van rendering, bewerking, kwaliteitsregels of
conversie naar een uitwisselingsformaat.

De parser richt zich op twee verantwoordelijkheden:

- het bewaren van Archi-native informatie die tot het semantische model
  behoort;
- het beschikbaar stellen van die informatie via een kleine, getypeerde
  TypeScript-API.

Het herinterpreteert het model niet voor een andere standaard.

## Wat dit pakket niet is

Dit pakket parseert het **native** `.archimate`-bestandsformaat van Archi
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — het formaat dat
Archi zelf op schijf leest en schrijft.

Het is **geen** parser of generator voor het
[ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/),
en het bevat geen UI, editor, renderer of diagram-routing-engine.

Dat zijn afzonderlijke verantwoordelijkheden die in aparte pakketten
thuishoren.

Dit project is niet gelieerd aan en wordt niet onderschreven door Archi, het
Archi Tool-project of The Open Group.

## Waar dit past

`archi-semantic-core` is de eerste hoeksteen van het
Continuous-DrivenArchitecture-ecosysteem: een getrouwe, getypeerde semantische
weergave van hoe een ontwerp in de Archi-editor is opgebouwd. Downstream-tools
gebruiken die weergave voor impactanalyse, driftdetectie en
architectuurevolutie — lagen die er bovenop een navigeerbare graaf kunnen
bouwen, in plaats van dat dit pakket er zelf een probeert te zijn.

## Installatie

```sh
npm install @cda/archi-semantic-core
```

## Gebruik

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
// bijv. "ApplicationComponent", niet "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` accepteert uitsluitend XML-tekst. Het inlezen van een
bestand vanaf schijf, het gebruik van de File API in de browser, of het
ophalen van XML via een netwerk is de verantwoordelijkheid van de aanroepende
code. Zo blijft het pakket bruikbaar vanuit Node.js, browser-bundlers en
tests, zonder afhankelijk te zijn van een specifieke I/O-omgeving.

Archi kan een `.archimate`-bestand ook als zip-archief opslaan (dit gebeurt
automatisch zodra het model ingesloten afbeeldingen bevat). Lees de ruwe bytes
in en geef ze eerst door aan `extractArchiModelXml` als het bestand een van
beide vormen kan hebben:

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate');
const xml = extractArchiModelXml(bytes); // verwerkt zowel platte XML als een zip-archief
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

Parseert native XML-tekst van Archi naar een semantisch model.

Gooit een exception wanneer de invoer geen string is of het XML niet
welgevormd is.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Controleert de structurele integriteit van een al geparseerd model —
ontbrekende/dubbele identifiers, losstaande referenties, onopgeloste native
Junction-waarden. Zie [Validatie](#validatie) voor de volledige lijst met
controles.

Deze validator is geen linter voor de kwaliteit van enterprise-architectuur.
Een model kan structureel geldig zijn en toch een slechte architectuur
weergeven.

### `extractArchiModelXml(bytes: Uint8Array): string`

> Alleen Node: geëxporteerd vanuit het subpad
> `@cda/archi-semantic-core/archive` (gebruikt `node:zlib`; de root-entrypoint
> blijft browser-veilig).

Geeft de XML-tekst van het model terug op basis van de ruwe bytes van een
`.archimate`-bestand, ongeacht of het bestand platte XML is of Archi's
zip-archiefvariant (`model.xml` plus een `images/`-item per ingesloten custom
icoon, samen gezipt — zie
[Gecomprimeerde `.archimate`-bestanden (zip)](#gecomprimeerde-archimate-bestanden-zip)).
Geef het resultaat door aan `parseArchiModel`.

Gooit een exception als de invoer eruitziet als een zip maar geen
`model.xml`-item bevat, een andere compressiemethode gebruikt dan
Stored/Deflate (Archi schrijft nooit iets anders), de CRC-32-integriteitscontrole
niet doorstaat, of een afgekapte/corrupte
zip is.

### `getLabelExpression(features: ArchiFeature[]): string | null`

Geeft de ruwe Label Expression-templatestring terug (bijv.
`"${name}\n${property:First}"`) uit de `features` van een
diagramobject/-verbinding/notitie, of `null` als er geen is ingesteld. Zie
[Native `<feature>`-items en Label Expressions](#native-feature-items-en-label-expressions).

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

Evalueert een Label Expression tegen het model, en lost `${name}`,
`${documentation}`, `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${content}`, `${type}`, `${strength}`,
`${accessType}`, `${wordwrap:count:expression}`, `${if:...}` en `${nvl:...}`
op — inclusief expressies die genest zijn in de argumenten van een andere
expressie. Geeft `null` terug wanneer het object helemaal geen
`labelExpression`-feature heeft.

### Publieke types

Het pakket exporteert:

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

## Ruwe en semantische types

Elementen en relaties bieden allebei:

- `xsiType`: de native XML-waarde, bijvoorbeeld
  `"archimate:BusinessActor"`;
- `type`: de semantische waarde zonder namespace-prefix, bijvoorbeeld
  `"BusinessActor"`.

Deze afleiding is generiek. De parser hoeft niet elk mogelijk Archi-type van
tevoren hard-coded te kennen.

Kruisverwijzingen zoals `sourceId`, `targetId`, `archimateElementId`,
`referencedModelId` en de eindpunten van diagramverbindingen zijn gewone
string-identifiers.

Het pakket levert bewust geen lookup-helpers mee. Aanroepende code die
herhaalde lookups nodig heeft, kan zelf `Map<string, ...>`-indexen bouwen die
passen bij de eigen workload.

## Automatische indexen voor containment en verbindingen

Het native XML drukt containment alleen uit via nesting (een `<child>` binnen
een `<child>`, een `<folder>` binnen een `<folder>`). `parseArchiModel` voert
één extra O(n)-afleidingsstap uit, zodat elke parent de id's van zijn
children al vooraf berekend heeft, in bron-volgorde — zonder dat de
aanroepende code zelf de boom hoeft te doorlopen:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // directe-child diagramobjecten (niet genest)
  diagramConnectionIds: string[]; // elke verbinding in de view, op elke nesting-diepte
  noteIds: string[];              // directe-child notities (niet genest)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // diagramobjecten die direct binnen dit object genest zijn
  connectionIds: string[];  // verbindingen waarvan dit diagramobject de source is
}

interface ArchiFolder {
  containedIds: string[];   // elementen/relaties/views die er direct in zitten (geen sub-folders)
}
```

De hiërarchie van sub-folders wordt andersom uitgedrukt: doorloop de eigen
`parentId` van elke folder, in plaats van deze te zoeken in de
`containedIds` van een parent.

## Geometrie: bounds en bendpoints

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

**`ArchiBounds.x`/`.y` van een genest diagramobject of notitie zijn relatief
ten opzichte van de oorsprong van de eigen parent, niet absolute
canvas-coördinaten** — zo slaat Archi zelf geneste geometrie native op. Een
diagramobject met `parentId: 'group-1'` en `bounds: { x: 10, y: 10, ... }`
staat 10px rechts en 10px onder de linkerbovenhoek van `group-1` zelf, niet
van de view. Om absolute coördinaten te krijgen, tel je `x`/`y` bij elkaar op
langs de hele `parentId`-keten tot aan de root. Objecten op root-niveau
(`parentId === null`) hebben al view-relatieve (dus absolute) coördinaten.

Elk van de vier `ArchiBounds`-velden kan onafhankelijk van elkaar `null` zijn
— de parser verzint nooit een `0` voor een ontbrekend of niet-numeriek
`x`/`y`/`width`/`height`-attribuut. `validateArchiModel` controleert niet of
bounds compleet zijn; behandel een `null`-veld als "kan niet worden
gepositioneerd", zoals de mapper van `archi-open-exchange` dat ook doet.

`ArchiBendpoint`-waarden volgen Archi's eigen native representatie: elk
bendpoint bewaart zijn eigen start/end-paar in plaats van één middelpunt,
waardoor een gebogen verbinding kan worden gereconstrueerd zonder extra
geometrische logica.

## Semantiek van Junction

Archi slaat de AND/OR-identiteit van een Junction op via een native
`type`-attribuut dat losstaat van het `xsi:type` van het element.

Voor een Junction toont de parser zowel de geïnterpreteerde semantische
waarde als de originele native waarde:

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

De decoderingsregels zijn:

| Native Junction `type` | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| afwezig | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| elke andere waarde | `null` | originele waarde |

Onbekende native waarden worden nooit geraden of weggegooid.

`parseArchiModel` slaagt nog steeds, terwijl `validateArchiModel`
`unrecognized-junction-type` rapporteert voor een Junction waarvan de native
waarde niet kan worden opgelost.

Voor elk element dat geen Junction is:

```ts
junctionType === null
rawJunctionType === null
```

## Relatiespecifieke native attributen

### Access

`AccessRelationship.accessType` wordt getoond als:

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

Deze waarde wordt gedecodeerd uit Archi's native `0`-`3`-representatie.

Voor een `AccessRelationship` wordt dit veld altijd naar een waarde opgelost.
Wanneer het native attribuut ontbreekt, gebruikt de parser Archi's eigen
native default: `'Write'`.

Voor elk ander relatietype is `accessType` gelijk aan `null`.

### Influence

`InfluenceRelationship.strength` bevat de native vrije-tekstmodifier,
bijvoorbeeld `"+"`.

Deze waarde is `null` voor elk ander relatietype, en ook wanneer de native
waarde leeg of afwezig is.

### Association

`AssociationRelationship.directed` wordt voor associatierelaties naar een
boolean opgelost, waarbij `false` als native default geldt wanneer het
attribuut ontbreekt.

Voor elk ander relatietype is `directed` gelijk aan `null`.

## Visuele styling

Diagramobjecten, verbindingen en notities tonen hun native vul-/lijn-/
letterkleuren en lettertype, indien ingesteld:

```ts
interface ArchiStyle {
  fillColor: string | null;   // bijv. "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // letterlijke native SWT FontData-string
  fontName: string | null;    // gedecodeerd uit `font`
  fontSize: number | null;    // gedecodeerd uit `font`, in punten
  fontStyle: ArchiFontStyle | null; // { bold, italic }, gedecodeerd uit `font`
  lineWidth: number | null;   // pixels
  alpha: number | null;       // vulopacity, 0-255; altijd null bij een Connection (geen vulling)
}
```

`node.style` is `null` — geen object met elk veld op `null` — wanneer geen
van `fillColor`/`lineColor`/`fontColor`/`font`/`lineWidth`/`alpha` is
ingesteld, zodat aanroepende code goedkoop onderscheid kan maken tussen "geen
styling vastgelegd" en "styling vastgelegd, maar alles niet ingesteld".

`fontName`/`fontSize`/`fontStyle` worden gedecodeerd uit Archi's eigen
SWT-`FontData.toString()`-serialisatie (bijv.
`"1|Segoe UI|9.0|1|WINDOWS|...|700|..."`: formaatversie | naam | grootte(pt) |
stijl-bitmask | platform | ...native lettertypedata). Alleen de eerste vier
velden worden gedecodeerd; een string die niet deze vorm heeft, laat deze
drie velden op `null` staan, terwijl de ruwe `font`-string wel bewaard blijft
— nooit geraden.

De native alternatieve figuur-/icoonselector van een `DiagramObject` wordt
ook letterlijk en ongeïnterpreteerd getoond (de betekenis is figuurspecifiek
en wordt per elementtype bepaald door de UI van Archi zelf):

```ts
interface ArchiDiagramObject {
  figureType: string | null; // ruw native `type`-attribuut, bijv. "0" of "1"
}
```

De native code voor connection-routing van een `ArchiView` wordt op dezelfde
manier getoond — letterlijk en ongeïnterpreteerd, omdat Archi's eigen
nummering hiervoor al eens is veranderd (een waarde `1` was gereserveerd en
is weer losgelaten in Archi's broncode):

```ts
interface ArchiView {
  connectionRouterType: number | null; // ruw native attribuut: 0 = handmatige bendpoints, 2 = orthogonaal
}
```

## Native `<feature>`-items en Label Expressions

Diagramobjecten, verbindingen en notities tonen letterlijk Archi's generieke
`<feature name="..." value="..."/>`-items voor uitbreidbaarheid:

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

Het bekendste gebruik van dit mechanisme zijn
[Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)
(`name="labelExpression"`), waarmee je aanpast welke tekst een diagramobject
toont in plaats van de gewone elementnaam. Twee functies werken hiermee:

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" — de template, niet geëvalueerd

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" — geëvalueerd tegen het model
```

`resolveLabelExpression` ondersteunt de "core"-placeholders uit de wiki — de
placeholders die op te lossen zijn vanuit het object zelf, zonder de
modelgraaf te doorlopen: `${name}`, `${documentation}`, `${content}` (Notes),
`${type}`, `${strength}`, `${accessType}` (Access/Influence-verbindingen),
`${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${wordwrap:count:expression}`,
`${if:cond:val}`, `${if:cond:val1:val2}` en `${nvl:cond:val}` — inclusief
expressies genest in de eigen argumenten van een andere expressie (bijv.
`${if:${property:key}:<<${property:key}>>}`).

Het ondersteunt **niet** de "Reference Prefix"-vormen uit de wiki
(`$parent{...}`, `$source{...}`, `$model{...}`, `$<relationship>:source{...}`,
enz.), die de modelgraaf moeten doorlopen (parent view/folder, verbonden
relaties) in plaats van alleen het object zelf te lezen. Die blijven
letterlijk en onopgelost in de uitvoer staan — nooit stilzwijgend
weggelaten. `${specialization}` en `${viewpoint}` worden evenmin opgelost.

Voor een `DiagramObject` die is gebaseerd op een `archimateElementId`, worden
placeholders opgelost tegen het onderliggende `ArchiElement`. Voor een
`DiagramConnection` die is gebaseerd op een `archimateRelationshipId`, worden
ze opgelost tegen de onderliggende `ArchiRelationship`. Voor een
Group/`DiagramModelReference` (zonder onderliggend element) worden alleen
`${name}`/`${type}` opgelost, vanuit de eigen `name`/`xsiType` van het
visuele object; `${documentation}`/`${property:*}` lossen in dat geval op
naar een lege string.

## Specializations en Profiles

De Specializations van Archi (benoemde subtypes die in de UI worden getoond
als `<<Name>>`) en generieke Profiles (herbruikbare, benoemde sets van
eigenschappen) zijn allebei native `<profile>`-elementen op de root van het
model, die alleen verschillen in één boolean:

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // het ArchiMate-type waartoe dit beperkt is, indien van toepassing
  specialization: boolean;      // true = Specialization, false = generieke Profile
  imagePath: string | null;     // referentie naar custom icoon, niet opgelost naar bytes
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

`specialization` staat standaard op `true` (Archi's eigen gedocumenteerde
EMF-default) wanneer het native attribuut ontbreekt — dit komt overeen met
hoe EMF/XMI-serialisatie attributen weglaat die gelijk zijn aan hun
gedeclareerde defaultwaarde.

Elementen en relaties verwijzen naar profiles via id:

```ts
interface ArchiElement {
  profiles: string[]; // waarden van ArchiProfile.id; leeg wanneer er geen zijn ingesteld
}

interface ArchiRelationship {
  profiles: string[]; // dezelfde vorm — Specializations gelden ook voor relaties
}
```

Dit is bevestigd aan de hand van Archi's eigen broncode (de `Profile`-EClass
uit `archimate.ecore` en `IProfile.java`), niet alleen op basis van
geobserveerde voorbeeldbestanden.

## Gecomprimeerde `.archimate`-bestanden (zip)

Archi slaat een model automatisch op als zip-archief — `model.xml` plus een
`images/`-item per ingesloten custom icoon, allemaal onder dezelfde
`.archimate`-extensie — zodra het model ingesloten afbeeldingen bevat en niet
is opgeslagen in een door git bijgehouden folder (Archi's eigen
`ArchiveManager` geeft de voorkeur aan een lay-out van platte XML plus een
naastliggende `images/`-folder binnen git-folders, zodat de
afbeeldingsbinaries diff-vriendelijk blijven). Een zip-vormig
`.archimate`-bestand is binair, geen tekst — het inlezen met een tekstdecoder
vóórdat het formaat wordt gedetecteerd, beschadigt het onherstelbaar.

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate'); // lees als bytes, niet als tekst
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` detecteert de zip-signature, en decodeert de invoer
ofwel direct als UTF-8-tekst (platte XML), ofwel unzipt deze en decodeert het
`model.xml`-item (zip-archief) — met behulp van Node's ingebouwde `zlib`,
zonder extra dependency. Ingesloten afbeeldingen worden niet uitgepakt;
gebruik `ArchiProfile.imagePath` of het image path van een
`DiagramModelImageProvider` alleen als referentie naar de `images/`-items in
het archief, als je ze zelf moet lokaliseren.

## Validatie

`validateArchiModel` bouwt één globale set van id's die alle zeven
collecties met id's omvat (folders, elements, relationships, views, diagram
objects, diagram connections, notes — Archi haalt elke id, semantisch en
visueel, uit één gedeelde pool), en controleert vervolgens:

| Code | Wordt veroorzaakt door |
| --- | --- |
| `missing-id` | Een item heeft helemaal geen `id`. |
| `duplicate-id` | Dezelfde `id` komt voor bij meer dan één item, ergens in het model. |
| `broken-relationship-source` | De `sourceId` van een relatie verwijst naar geen enkele bekende id. |
| `broken-relationship-target` | De `targetId` van een relatie verwijst naar geen enkele bekende id. |
| `unrecognized-junction-type` | Het native `type`-attribuut van een `Junction`-element is niet `""`/afwezig (And) of `"or"` (Or). |
| `broken-diagram-object-element` | De `archimateElementId` van een diagramobject verwijst naar geen enkele bekende id. |
| `broken-diagram-object-model-reference` | De `referencedModelId` van een `DiagramModelReference` verwijst naar geen enkele bekende id. |
| `broken-diagram-connection-relationship` | De `archimateRelationshipId` van een verbinding verwijst naar geen enkele bekende id. |
| `broken-diagram-connection-source` | De `sourceId` van een verbinding verwijst naar geen enkele bekende id. |
| `broken-diagram-connection-target` | De `targetId` van een verbinding verwijst naar geen enkele bekende id. |

Elk issue heeft een `path`-locator (bijv. `"relationships[rel-1].sourceId"`)
naar het teruggegeven `ArchiModel` — niet naar de originele XML — zodat het
rechtstreeks kan worden herleid naar het veld dat is misgegaan.

`{ valid: true, errors: [] }` betekent dat elk item met een id een unieke,
niet-lege id heeft en dat elke kruisverwijzing die deze validator controleert
oplosbaar is — het controleert niet of `ArchiBounds` compleet is, niet de
referenties van `ArchiProfile`/`profiles`, en niets dat met styling of
features te maken heeft.

## Prestaties

Parsen en validatie schalen **lineair** met de grootte van het model: ids
en kruisverwijzingen worden in één keer geïndexeerd in `Map`/`Set`-passes
zonder herhaling, zodat geen codepad `model.elements`/`model.relationships`
per item opnieuw doorzoekt. `resolveLabelExpression` is **O(1) per node** —
de opzoekingen van element/relatie lopen via per-model gecachte
`Map`-indexen, waardoor het oplossen van label expressions voor alle
diagramobjects van een groot model goedkoop blijft.

Een prestatietest voor regressie (`test/performance.test.ts`) dwingt dit
af: het parst en valideert een synthetisch model van 20.000 elementen,
20.000 relaties en 20.000 diagramobjects binnen een vast tijdsbudget, en
controleert dat de parse-tijd lineair groeit wanneer de modelgrootte
verdubbelt.

## Voorbeelden

Kopieerklare consumptie-recepten voor het geparste model — `.archimate`-
bestanden lezen (XML of zip), indexeren en bevragen, impactanalyse over de
relatiegraaf, validatie als pipeline-gate en het oplossen van label
expressions. Zie [examples/README.md](examples/README.md).

## Wat wordt ondersteund

- Modelmetadata: id, naam, native versie, `purpose` en eigenschappen op
  modelniveau.
- Folders, inclusief lege folders, hiërarchie, path, documentatie en
  eigenschappen.
- ArchiMate-elementen en -relaties, generiek bewaard.
- Vooraf berekende containment-/verbindingsindexen (`childrenIds`,
  `connectionIds`, `diagramObjectIds`, `diagramConnectionIds`, `noteIds`,
  `containedIds`) — geen boom-doorloop nodig om te weten wat waarin zit.
- Native AND/OR-semantiek van Junction.
- Relatiespecifieke attributen voor Access, Influence en Association.
- Views met native `viewpoint`, `connectionRouterType`, geneste
  diagramobjecten, notities, verbindingen en bendpoints.
- `DiagramModelReference`-nodes, inclusief `referencedModelId`.
- Generieke visuele containers zoals Archi's `Group`, inclusief hun eigen
  `documentation` en native alternatieve figuur-/icoonselector
  (`figureType`).
- Documentatie en eigenschappen.
- Visuele styling: vul-/lijn-/letterkleuren, letternaam/-grootte/vet/cursief,
  lijndikte, vulopacity (`alpha`).
- Archi's generieke `<feature>`-uitbreidbaarheidsitems, en Label Expressions
  die daarop zijn gebouwd (ruwe templatestring en geëvalueerd resultaat voor
  de "core"-placeholderset).
- Specializations en generieke Profiles, en welke elementen/relaties ernaar
  verwijzen.
- Beide `.archimate`-bestandsvormen: platte XML en Archi's
  zip-archiefvariant.
- Structurele validatie (`validateArchiModel`): ontbrekende/dubbele id's en
  losstaande referenties in alle zeven collecties met id's — zie
  [Validatie](#validatie).
- Numerieke XML-tekenreferenties zoals `&#xD;&#xA;`, gedecodeerd naar tekst.

Collecties bewaren de volgorde van de bron-XML.

## Wat buiten scope valt

- Import of export van het ArchiMate Model Exchange File Format.
- Het bewerken of muteren van een model.
- Het terugserialiseren van een `ArchiModel` naar native `.archimate`-XML.
- Rendering, diagrammering, automatische routing of UI.
- Het extraheren van ingesloten *afbeeldingsbytes* uit een zip-vormig
  `.archimate`-bestand — alleen de referentiestring `imagePath` wordt
  bewaard.
- De "Reference Prefix"-vormen van Label Expressions (`$parent{...}`,
  `$source{...}`, `$model{...}`, `$<relationship>:source{...}`, enz.), die de
  modelgraaf moeten doorlopen in plaats van één enkel object te lezen. De
  placeholders `${specialization}` en `${viewpoint}` worden evenmin
  geëvalueerd.
- Archi Sketch- en Canvas-views als semantische `ArchiView`'s. Deze gebruiken
  root-types die niet bij `archimate:` horen en worden generiek bewaard in
  plaats van geherinterpreteerd als ArchiMate-views.

## Vereisten en moduleformaat

Node.js:

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

Het pakket is uitsluitend ESM:

```json
{
  "type": "module"
}
```

CommonJS `require('@cda/archi-semantic-core')` wordt niet
ondersteund.

Een moderne browser-bundler kan het pakket ook gebruiken.

## Ontwikkeling

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Ontwerpprincipe

`archi-semantic-core` moet **de native modelsemantiek van Archi** begrijpen.

Het hoeft niet te weten hoe een ander formaat, renderer, editor of
uitwisselingsstandaard ervoor kiest om die semantiek weer te geven.

Die grens houdt de parser herbruikbaar als fundament voor andere tooling van
Continuous-DrivenArchitecture.

## Handig gevonden?

Als `archi-semantic-core` je ervoor behoedde om zelf het native
`.archimate`-formaat van Archi te reverse-engineeren, overweeg dan om het
project een ⭐ te geven. Het helpt andere ontwikkelaars die met Archi werken
om het te ontdekken.

## Licentie

MIT — zie [LICENSE](./LICENSE).
