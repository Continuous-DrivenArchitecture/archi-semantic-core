# archi-model-parser

[English](README.md) | [Español](README.es.md)

Un parser de TypeScript para archivos de modelo `.archimate` nativos creados
por el editor de escritorio [Archi](https://www.archimatetool.com/).

`archi-model-parser` lee el formato XML nativo de Archi y lo convierte en un
`ArchiModel` limpio y fuertemente tipado que contiene carpetas, elementos,
relaciones, vistas, objetos de diagrama, conexiones, notas, propiedades y los
detalles semánticos nativos necesarios para trabajar con el modelo sin conocer
la estructura XML interna de Archi.

```text
.archimate XML  →  archi-model-parser  →  ArchiModel
```

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

## Instalación

```sh
npm install @continuousarchitecture/archi-model-parser
```

## Uso

```ts
import {
  parseArchiModel,
  validateArchiModel,
} from '@continuousarchitecture/archi-model-parser';

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

## API

### `parseArchiModel(xml: string): ArchiModel`

Parsea XML nativo de Archi y devuelve un modelo semántico.

Lanza una excepción cuando la entrada no es un string o cuando el XML no está
bien formado.

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

Verifica la integridad estructural de un modelo ya parseado, incluyendo:

- identificadores faltantes;
- identificadores duplicados;
- referencias rotas entre entidades;
- valores nativos de Junction que no pueden resolverse.

Este validator no es un linter de calidad de arquitectura empresarial. Un
modelo puede ser estructuralmente válido y, aun así, representar una mala
arquitectura.

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

## Qué cubre

- Metadatos del modelo: id, nombre, versión nativa, `purpose` y propiedades.
- Carpetas, incluidas las vacías, jerarquía, path, documentación y propiedades.
- Elementos y relaciones de ArchiMate preservados de forma genérica.
- Semántica nativa AND/OR de Junction.
- Atributos específicos de Access, Influence y Association.
- Vistas con `viewpoint` nativo, objetos anidados, notas, conexiones y bendpoints.
- Nodos `DiagramModelReference`, incluido `referencedModelId`.
- Contenedores visuales genéricos como `Group`.
- Documentación y propiedades.
- Referencias numéricas de caracteres XML como `&#xD;&#xA;`, decodificadas.

Las colecciones preservan el orden del XML fuente.

## Qué queda fuera del alcance

- Importación o exportación del ArchiMate Model Exchange File Format.
- Edición o mutación del modelo.
- Serialización de un `ArchiModel` nuevamente a XML `.archimate`.
- Renderizado, diagramación, routing automático o UI.
- Atributos puramente visuales como colores de relleno, líneas, fuentes y el
  mecanismo `<feature>` de estilos de Archi.
- Vistas Sketch y Canvas como `ArchiView` semánticas. Utilizan tipos raíz que
  no pertenecen al namespace `archimate:` y se conservan de forma genérica en
  lugar de reinterpretarse como vistas ArchiMate.
- Especialización de conceptos / perfiles. Su serialización nativa continúa
  deliberadamente fuera de alcance hasta que pueda representarse a partir de
  comportamiento nativo confirmado, sin adivinar.

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

CommonJS `require('@continuousarchitecture/archi-model-parser')` no está
soportado.

Un bundler moderno para navegador también puede consumir el paquete.

## Desarrollo

```sh
git clone https://github.com/ContinuousArchitecture/archi-model-parser.git
cd archi-model-parser
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## Principio de diseño

`archi-model-parser` debe entender **la semántica nativa de Archi**.

No debe saber cómo otro formato, renderer, editor o estándar de intercambio
decide representar esa semántica.

Esa frontera mantiene al parser reutilizable como base para otras herramientas
de ContinuousArchitecture.

## Licencia

MIT — ver [LICENSE](./LICENSE).
