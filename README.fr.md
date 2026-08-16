# archi-semantic-core

[![npm version](./docs/badges/version.svg)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License](./docs/badges/license.svg)](./LICENSE)

[![English](./docs/badges/lang-en.svg)](README.md) [![Deutsch](./docs/badges/lang-de.svg)](README.de.md) [![Español](./docs/badges/lang-es.svg)](README.es.md) [![Français](./docs/badges/lang-fr-active.svg)](README.fr.md) [![Nederlands](./docs/badges/lang-nl.svg)](README.nl.md) [![Português](./docs/badges/lang-pt.svg)](README.pt.md) [![中文](./docs/badges/lang-zh.svg)](README.zh.md)

Un parseur TypeScript pour les fichiers de modèle `.archimate` natifs créés
par l'éditeur de bureau [Archi](https://www.archimatetool.com/).

`archi-semantic-core` lit le format XML natif d'Archi et le convertit en un
`ArchiModel` propre et fortement typé, contenant les dossiers, éléments,
relations, vues, objets de diagramme, connexions de diagramme, notes,
propriétés, styles visuels, Specializations/Profiles, ainsi que les détails
sémantiques natifs nécessaires pour travailler avec le modèle sans avoir à
comprendre la structure XML d'Archi. Il lit également la variante archive zip
du format de fichier `.archimate`.

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## Table des matières

- [À quoi sert ce paquet](#à-quoi-sert-ce-paquet)
- [Ce que ce paquet n'est pas](#ce-que-ce-paquet-nest-pas)
- [Où cela s'inscrit](#où-cela-sinscrit)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [Types publics](#types-publics)
- [Types natifs et sémantiques](#types-natifs-et-sémantiques)
- [Index automatiques de contenance et de connexion](#index-automatiques-de-contenance-et-de-connexion)
- [Géométrie : bounds et bendpoints](#géométrie--bounds-et-bendpoints)
- [Sémantique de Junction](#sémantique-de-junction)
- [Attributs natifs spécifiques aux relations](#attributs-natifs-spécifiques-aux-relations)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [Style visuel](#style-visuel)
- [Entrées natives `<feature>` et Label Expressions](#entrées-natives-feature-et-label-expressions)
- [Specializations et Profiles](#specializations-et-profiles)
- [Fichiers `.archimate` compressés (zip)](#fichiers-archimate-compressés-zip)
- [Validation](#validation)
- [Ce qui est couvert](#ce-qui-est-couvert)
- [Ce qui est hors périmètre](#ce-qui-est-hors-périmètre)
- [Prérequis et format de module](#prérequis-et-format-de-module)
- [Développement](#développement)
- [Principe de conception](#principe-de-conception)
- [Ça vous a été utile ?](#ça-vous-a-été-utile)
- [Licence](#licence)

## À quoi sert ce paquet

Utilisez ce paquet lorsque vous devez travailler par programmation avec un
modèle Archi tout en gardant le parsing indépendant du rendu, de l'édition,
des règles de qualité ou de la conversion vers un autre format d'échange.

Le parseur se concentre sur deux responsabilités :

- préserver les informations natives d'Archi qui appartiennent au modèle
  sémantique ;
- exposer ces informations via une API TypeScript petite et typée.

Il ne réinterprète pas le modèle pour un autre standard.

## Ce que ce paquet n'est pas

Ce paquet analyse le format de fichier `.archimate` **natif** d'Archi
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — le format
qu'Archi lui-même lit et écrit sur disque.

Ce n'est **pas** un parseur ni un générateur pour le
[ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/),
et il ne comporte ni UI, ni éditeur, ni moteur de rendu, ni moteur de routage
de diagrammes.

Ce sont des préoccupations distinctes qui relèvent de paquets séparés.

Ce projet n'est ni affilié à, ni approuvé par, Archi, le projet Archi Tool,
ou The Open Group.

## Où cela s'inscrit

`archi-semantic-core` est la première pierre angulaire de l'écosystème
Continuous-DrivenArchitecture : il fournit le graphe de connaissances d'Archi —
un modèle fidèle et typé de la façon dont un design est construit dans l'éditeur
Archi — que les outils en aval consommeront pour l'analyse d'impact, la
détection de dérive et l'évolution de l'architecture.

## Installation

```sh
npm install @cda/archi-semantic-core
```

## Utilisation

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
// p. ex. "ApplicationComponent", pas "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` accepte uniquement du texte XML. Lire un fichier depuis le
disque, utiliser la File API du navigateur, ou récupérer du XML via le
réseau relève de la responsabilité de l'appelant. Cela permet d'utiliser le
paquet depuis Node.js, des bundlers de navigateur et des tests, sans le
coupler à un environnement d'E/S particulier.

Archi peut également enregistrer un fichier `.archimate` sous forme
d'archive zip (il le fait automatiquement dès que le modèle contient des
images embarquées). Lisez les octets bruts et passez-les d'abord à
`extractArchiModelXml` si le fichier peut se présenter sous l'une ou l'autre
forme :

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml, parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MonModele.archimate');
const xml = extractArchiModelXml(bytes); // gère le XML brut ou une archive zip
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

Parse du texte XML natif d'Archi en un modèle sémantique.

Lève une exception lorsque l'entrée n'est pas une chaîne de caractères ou
que le XML n'est pas bien formé.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Vérifie l'intégrité structurelle d'un modèle déjà parsé — identifiants
manquants/dupliqués, références rompues, valeurs natives de Junction non
résolues. Voir [Validation](#validation) pour la liste complète des
vérifications.

Ce validateur n'est pas un linter de qualité d'architecture d'entreprise. Un
modèle peut être structurellement valide tout en représentant une mauvaise
architecture.

### `extractArchiModelXml(bytes: Uint8Array): string`

Renvoie le texte XML du modèle à partir des octets bruts d'un fichier
`.archimate`, qu'il s'agisse de XML brut ou de la variante archive zip
d'Archi (`model.xml` plus une entrée `images/` par icône personnalisée
embarquée, le tout compressé ensemble — voir
[Fichiers `.archimate` compressés (zip)](#fichiers-archimate-compressés-zip)).
Passez le résultat à `parseArchiModel`.

Lève une exception si l'entrée ressemble à un zip mais ne contient pas
d'entrée `model.xml`, utilise une méthode de compression autre que
Stored/Deflate (Archi n'écrit jamais autre chose), ou est un zip
tronqué/corrompu.

### `getLabelExpression(features: ArchiFeature[]): string | null`

Renvoie la chaîne brute du modèle de Label Expression (p. ex.
`"${name}\n${property:First}"`) depuis les `features` d'un objet de
diagramme/connexion/note, ou `null` si aucune n'est définie. Voir
[Entrées natives `<feature>` et Label Expressions](#entrées-natives-feature-et-label-expressions).

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

Évalue une Label Expression par rapport au modèle, en résolvant `${name}`,
`${documentation}`, `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${content}`, `${type}`, `${strength}`,
`${accessType}`, `${wordwrap:count:expression}`, `${if:...}` et `${nvl:...}`
— y compris les expressions imbriquées dans les arguments d'une autre
expression. Renvoie `null` lorsque l'objet ne possède aucune feature
`labelExpression`.

### Types publics

Le paquet exporte :

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

## Types natifs et sémantiques

Les éléments et relations exposent les deux valeurs suivantes :

- `xsiType` : la valeur XML native, par exemple `"archimate:BusinessActor"` ;
- `type` : la valeur sémantique, débarrassée du préfixe de namespace, par
  exemple `"BusinessActor"`.

Cette dérivation est générique. Le parseur n'a pas besoin de coder en dur
chaque type Archi possible à l'avance.

Les références croisées telles que `sourceId`, `targetId`,
`archimateElementId`, `referencedModelId`, ainsi que les extrémités des
connexions de diagramme, sont de simples identifiants sous forme de chaîne
de caractères.

Le paquet ne fournit volontairement pas d'assistants de recherche (lookup
helpers). Les appelants ayant besoin de recherches répétées peuvent
construire leurs propres index `Map<string, ...>` adaptés à leur cas
d'usage.

## Index automatiques de contenance et de connexion

Le XML natif n'exprime la contenance que par imbrication (un `<child>` à
l'intérieur d'un `<child>`, un `<folder>` à l'intérieur d'un `<folder>`).
`parseArchiModel` effectue une passe de dérivation supplémentaire en O(n)
pour que chaque parent dispose déjà des identifiants de ses enfants
précalculés, dans l'ordre du fichier source — sans qu'il soit nécessaire de
parcourir l'arbre du côté de l'appelant :

```ts
interface ArchiView {
  diagramObjectIds: string[];     // objets de diagramme enfants directs (non imbriqués)
  diagramConnectionIds: string[]; // toutes les connexions de la vue, à toute profondeur d'imbrication
  noteIds: string[];              // notes enfants directes (non imbriquées)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // objets de diagramme imbriqués directement dans celui-ci
  connectionIds: string[];  // connexions dont la source est cet objet de diagramme
}

interface ArchiFolder {
  containedIds: string[];   // éléments/relations/vues directement à l'intérieur (pas les sous-dossiers)
}
```

La hiérarchie des sous-dossiers s'exprime dans l'autre sens : parcourez le
`parentId` propre à chaque dossier plutôt que de le chercher dans le
`containedIds` d'un parent.

## Géométrie : bounds et bendpoints

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

**Les propriétés `ArchiBounds.x`/`.y` d'un objet de diagramme ou d'une note
imbriqué(e) sont relatives à l'origine de son propre parent, et non à des
coordonnées absolues du canevas** — c'est ainsi qu'Archi lui-même stocke
nativement la géométrie imbriquée. Un objet de diagramme avec `parentId:
'group-1'` et `bounds: { x: 10, y: 10, ... }` se trouve 10px à droite et
10px en dessous du coin supérieur gauche de `group-1`, et non de la vue.
Pour obtenir des coordonnées absolues, additionnez `x`/`y` en remontant la
chaîne des `parentId` jusqu'à la racine. Les objets de niveau racine
(`parentId === null`) ont déjà des coordonnées relatives à la vue
(c'est-à-dire absolues).

Chacun des quatre champs d'`ArchiBounds` peut être `null` indépendamment des
autres — le parseur n'invente jamais de `0` pour un attribut
`x`/`y`/`width`/`height` manquant ou non numérique. `validateArchiModel` ne
vérifie pas que les bounds sont complets ; traitez un champ `null` comme
« impossible à positionner », de la même manière que le mapper de
`archi-open-exchange`.

Les valeurs d'`ArchiBendpoint` suivent la représentation native propre
d'Archi : chaque bendpoint stocke sa propre paire début/fin plutôt qu'un
unique point médian, ce qui permet de reconstruire une connexion courbe sans
logique géométrique supplémentaire.

## Sémantique de Junction

Archi stocke l'identité AND/OR d'un Junction au moyen d'un attribut natif
`type` distinct du `xsi:type` de l'élément.

Pour un Junction, le parseur expose à la fois la valeur sémantique
interprétée et la valeur native d'origine :

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

Les règles de décodage sont les suivantes :

| `type` natif du Junction | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| absent | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| toute autre valeur | `null` | valeur d'origine |

Les valeurs natives inconnues ne sont jamais devinées ni écartées.

`parseArchiModel` continue de fonctionner sans erreur, tandis que
`validateArchiModel` signale `unrecognized-junction-type` pour un Junction
dont la valeur native ne peut pas être résolue.

Pour tout élément qui n'est pas un Junction :

```ts
junctionType === null
rawJunctionType === null
```

## Attributs natifs spécifiques aux relations

### Access

`AccessRelationship.accessType` est exposé comme suit :

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

Cette valeur est décodée à partir de la représentation native `0`-`3`
d'Archi.

Pour une `AccessRelationship`, le champ est toujours résolu vers une
valeur. Lorsque l'attribut natif est absent, le parseur utilise la valeur
par défaut native d'Archi : `'Write'`.

Pour tout autre type de relation, `accessType` vaut `null`.

### Influence

`InfluenceRelationship.strength` contient le modificateur natif en texte
libre, par exemple `"+"`.

Il vaut `null` pour tout autre type de relation, ainsi que lorsque la
valeur native est vide ou absente.

### Association

`AssociationRelationship.directed` est résolu en booléen pour les relations
d'association, avec `false` comme valeur par défaut native lorsque
l'attribut est absent.

Pour tout autre type de relation, `directed` vaut `null`.

## Style visuel

Les objets de diagramme, connexions et notes exposent leurs couleurs
natives de remplissage/ligne/police et leur police, lorsqu'elles sont
définies :

```ts
interface ArchiStyle {
  fillColor: string | null;   // p. ex. "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // chaîne native SWT FontData, telle quelle
  fontName: string | null;    // décodée depuis `font`
  fontSize: number | null;    // décodée depuis `font`, en points
  fontStyle: ArchiFontStyle | null; // { bold, italic }, décodé depuis `font`
  lineWidth: number | null;   // pixels
  alpha: number | null;       // opacité de remplissage, 0-255 ; toujours `null` sur une Connection (pas de remplissage)
}
```

`node.style` vaut `null` — et non un objet dont tous les champs valent
`null` — lorsqu'aucun des champs `fillColor`/`lineColor`/`fontColor`/`font`/
`lineWidth`/`alpha` n'est défini, ce qui permet à l'appelant de distinguer à
moindre coût « aucun style enregistré » de « style enregistré, mais tout est
non défini ».

`fontName`/`fontSize`/`fontStyle` sont décodés à partir de la sérialisation
native `FontData.toString()` de SWT propre à Archi (p. ex.
`"1|Segoe UI|9.0|1|WINDOWS|...|700|..."` : version-de-format | nom |
taille(pt) | masque-de-style | plateforme | ...données de police natives).
Seuls les quatre premiers champs sont décodés ; une chaîne qui ne respecte
pas cette forme laisse ces trois champs à `null` tout en préservant la
chaîne `font` brute — elle n'est jamais devinée.

Le sélecteur natif de figure/icône alternative d'un `DiagramObject` est
également exposé tel quel, sans interprétation (sa signification dépend de
la figure, décidée par l'UI propre d'Archi selon le type d'élément) :

```ts
interface ArchiDiagramObject {
  figureType: string | null; // attribut natif `type` brut, p. ex. "0" ou "1"
}
```

Le code natif de routage des connexions d'une `ArchiView` est exposé de la
même manière — tel quel, sans interprétation, car la propre numérotation
d'Archi pour cet attribut a déjà changé une fois (la valeur `1` a été
réservée puis abandonnée dans le code source d'Archi) :

```ts
interface ArchiView {
  connectionRouterType: number | null; // attribut natif brut : 0 = points de courbure manuels, 2 = orthogonal
}
```

## Entrées natives `<feature>` et Label Expressions

Les objets de diagramme, connexions et notes exposent tel quel les entrées
d'extensibilité génériques d'Archi `<feature name="..." value="..."/>` :

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

L'usage le plus connu de ce mécanisme concerne les
[Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)
(`name="labelExpression"`), qui personnalisent le texte affiché par un objet
de diagramme à la place du simple nom de l'élément. Deux fonctions
permettent de les manipuler :

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" — le modèle, non évalué

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" — évalué par rapport au modèle
```

`resolveLabelExpression` prend en charge les placeholders « core » du wiki
— ceux qui se résolvent à partir du seul objet, sans parcourir le graphe du
modèle : `${name}`, `${documentation}`, `${content}` (Notes), `${type}`,
`${strength}`, `${accessType}` (connexions Access/Influence),
`${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${wordwrap:count:expression}`,
`${if:cond:val}`, `${if:cond:val1:val2}` et `${nvl:cond:val}` — y compris
les expressions imbriquées dans les arguments d'une autre expression (p.
ex. `${if:${property:key}:<<${property:key}>>}`).

Il ne prend **pas** en charge les formes « Reference Prefix » du wiki
(`$parent{...}`, `$source{...}`, `$model{...}`, `$<relationship>:source{...}`,
etc.), qui nécessitent de parcourir le graphe du modèle (vue/dossier
parent, relations connectées) plutôt que de simplement lire l'objet
lui-même. Celles-ci sont laissées telles quelles, non résolues, dans le
résultat — jamais supprimées silencieusement. `${specialization}` et
`${viewpoint}` restent également non résolus.

Pour un `DiagramObject` adossé à un `archimateElementId`, les placeholders
se résolvent par rapport à l'`ArchiElement` sous-jacent. Pour un
`DiagramConnection` adossé à un `archimateRelationshipId`, ils se résolvent
par rapport à l'`ArchiRelationship` sous-jacente. Pour un Group/
`DiagramModelReference` (sans élément sous-jacent), seuls `${name}`/`${type}`
se résolvent, à partir du `name`/`xsiType` propre de l'objet visuel ;
`${documentation}`/`${property:*}` se résolvent alors en chaîne vide.

## Specializations et Profiles

Les Specializations d'Archi (sous-types nommés, affichés dans l'UI sous la
forme `<<Nom>>`) et les Profiles génériques (ensembles réutilisables et
nommés de propriétés) sont tous deux des éléments natifs `<profile>` à la
racine du modèle, qui ne se distinguent que par un booléen :

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // le type ArchiMate auquel il est restreint, le cas échéant
  specialization: boolean;      // true = Specialization, false = Profile générique
  imagePath: string | null;     // référence vers une icône personnalisée, non résolue en octets
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

`specialization` vaut `true` par défaut (la valeur par défaut d'EMF
documentée par Archi lui-même) lorsque l'attribut natif est absent — ce qui
correspond à la façon dont la sérialisation EMF/XMI omet les attributs
égaux à leur valeur par défaut déclarée.

Les éléments et relations référencent les profiles par id :

```ts
interface ArchiElement {
  profiles: string[]; // valeurs d'ArchiProfile.id ; vide si aucune n'est définie
}

interface ArchiRelationship {
  profiles: string[]; // même forme — les Specializations s'appliquent aussi aux relations
}
```

Ceci est confirmé par le code source d'Archi lui-même (l'EClass `Profile`
d'`archimate.ecore` et `IProfile.java`), et pas seulement par l'observation
de fichiers d'exemple.

## Fichiers `.archimate` compressés (zip)

Archi enregistre automatiquement un modèle sous forme d'archive zip —
`model.xml` plus une entrée `images/` par icône personnalisée embarquée, le
tout sous la même extension `.archimate` — dès que le modèle contient des
images embarquées et n'est pas stocké dans un dossier suivi par git (le
propre `ArchiveManager` d'Archi préfère une disposition XML brut + dossier
`images/` adjacent à l'intérieur des dossiers git, afin que les binaires
d'images restent adaptés au diff). Un fichier `.archimate` au format zip
est binaire, pas textuel — le lire avec un décodeur de texte avant de
détecter le format le corromprait de manière irrécupérable.

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml, parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MonModele.archimate'); // lu en tant qu'octets, pas en tant que texte
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` détecte la signature zip, puis soit décode
directement l'entrée comme du texte UTF-8 (XML brut), soit décompresse
l'archive et décode l'entrée `model.xml` (archive zip) — en utilisant le
module `zlib` intégré à Node, sans dépendance ajoutée. Les images
embarquées ne sont pas extraites ; utilisez `ArchiProfile.imagePath` ou le
chemin d'image d'un `DiagramModelImageProvider` uniquement comme référence
vers les entrées `images/` de l'archive si vous devez les localiser
vous-même.

## Validation

`validateArchiModel` construit un unique ensemble global d'identifiants
couvrant les sept collections porteuses d'id (folders, elements,
relationships, views, diagram objects, diagram connections, notes — Archi
puise tous les id, sémantiques comme visuels, dans un même pool partagé),
puis effectue les vérifications suivantes :

| Code | Déclenché par |
| --- | --- |
| `missing-id` | Une entrée n'a pas d'`id` du tout. |
| `duplicate-id` | Le même `id` apparaît sur plusieurs entrées, n'importe où dans le modèle. |
| `broken-relationship-source` | Le `sourceId` d'une relation ne résout vers aucun id connu. |
| `broken-relationship-target` | Le `targetId` d'une relation ne résout vers aucun id connu. |
| `unrecognized-junction-type` | L'attribut natif `type` d'un élément `Junction` n'est ni `""`/absent (And) ni `"or"` (Or). |
| `broken-diagram-object-element` | L'`archimateElementId` d'un objet de diagramme ne résout vers aucun id connu. |
| `broken-diagram-object-model-reference` | Le `referencedModelId` d'un `DiagramModelReference` ne résout vers aucun id connu. |
| `broken-diagram-connection-relationship` | L'`archimateRelationshipId` d'une connexion ne résout vers aucun id connu. |
| `broken-diagram-connection-source` | Le `sourceId` d'une connexion ne résout vers aucun id connu. |
| `broken-diagram-connection-target` | Le `targetId` d'une connexion ne résout vers aucun id connu. |

Chaque problème porte un localisateur `path` (p. ex.
`"relationships[rel-1].sourceId"`) vers l'`ArchiModel` renvoyé — pas vers
le XML d'origine — afin de pouvoir le retracer directement jusqu'au champ
en cause.

`{ valid: true, errors: [] }` signifie que chaque entrée porteuse d'un id a
un id unique et non vide, et que chaque référence croisée vérifiée par ce
validateur se résout — cela ne vérifie ni l'exhaustivité d'`ArchiBounds`,
ni les références `ArchiProfile`/`profiles`, ni rien qui concerne le style
ou les features.

## Ce qui est couvert

- Métadonnées du modèle : id, nom, version native, `purpose` et propriétés
  au niveau du modèle.
- Dossiers, y compris les dossiers vides, la hiérarchie, le chemin, la
  documentation et les propriétés.
- Éléments et relations ArchiMate préservés de façon générique.
- Index précalculés de contenance/connexion (`childrenIds`, `connectionIds`,
  `diagramObjectIds`, `diagramConnectionIds`, `noteIds`, `containedIds`) —
  aucun parcours d'arbre nécessaire pour savoir ce qui se trouve où.
- Sémantique native AND/OR des Junctions.
- Attributs spécifiques aux relations Access, Influence et Association.
- Vues avec `viewpoint` natif, `connectionRouterType`, objets de diagramme
  imbriqués, notes, connexions et bendpoints.
- Nœuds `DiagramModelReference`, y compris `referencedModelId`.
- Conteneurs visuels génériques tels que le `Group` d'Archi, y compris leur
  propre `documentation` et leur sélecteur natif de figure/icône
  alternative (`figureType`).
- Documentation et propriétés.
- Style visuel : couleurs de remplissage/ligne/police, nom/taille/gras/
  italique de police, épaisseur de ligne, opacité de remplissage (`alpha`).
- Entrées d'extensibilité génériques `<feature>` d'Archi, et les Label
  Expressions construites dessus (chaîne brute du modèle et résultat
  évalué pour l'ensemble de placeholders « core »).
- Specializations et Profiles génériques, ainsi que les éléments/relations
  qui les référencent.
- Les deux formes de fichier `.archimate` : XML brut, et la variante
  archive zip d'Archi.
- Validation structurelle (`validateArchiModel`) : id manquants/dupliqués
  et références rompues sur les sept collections porteuses d'id — voir
  [Validation](#validation).
- Références de caractères XML numériques telles que `&#xD;&#xA;`,
  décodées en texte.

Les collections préservent l'ordre du XML source.

## Ce qui est hors périmètre

- Import ou export au format ArchiMate Model Exchange File Format.
- Édition ou mutation d'un modèle.
- Sérialisation d'un `ArchiModel` en XML `.archimate` natif.
- Rendu, diagramme, routage automatique ou UI.
- Extraction des *octets* d'images embarquées d'un fichier `.archimate` au
  format zip — seule la chaîne de référence `imagePath` est préservée.
- Les formes « Reference Prefix » des Label Expressions (`$parent{...}`,
  `$source{...}`, `$model{...}`, `$<relationship>:source{...}`, etc.), qui
  nécessitent de parcourir le graphe du modèle plutôt que de lire un seul
  objet. Les placeholders `${specialization}` et `${viewpoint}` ne sont
  pas non plus évalués.
- Les vues Sketch et Canvas d'Archi en tant qu'`ArchiView` sémantiques.
  Celles-ci utilisent des types racine hors namespace `archimate:` et sont
  préservées de façon générique plutôt que réinterprétées comme des vues
  ArchiMate.

## Prérequis et format de module

Node.js :

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

Le paquet est exclusivement ESM :

```json
{
  "type": "module"
}
```

CommonJS `require('@cda/archi-semantic-core')` n'est pas
pris en charge.

Un bundler de navigateur moderne peut également consommer le paquet.

## Développement

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Principe de conception

`archi-semantic-core` doit comprendre **la sémantique native d'Archi**.

Il ne doit pas savoir comment un autre format, moteur de rendu, éditeur ou
standard d'échange choisit de représenter cette sémantique.

Cette frontière permet au parseur de rester réutilisable comme fondation
pour d'autres outils Continuous-DrivenArchitecture.

## Ça vous a été utile ?

Si `archi-semantic-core` vous a évité d'avoir à faire de la rétro-ingénierie du
format `.archimate` natif d'Archi vous-même, pensez à mettre une ⭐ au projet.
Cela aide d'autres développeurs travaillant avec Archi à le découvrir.

## Licence

MIT — voir [LICENSE](./LICENSE).
