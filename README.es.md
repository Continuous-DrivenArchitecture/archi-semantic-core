# archi-model-parser

[English](README.md) | [Español](README.es.md)

Un parser de TypeScript para archivos de modelo `.archimate` nativos
creados por el editor de escritorio [Archi](https://www.archimatetool.com/).

`archi-model-parser` lee el formato XML nativo de Archi y lo convierte en un
`ArchiModel` limpio y fuertemente tipado — carpetas (folders), elementos,
relaciones, vistas, objetos de diagrama, conexiones de diagrama y notas —
sin que quien lo use necesite entender la estructura XML subyacente.

```
.archimate XML  →  archi-model-parser  →  ArchiModel
```

## Qué NO es esto

Este paquete analiza (parsea) el formato de archivo `.archimate`
**nativo** de Archi (`xmlns:archimate="http://www.archimatetool.com/archimate"`)
— el formato que el propio Archi lee y escribe en disco.

**No** es un parser ni un generador del [ArchiMate® Model Exchange File
Format](https://www.opengroup.org/xsd/archimate/) ("Open Exchange"), y no
tiene funcionalidad de interfaz de usuario (UI), edición ni renderizado.
Esas son responsabilidades distintas que podrían convertirse en paquetes
separados más adelante.

Este proyecto no está afiliado ni respaldado por Archi, el proyecto Archi
Tool, ni The Open Group.

## Instalación

```sh
npm install @continuousarchitecture/archi-model-parser
```

## Uso

```ts
import { parseArchiModel, validateArchiModel } from '@continuousarchitecture/archi-model-parser';

const model = parseArchiModel(xml); // xml: string — léelo como prefieras (fs, fetch, File API, ...)

console.log(model.elements);
console.log(model.relationships);
console.log(model.views);

console.log(model.elements[0].type); // p. ej. "ApplicationComponent" — un tipo semántico limpio, no "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` solo acepta texto XML — leer un archivo desde disco, la
File API del navegador, o desde la red, es responsabilidad de quien llama a
la función. Esto mantiene la librería utilizable tanto desde Node.js como
desde el navegador o pruebas (tests).

## API

- `parseArchiModel(xml: string): ArchiModel` — analiza (parsea) texto XML de
  Archi y devuelve un modelo semántico. Lanza una excepción si `xml` no es
  un string o si el XML no está bien formado.
- `validateArchiModel(model: ArchiModel): ArchiValidationResult` — verifica
  la integridad *estructural* de un modelo ya parseado: ids faltantes, ids
  duplicados y referencias rotas entre entidades (p. ej. una relación cuyo
  origen ya no existe). Esto no es un linter de calidad de arquitectura
  empresarial — un modelo puede validar correctamente y aun así ser una
  mala arquitectura.
- Tipos: `ArchiModel`, `ArchiModelMetadata`, `ArchiFolder`, `ArchiElement`,
  `ArchiRelationship`, `ArchiView`, `ArchiDiagramObject`,
  `ArchiDiagramConnection`, `ArchiNote`, `ArchiBounds`, `ArchiBendpoint`,
  `ArchiProperty`, `ArchiValidationResult`, `ArchiValidationIssue`.

Cada elemento y relación expone tanto el `xsiType` crudo (p. ej.
`"archimate:BusinessActor"`) como un `type` derivado, sin el prefijo de
namespace (p. ej. `"BusinessActor"`) — de forma genérica, para cualquier
tipo de Archi, no solo para una lista fija de conceptos de ArchiMate
conocidos.

Las referencias cruzadas entre entidades (el `sourceId` de una relación, el
`archimateElementId` de un objeto de diagrama, ...) son simples ids de tipo
string. Búscalas en el array correspondiente, o construye un `Map`
indexado por `id` si necesitas búsquedas repetidas — la librería
deliberadamente no incluye un helper de búsqueda, para mantener pequeña su
superficie pública.

## Qué cubre

- Metadatos del modelo (id, name, version)
- Carpetas (folders), incluidas las vacías, con jerarquía padre/hijo y path
- Elementos y relaciones de ArchiMate de cualquier tipo, de forma genérica
- Vistas (views), con sus objetos de diagrama, objetos de diagrama
  anidados, conexiones (incluidos los bendpoints) y notas
- Documentación y propiedades, incluyendo referencias de caracteres XML
  numéricas (p. ej. `&#xD;&#xA;`) decodificadas en lugar de dejarlas como
  texto literal
- Contenedores visuales que no son `DiagramObject` (p. ej. `Group` de
  Archi) — preservados de forma genérica en lugar de descartados

## Qué queda fuera del alcance

- ArchiMate Open Exchange File Format (importación o exportación)
- Edición, mutación o re-serialización de un modelo de vuelta a XML
- Renderizado, diagramación o cualquier UI
- Atributos puramente de presentación (colores de relleno/línea/fuente, el
  mecanismo `<feature>` de Archi, etc.) — cuestiones de estilo visual fuera
  de la "estructura y semántica"
- Las vistas Sketch y Canvas de Archi: viven en la misma carpeta "Views"
  pero usan un tipo raíz distinto (no `archimate:`), por lo que se parsean
  como `ArchiElement`s simples en lugar de `ArchiView`s

## Requisitos y formato de módulo

Node.js `^20.0.0 || ^22.0.0 || >=24.0.0`, o un bundler moderno para
navegador. El paquete se publica solo como ESM (`"type": "module"`, sin
build de CommonJS) — `require('archi-model-parser')` no está soportado.

## Desarrollo

```sh
git clone https://github.com/ContinuousArchitecture/archi-model-parser.git
cd archi-model-parser
npm install

npm run typecheck  # tsc --noEmit
npm run build       # genera dist/ (.js + .d.ts + source maps + declaration maps)
npm test            # vitest run
```

## Licencia

MIT — ver [LICENSE](./LICENSE).
