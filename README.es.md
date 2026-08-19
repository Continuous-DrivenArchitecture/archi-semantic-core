# archi-semantic-core

[![npm version](./.github/assets/badges/version.svg?v=0.4.2)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License](./.github/assets/badges/license.svg)](./LICENSE)

[![English](./.github/assets/badges/lang-en.svg)](README.md) [![Deutsch](./.github/assets/badges/lang-de.svg)](README.de.md) [![Español](./.github/assets/badges/lang-es-active.svg)](README.es.md) [![Français](./.github/assets/badges/lang-fr.svg)](README.fr.md) [![Nederlands](./.github/assets/badges/lang-nl.svg)](README.nl.md) [![Português](./.github/assets/badges/lang-pt.svg)](README.pt.md) [![中文](./.github/assets/badges/lang-zh.svg)](README.zh.md)

[![Documentation](https://img.shields.io/badge/documentation-CDA_Developer_Portal-blue.svg?labelColor=0B5FFF&color=0A3F9E)](https://continuous-drivenarchitecture.github.io/docs)

Un parser de TypeScript para archivos de modelo `.archimate` nativos creados
por el editor de escritorio [Archi](https://www.archimatetool.com/).

`archi-semantic-core` lee el formato XML nativo de Archi y lo convierte en un
`ArchiModel` limpio y fuertemente tipado que contiene carpetas, elementos,
relaciones, vistas, objetos de diagrama, conexiones, notas, propiedades,
estilos visuales, Specializations/Profiles y los detalles semánticos nativos
necesarios para trabajar con el modelo sin conocer la estructura XML interna
de Archi. También lee la variante comprimida (zip) del formato `.archimate`.

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## Índice

- [Para qué sirve este paquete](#para-qué-sirve-este-paquete)
- [Qué NO es este paquete](#qué-no-es-este-paquete)
- [Dónde encaja](#dónde-encaja)
- [Documentación](#documentación)
- [Instalación](#instalación)
- [Uso](#uso)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [Tipos públicos](#tipos-públicos)
- [Tipos nativos y semánticos](#tipos-nativos-y-semánticos)
- [Índices automáticos de contención y conexión](#índices-automáticos-de-contención-y-conexión)
- [Geometría: bounds y bendpoints](#geometría-bounds-y-bendpoints)
- [Semántica de Junction](#semántica-de-junction)
- [Atributos nativos específicos de relaciones](#atributos-nativos-específicos-de-relaciones)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [Estilos visuales](#estilos-visuales)
- [Entradas nativas `<feature>` y Label Expressions](#entradas-nativas-feature-y-label-expressions)
- [Specializations y Profiles](#specializations-y-profiles)
- [Archivos `.archimate` comprimidos (zip)](#archivos-archimate-comprimidos-zip)
- [Validación](#validación)
- [Rendimiento](#rendimiento)
- [Ejemplos](#ejemplos)
- [Qué cubre](#qué-cubre)
- [Qué queda fuera del alcance](#qué-queda-fuera-del-alcance)
- [Seguridad](#seguridad)
- [Requisitos y formato de módulo](#requisitos-y-formato-de-módulo)
- [Desarrollo](#desarrollo)
- [Principio de diseño](#principio-de-diseño)
- [¿Te resultó útil?](#te-resultó-útil)
- [Licencia](#licencia)

## Para qué sirve este paquete

Usa este paquete cuando necesites trabajar programáticamente con un modelo de
Archi manteniendo el parsing separado del renderizado, la edición, las reglas
de calidad arquitectónica o la conversión hacia otros formatos.

El parser se concentra en dos responsabilidades:

- preservar la información nativa de Archi que pertenece al modelo semántico;
- exponer esa información mediante una API TypeScript pequeña y tipada.

No intenta reinterpretar el modelo para otro estándar.

## Qué NO es este paquete

Este paquete analiza el formato `.archimate` **nativo** de Archi
(`xmlns:archimate="http://www.archimatetool.com/archimate"`) — el formato que
el propio Archi lee y escribe en disco.

**No** es un parser ni un generador del
[ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/),
y no incluye UI, editor, renderer ni motor de routing de diagramas.

Esas son responsabilidades distintas y pertenecen a paquetes separados.

Este proyecto no está afiliado ni respaldado por Archi, el proyecto Archi
Tool ni The Open Group.

## Dónde encaja

`archi-semantic-core` es la primera piedra angular del ecosistema
Continuous-DrivenArchitecture: una representación semántica fiel y tipada de cómo
se construye un diseño en el editor Archi. Las herramientas posteriores consumen
esa representación para análisis de impacto,
detección de deriva y evolución de la arquitectura — capas que pueden construir
un grafo navegable encima, en lugar de que este paquete intente ser uno mismo.

## Documentación

La documentación completa está disponible en el
[CDA Developer Portal](https://continuous-drivenarchitecture.github.io/docs),
incluyendo guías de inicio, conceptos centrales, guías, la matriz de
compatibilidad y la referencia de API generada para esta librería.

## Instalación

```sh
npm install @cda/archi-semantic-core
```

## Uso

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
// p. ej. "ApplicationComponent", no "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` acepta únicamente texto XML. Leer un archivo desde disco,
usar la File API del navegador o descargar XML desde la red es responsabilidad
de quien llama a la función.

Esto mantiene el paquete utilizable desde Node.js, bundlers de navegador y
tests sin acoplarlo a un mecanismo específico de entrada/salida.

Archi también puede guardar un archivo `.archimate` como archivo comprimido
(zip) — lo hace automáticamente cuando el modelo tiene imágenes embebidas. Leé
los bytes crudos y pasalos primero por `extractArchiModelXml` si el archivo
puede ser de cualquiera de las dos formas:

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MiModelo.archimate');
const xml = extractArchiModelXml(bytes); // maneja XML plano o un archivo zip
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

Parsea XML nativo de Archi y devuelve un modelo semántico.

Lanza una excepción cuando la entrada no es un string o cuando el XML no está
bien formado.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Verifica la integridad estructural de un modelo ya parseado — identificadores
faltantes/duplicados, referencias rotas, valores nativos de Junction sin
resolver. Ver [Validación](#validación) para la lista completa de checks.

Este validator no es un linter de calidad de arquitectura empresarial. Un
modelo puede ser estructuralmente válido y, aun así, representar una mala
arquitectura.

### `extractArchiModelXml(bytes: Uint8Array): string`

> Solo Node: exportado desde el subpath `@cda/archi-semantic-core/archive`
> (usa `node:zlib`; el entrypoint raíz sigue siendo seguro para navegador).

Devuelve el texto XML del modelo a partir de los bytes crudos de un archivo
`.archimate`, sea XML plano o la variante comprimida (zip) de Archi
(`model.xml` más una entrada `images/` por cada ícono custom embebido,
comprimidos juntos — ver
[Archivos `.archimate` comprimidos (zip)](#archivos-archimate-comprimidos-zip)).
Pasá el resultado a `parseArchiModel`.

Lanza una excepción si el archivo parece un zip pero no tiene una entrada
`model.xml`, usa un método de compresión distinto de Stored/Deflate (Archi
nunca escribe otra cosa), falla la verificación de integridad CRC-32, o es
un zip truncado/corrupto.

### `getLabelExpression(features: ArchiFeature[]): string | null`

Devuelve el string crudo de la Label Expression (p. ej.
`"${name}\n${property:First}"`) desde los `features` de un objeto de
diagrama/conexión/nota, o `null` si no tiene ninguna configurada. Ver
[Entradas nativas `<feature>` y Label Expressions](#entradas-nativas-feature-y-label-expressions).

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

Evalúa una Label Expression contra el modelo, resolviendo `${name}`,
`${documentation}`, `${property:key}`, `${properties}`, `${propertiesvalues}`,
`${properties:separator:key}`, `${content}`, `${type}`, `${strength}`,
`${accessType}`, `${wordwrap:count:expression}`, `${if:...}` y `${nvl:...}` —
incluyendo expresiones anidadas dentro de los argumentos de otra expresión.
Devuelve `null` cuando el objeto no tiene ninguna feature `labelExpression`.

### Tipos públicos

El paquete exporta:

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

## Tipos nativos y semánticos

Los elementos y relaciones exponen ambos valores:

- `xsiType`: el valor nativo del XML, por ejemplo
  `"archimate:BusinessActor"`;
- `type`: el valor semántico sin el prefijo de namespace, por ejemplo
  `"BusinessActor"`.

La derivación es genérica. El parser no necesita tener hard-coded todos los
tipos posibles de Archi.

Las referencias cruzadas como `sourceId`, `targetId`, `archimateElementId`,
`referencedModelId` y los endpoints de las conexiones de diagrama son
identificadores simples de tipo string.

El paquete deliberadamente no incluye helpers de búsqueda. Los consumidores
que necesiten búsquedas repetidas pueden construir sus propios
`Map<string, ...>` según su patrón de uso.

## Índices automáticos de contención y conexión

El XML nativo solo expresa la contención mediante anidamiento (un `<child>`
dentro de otro `<child>`, una `<folder>` dentro de otra `<folder>`).
`parseArchiModel` hace un paso extra de derivación O(n) para que cada padre ya
tenga los ids de sus hijos precalculados, en el orden del XML fuente — sin
necesidad de recorrer el árbol del lado de quien llama:

```ts
interface ArchiView {
  diagramObjectIds: string[];     // objetos de diagrama hijos directos (no anidados)
  diagramConnectionIds: string[]; // toda conexión dentro de la vista, a cualquier profundidad
  noteIds: string[];              // notas hijas directas (no anidadas)
}

interface ArchiDiagramObject {
  childrenIds: string[];    // objetos de diagrama anidados directamente dentro de este
  connectionIds: string[];  // conexiones cuyo source es este objeto de diagrama
}

interface ArchiFolder {
  containedIds: string[];   // elementos/relaciones/vistas directamente dentro (no sub-carpetas)
}
```

La jerarquía de sub-carpetas se expresa al revés: recorré el `parentId` propio
de cada carpeta en vez de buscarla en el `containedIds` de un padre.

## Geometría: bounds y bendpoints

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

**`ArchiBounds.x`/`.y` de un objeto de diagrama o nota anidado son relativos
al origen de su propio padre, no coordenadas absolutas del canvas** — así es
como el propio Archi almacena la geometría anidada de forma nativa. Un objeto
de diagrama con `parentId: 'group-1'` y `bounds: { x: 10, y: 10, ... }` está
10px a la derecha y 10px hacia abajo de la esquina superior izquierda de
`group-1`, no de la vista. Para obtener coordenadas absolutas, sumá `x`/`y` a
lo largo de la cadena de `parentId` hasta la raíz. Los objetos de nivel raíz
(`parentId === null`) ya tienen coordenadas relativas a la vista (es decir,
absolutas).

Cualquiera de los cuatro campos de `ArchiBounds` puede ser `null` de forma
independiente — el parser nunca inventa un `0` para un atributo
`x`/`y`/`width`/`height` faltante o no numérico. `validateArchiModel` no
verifica que los bounds estén completos; tratá un campo `null` como
"no se puede posicionar", tal como hace el mapper de `archi-open-exchange`.

Los valores de `ArchiBendpoint` siguen la representación nativa propia de
Archi: cada bendpoint guarda su propio par start/end en vez de un único punto
medio, lo que permite reconstruir una conexión curva sin lógica geométrica
adicional.

## Semántica de Junction

Archi almacena la identidad AND/OR de un Junction mediante un atributo nativo
`type` separado del `xsi:type` del elemento.

Para un Junction, el parser expone tanto el valor semántico interpretado como
el valor nativo original:

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

Las reglas de decodificación son:

| `type` nativo del Junction | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| ausente | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| cualquier otro valor | `null` | valor original |

Los valores nativos desconocidos nunca se adivinan ni se descartan.

`parseArchiModel` continúa funcionando normalmente, mientras que
`validateArchiModel` reporta `unrecognized-junction-type` cuando el valor
nativo de un Junction no puede resolverse.

Para cualquier elemento que no sea un Junction:

```ts
junctionType === null
rawJunctionType === null
```

## Atributos nativos específicos de relaciones

### Access

`AccessRelationship.accessType` se expone como:

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

Se decodifica desde la representación nativa `0`-`3` de Archi.

Para una `AccessRelationship`, el campo siempre se resuelve a un valor. Cuando
el atributo nativo está ausente, el parser usa el valor por defecto nativo de
Archi: `'Write'`.

Para cualquier otro tipo de relación, `accessType` es `null`.

### Influence

`InfluenceRelationship.strength` contiene el modificador nativo de texto
libre, por ejemplo `"+"`.

Es `null` para cualquier otro tipo de relación y también cuando el valor
nativo está vacío o ausente.

### Association

`AssociationRelationship.directed` se resuelve a un booleano para relaciones
de asociación, usando `false` como valor por defecto nativo cuando el atributo
está ausente.

Para cualquier otro tipo de relación, `directed` es `null`.

## Estilos visuales

Los objetos de diagrama, conexiones y notas exponen sus colores nativos de
relleno/línea/fuente y su fuente, cuando están configurados:

```ts
interface ArchiStyle {
  fillColor: string | null;   // p. ej. "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // string nativo de SWT FontData, sin modificar
  fontName: string | null;    // decodificado de `font`
  fontSize: number | null;    // decodificado de `font`, en puntos
  fontStyle: ArchiFontStyle | null; // { bold, italic }, decodificado de `font`
  lineWidth: number | null;   // píxeles
  alpha: number | null;       // opacidad de relleno, 0-255; siempre `null` en una Connection (no tiene relleno)
}
```

`node.style` es `null` — no un objeto con todos los campos en `null` — cuando
ninguno de `fillColor`/`lineColor`/`fontColor`/`font`/`lineWidth`/`alpha` está
configurado, así quien llama puede distinguir barato "sin estilo registrado"
de "estilo registrado, todo sin definir".

`fontName`/`fontSize`/`fontStyle` se decodifican de la serialización nativa
`FontData.toString()` de SWT que usa Archi (p. ej.
`"1|Segoe UI|9.0|1|WINDOWS|...|700|..."`: versión-de-formato | nombre |
tamaño(pt) | bitmask-de-estilo | plataforma | ...datos nativos de fuente).
Solo se decodifican los primeros cuatro campos; un string que no tenga esa
forma deja esos tres campos en `null` mientras preserva igual el string crudo
de `font` — nunca se adivina.

El selector nativo de figura/ícono alternativo de un `DiagramObject` también
se expone tal cual, sin interpretar (su significado depende de la figura, lo
decide la propia UI de Archi por tipo de elemento):

```ts
interface ArchiDiagramObject {
  figureType: string | null; // atributo nativo `type`, p. ej. "0" o "1"
}
```

El código nativo de enrutamiento de conexiones de un `ArchiView` se expone de
la misma forma — tal cual, sin interpretar, ya que la propia numeración de
Archi para este atributo ya cambió una vez (el valor `1` quedó reservado y se
eliminó en el código fuente de Archi):

```ts
interface ArchiView {
  connectionRouterType: number | null; // atributo nativo crudo: 0 = puntos de curvatura manuales, 2 = ortogonal
}
```

## Entradas nativas `<feature>` y Label Expressions

Los objetos de diagrama, conexiones y notas exponen tal cual las entradas del
mecanismo genérico de extensibilidad de Archi `<feature name="..."
value="..."/>`:

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

El uso más conocido de este mecanismo son las
[Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)
(`name="labelExpression"`), que personalizan qué texto muestra un objeto de
diagrama en vez del nombre plano del elemento. Dos funciones trabajan con
esto:

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" — la plantilla, sin evaluar

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" — evaluada contra el modelo
```

`resolveLabelExpression` soporta los placeholders "core" del wiki — los que
se resuelven mirando solo el objeto mismo, sin recorrer el grafo del modelo:
`${name}`, `${documentation}`, `${content}` (Notes), `${type}`, `${strength}`,
`${accessType}` (conexiones Access/Influence), `${property:key}`,
`${properties}`, `${propertiesvalues}`, `${properties:separator:key}`,
`${wordwrap:count:expression}`, `${if:cond:val}`, `${if:cond:val1:val2}` y
`${nvl:cond:val}` — incluyendo expresiones anidadas dentro de los argumentos
de otra expresión (p. ej. `${if:${property:key}:<<${property:key}>>}`).

**No** soporta las formas de "Prefijo de referencia" del wiki (`$parent{...}`,
`$source{...}`, `$model{...}`, `$<relación>:source{...}`, etc.), que necesitan
recorrer el grafo del modelo (vista/carpeta padre, relaciones conectadas) en
vez de solo leer el objeto mismo. Esas quedan tal cual, sin resolver, en el
resultado — nunca se descartan en silencio. `${specialization}` y
`${viewpoint}` tampoco se resuelven.

Para un `DiagramObject` respaldado por un `archimateElementId`, los
placeholders se resuelven contra el `ArchiElement` subyacente. Para un
`DiagramConnection` respaldado por un `archimateRelationshipId`, se resuelven
contra la `ArchiRelationship` subyacente. Para un Group/`DiagramModelReference`
(sin elemento subyacente) solo se resuelven `${name}`/`${type}`, desde el
`name`/`xsiType` propio del objeto visual; `${documentation}`/`${property:*}`
se resuelven a un string vacío en ese caso.

## Specializations y Profiles

Las Specializations de Archi (sub-tipos con nombre, mostrados en la UI como
`<<Nombre>>`) y los Profiles genéricos (conjuntos reutilizables de propiedades
con nombre) son ambos elementos nativos `<profile>` en la raíz del modelo,
que se diferencian solo por un booleano:

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // el tipo ArchiMate al que se restringe, si aplica
  specialization: boolean;      // true = Specialization, false = Profile genérico
  imagePath: string | null;     // referencia a ícono custom, no resuelto a bytes
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

`specialization` toma `true` por defecto (el valor por defecto documentado de
EMF en Archi) cuando el atributo nativo está ausente — así es como la
serialización EMF/XMI omite atributos que coinciden con su valor por defecto
declarado.

Los elementos y relaciones referencian profiles por id:

```ts
interface ArchiElement {
  profiles: string[]; // valores de ArchiProfile.id; vacío si no hay ninguno
}

interface ArchiRelationship {
  profiles: string[]; // misma forma — las Specializations también aplican a relaciones
}
```

Esto está confirmado contra el código fuente del propio Archi (la EClass
`Profile` de `archimate.ecore` e `IProfile.java`), no solo contra archivos de
muestra observados.

## Archivos `.archimate` comprimidos (zip)

Archi guarda automáticamente un modelo como archivo comprimido — `model.xml`
más una entrada `images/` por cada ícono custom embebido, todo bajo la misma
extensión `.archimate` — siempre que el modelo tenga imágenes embebidas y no
esté guardado en una carpeta bajo Git (el propio `ArchiveManager` de Archi
prefiere XML plano + una carpeta `images/` al lado dentro de carpetas Git,
para que los binarios de imagen sigan siendo diff-friendly). Un archivo
`.archimate` comprimido es binario, no texto — leerlo con un decodificador de
texto antes de detectar el formato lo corrompe sin posibilidad de
recuperación.

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml } from '@cda/archi-semantic-core/archive';
import { parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MiModelo.archimate'); // leer como bytes, no como texto
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` detecta la firma de zip, y decodifica la entrada
directamente como texto UTF-8 (XML plano) o la descomprime y decodifica la
entrada `model.xml` (archivo comprimido) — usando el `zlib` nativo de Node,
sin agregar ninguna dependencia. Las imágenes embebidas no se extraen; usá
`ArchiProfile.imagePath` solo como referencia hacia las entradas `images/`
del archivo si necesitás ubicarlas vos mismo.

## Validación

`validateArchiModel` arma un único conjunto global de ids que abarca las
siete colecciones que tienen id (folders, elements, relationships, views,
diagram objects, diagram connections, notes — Archi saca todos los ids,
semánticos y visuales, de un mismo pool compartido), y después verifica:

| Código | Se dispara por |
| --- | --- |
| `missing-id` | Una entrada no tiene `id` en absoluto. |
| `duplicate-id` | El mismo `id` aparece en más de una entrada, en cualquier parte del modelo. |
| `broken-relationship-source` | El `sourceId` de una relación no resuelve a ningún id conocido. |
| `broken-relationship-target` | El `targetId` de una relación no resuelve a ningún id conocido. |
| `unrecognized-junction-type` | El atributo nativo `type` de un elemento `Junction` no es `""`/ausente (And) ni `"or"` (Or). |
| `broken-diagram-object-element` | El `archimateElementId` de un objeto de diagrama no resuelve a ningún id conocido. |
| `broken-diagram-object-model-reference` | El `referencedModelId` de un `DiagramModelReference` no resuelve a ningún id conocido. |
| `broken-diagram-connection-relationship` | El `archimateRelationshipId` de una conexión no resuelve a ningún id conocido. |
| `broken-diagram-connection-source` | El `sourceId` de una conexión no resuelve a ningún id conocido. |
| `broken-diagram-connection-target` | El `targetId` de una conexión no resuelve a ningún id conocido. |

Cada issue trae un localizador `path` (p. ej. `"relationships[rel-1].sourceId"`)
hacia el `ArchiModel` devuelto — no hacia el XML original — para poder
rastrearlo directamente hasta el campo que falló.

`{ valid: true, errors: [] }` significa que toda entrada con id tiene un id
único y no vacío, y que toda referencia cruzada que este validator chequea
resuelve — no verifica que `ArchiBounds` esté completo, ni las referencias de
`ArchiProfile`/`profiles`, ni nada relacionado con estilos o features.

## Rendimiento

El parseo y la validación escalan **linealmente** con el tamaño del modelo:
los ids y las referencias cruzadas se indexan una sola vez en pasadas
`Map`/`Set` de una sola pasada, de modo que ningún camino de código
re-escanea `model.elements`/`model.relationships` por ítem.
`resolveLabelExpression` es **O(1) por nodo** — sus búsquedas de
elemento/relación pasan por índices `Map` cacheados por modelo, así que
resolver las expresiones de label de todos los diagram objects de un modelo
grande sigue siendo barato.

Un test de regresión de rendimiento (`test/performance.test.ts`) lo hace
cumplir: parsea y valida un modelo sintético de 20k elementos, 20k
relaciones y 20k diagram objects dentro de un presupuesto de tiempo fijo, y
verifica que el tiempo de parseo crece linealmente al duplicar el tamaño
del modelo.

## Ejemplos

Recetas de consumo listas para copiar del modelo parseado — leer archivos
`.archimate` (XML o zip), indexar y consultar, análisis de impacto sobre el
grafo de relaciones, validación como puerta de pipeline y resolución de
label expressions. Ver [examples/README.md](examples/README.md).

## Qué cubre

- Metadatos del modelo: id, nombre, versión nativa, `purpose` y propiedades.
- Carpetas, incluidas las vacías, jerarquía, path, documentación y propiedades.
- Elementos y relaciones de ArchiMate preservados de forma genérica.
- Índices precalculados de contención/conexión (`childrenIds`,
  `connectionIds`, `diagramObjectIds`, `diagramConnectionIds`, `noteIds`,
  `containedIds`) — sin necesidad de recorrer el árbol para saber qué está
  dentro de qué.
- Semántica nativa AND/OR de Junction.
- Atributos específicos de Access, Influence y Association.
- Vistas con `viewpoint` nativo, `connectionRouterType`, objetos anidados,
  notas, conexiones y bendpoints.
- Nodos `DiagramModelReference`, incluido `referencedModelId`.
- Contenedores visuales genéricos como `Group`, incluyendo su propia
  `documentation` y el selector nativo de figura/ícono alternativo
  (`figureType`).
- Documentación y propiedades.
- Estilos visuales: colores de relleno/línea/fuente, nombre/tamaño/negrita/
  cursiva de fuente, ancho de línea, opacidad de relleno (`alpha`).
- Entradas de extensibilidad genérica `<feature>` de Archi, y Label
  Expressions construidas sobre ellas (string crudo de la plantilla y
  resultado evaluado para el set de placeholders "core").
- Specializations y Profiles genéricos, y qué elementos/relaciones los
  referencian.
- Ambas formas de archivo `.archimate`: XML plano y la variante comprimida
  (zip) de Archi.
- Validación estructural (`validateArchiModel`): ids faltantes/duplicados y
  referencias rotas en las siete colecciones con id — ver
  [Validación](#validación).
- Referencias numéricas de caracteres XML como `&#xD;&#xA;`, decodificadas.

Las colecciones preservan el orden del XML fuente.

## Qué queda fuera del alcance

- Importación o exportación del ArchiMate Model Exchange File Format.
- Edición o mutación del modelo.
- Serialización de un `ArchiModel` nuevamente a XML `.archimate`.
- Renderizado, diagramación, routing automático o UI.
- Extraer los *bytes* de imágenes embebidas de un archivo `.archimate`
  comprimido — solo se preserva el string de referencia `imagePath`.
- Las formas de "Prefijo de referencia" de las Label Expressions
  (`$parent{...}`, `$source{...}`, `$model{...}`, `$<relación>:source{...}`,
  etc.), que necesitan recorrer el grafo del modelo en vez de leer un solo
  objeto. Los placeholders `${specialization}` y `${viewpoint}` tampoco se
  evalúan.
- Vistas Sketch y Canvas como `ArchiView` semánticas. Utilizan tipos raíz que
  no pertenecen al namespace `archimate:` y se conservan de forma genérica en
  lugar de reinterpretarse como vistas ArchiMate.

## Seguridad

`archi-semantic-core` parsea XML, así que estas son las propiedades en las
que un auditor o consumidor puede confiar — cada una verificada
directamente contra el código fuente de `fast-xml-parser` tal como se
distribuye, no inferida de su documentación:

- **Sin resolución de entidades externas.** Una declaración de entidad
  externa DOCTYPE `SYSTEM`/`PUBLIC` se rechaza de plano — `fast-xml-parser`
  lanza `"External entities are not supported"` al encontrar una, sin
  importar la configuración. El XXE clásico (divulgación de archivos
  locales, SSRF vía una URI de entidad) no es alcanzable a través del uso
  por defecto de este paquete; es una propiedad del parser, no algo que
  `archi-semantic-core` configure ni pueda desactivar por accidente.
- **La expansión de entidades está acotada por defecto.** `fast-xml-parser`
  aplica límites por defecto sobre tamaño de entidad, profundidad de
  expansión, longitud expandida y cantidad de entidades desde el primer
  momento; `archi-semantic-core` no relaja ni sobreescribe ninguno de ellos.
- **El input se valida antes de parsear.** `parseArchiModel` ejecuta primero
  `XMLValidator.validate()` y lanza una excepción ante XML mal formado, en
  vez de intentar una recuperación best-effort.
- **Sin ejecución de código a partir del input.** El parseo solo produce
  datos planos — strings, números, arrays, objetos simples. Nada del
  contenido `.archimate` se evalúa ni se ejecuta.
- **Una sola dependencia de runtime directa: `fast-xml-parser`.**
  `archi-semantic-core` en sí no agrega ninguna otra dependencia de runtime
  propia; todo lo que hay más allá de ese único paquete pertenece al árbol
  de dependencias propio de `fast-xml-parser`, no de este paquete.

Esto describe el comportamiento estructural de la implementación actual, no
una garantía absoluta de ausencia de vulnerabilidades — pueden seguir
surgiendo problemas a nivel de dependencias con el tiempo. Ver
[SECURITY.md](./SECURITY.md) para reportar una vulnerabilidad sospechada, y
el `npm audit` / las alertas de Dependabot de este repo para el estado de
advisories vigente de `fast-xml-parser` y las dependencias de desarrollo.

## Requisitos y formato de módulo

Node.js:

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

El paquete se publica únicamente como ESM:

```json
{
  "type": "module"
}
```

CommonJS `require('@cda/archi-semantic-core')` no está
soportado.

Un bundler moderno para navegador también puede consumir el paquete.

## Desarrollo

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Principio de diseño

`archi-semantic-core` debe entender **la semántica nativa de Archi**.

No debe saber cómo otro formato, renderer, editor o estándar de intercambio
decide representar esa semántica.

Esa frontera mantiene al parser reutilizable como base para otras herramientas
de Continuous-DrivenArchitecture.

## ¿Te resultó útil?

Si `archi-semantic-core` te ahorró tener que hacer ingeniería inversa del
formato `.archimate` nativo de Archi por tu cuenta, considera darle una ⭐
al proyecto. Ayuda a que otros desarrolladores que trabajan con Archi lo
descubran.

## Licencia

MIT — ver [LICENSE](./LICENSE).
