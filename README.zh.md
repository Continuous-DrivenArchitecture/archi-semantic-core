# archi-semantic-core

[![npm version](https://shields.io)](https://www.npmjs.com/package/@cda/archi-semantic-core) [![License: MIT](https://shields.io)](./LICENSE)

[<img src="https://flagcdn.com/20x15/gb.png" width="20" height="15" alt=""> ![English](https://img.shields.io/badge/English-4c9aff)](README.md) [<img src="https://flagcdn.com/20x15/de.png" width="20" height="15" alt=""> ![Deutsch](https://img.shields.io/badge/Deutsch-4c9aff)](README.de.md) [<img src="https://flagcdn.com/20x15/es.png" width="20" height="15" alt=""> ![Español](https://img.shields.io/badge/Español-4c9aff)](README.es.md) [<img src="https://flagcdn.com/20x15/fr.png" width="20" height="15" alt=""> ![Français](https://img.shields.io/badge/Français-4c9aff)](README.fr.md) [<img src="https://flagcdn.com/20x15/nl.png" width="20" height="15" alt=""> ![Nederlands](https://img.shields.io/badge/Nederlands-4c9aff)](README.nl.md) [<img src="https://flagcdn.com/20x15/pt.png" width="20" height="15" alt=""> ![Português](https://img.shields.io/badge/Português-4c9aff)](README.pt.md) [<img src="https://flagcdn.com/20x15/cn.png" width="20" height="15" alt=""> ![中文](https://img.shields.io/badge/中文-4c9aff)](README.zh.md)

一个用于解析 [Archi](https://www.archimatetool.com/) 桌面编辑器所创建的原生 `.archimate` 模型文件的 TypeScript 解析器。

`archi-semantic-core` 会读取 Archi 的原生 XML 格式，并将其转换为结构清晰、类型完善的 `ArchiModel`，其中包含文件夹、元素、关系、视图、图表对象、图表连接、便签、属性、视觉样式、Specializations/Profiles，以及在无需了解 Archi XML 结构的情况下使用该模型所需的各项原生语义细节。它同样支持读取 `.archimate` 文件格式的压缩包（zip）变体。

```text
.archimate XML  →  archi-semantic-core  →  ArchiModel
```

## 目录

- [这个包的用途](#这个包的用途)
- [这个包不是什么](#这个包不是什么)
- [安装](#安装)
- [用法](#用法)
- [API](#api)
  - [`parseArchiModel`](#parsearchimodelxml-string-archimodel)
  - [`validateArchiModel`](#validatearchimodelmodel-archimodel-archivalidationresult)
  - [`extractArchiModelXml`](#extractarchimodelxmlbytes-uint8array-string)
  - [`getLabelExpression`](#getlabelexpressionfeatures-archifeature-string--null)
  - [`resolveLabelExpression`](#resolvelabelexpressionmodel-archimodel-node-archidiagramobject--archidiagramconnection--archinote-string--null)
  - [公共类型](#公共类型)
- [原始类型和语义类型](#原始类型和语义类型)
- [自动包含与连接索引](#自动包含与连接索引)
- [几何图形：bounds 和 bendpoints](#几何图形-bounds-和-bendpoints)
- [Junction 语义](#junction-语义)
- [关系特有的原生属性](#关系特有的原生属性)
  - [Access](#access)
  - [Influence](#influence)
  - [Association](#association)
- [视觉样式](#视觉样式)
- [原生 `<feature>` 条目和 Label Expressions](#原生-feature-条目和-label-expressions)
- [Specializations 和 Profiles](#specializations-和-profiles)
- [Zip 归档 `.archimate` 文件](#zip-归档-archimate-文件)
- [验证](#验证)
- [已覆盖的内容](#已覆盖的内容)
- [不在范围内的内容](#不在范围内的内容)
- [环境要求和模块格式](#环境要求和模块格式)
- [开发](#开发)
- [设计原则](#设计原则)
- [许可证](#许可证)

## 这个包的用途

当你需要以编程方式处理 Archi 模型，同时让解析逻辑独立于渲染、编辑、质量规则或交换格式转换时，可以使用这个包。

该解析器专注于两项职责：

- 保留属于语义模型的 Archi 原生信息；
- 通过一个小巧、类型完善的 TypeScript API 暴露这些信息。

它不会为了适配其他标准而重新解释模型。

## 这个包不是什么

这个包解析的是 Archi **原生**的 `.archimate` 文件格式（`xmlns:archimate="http://www.archimatetool.com/archimate"`）——也就是 Archi 自身在磁盘上读写所使用的格式。

它**不是** [ArchiMate® Model Exchange File Format](https://www.opengroup.org/xsd/archimate/) 的解析器或生成器，也没有任何 UI、编辑器、渲染器或图表布线（routing）引擎。

这些都是另外的关注点，应当由其他独立的包来负责。

本项目与 Archi、Archi Tool 项目或 The Open Group 均无关联，也未获得其背书。

## 安装

```sh
npm install @cda/archi-semantic-core
```

## 用法

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
// 例如："ApplicationComponent"，而非 "archimate:ApplicationComponent"

const { valid, errors } = validateArchiModel(model);
```

`parseArchiModel` 只接受 XML 文本作为输入。从磁盘读取文件、使用浏览器 File API，或通过网络获取 XML，都是调用方自己的责任。这样可以让这个包在 Node.js、浏览器打包工具和测试环境中都能使用，而不必与特定的 I/O 环境耦合。

Archi 也可以将 `.archimate` 文件保存为压缩包（zip）——只要模型中包含内嵌图片，它就会自动这样做。如果文件可能是这两种形式中的任意一种，请先读取原始字节，并先将其传入 `extractArchiModelXml`：

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml, parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate');
const xml = extractArchiModelXml(bytes); // 处理纯 XML 或压缩包（zip）两种情况
const model = parseArchiModel(xml);
```

## API

### `parseArchiModel(xml: string): ArchiModel`

将 Archi 原生 XML 文本解析为语义模型。

当输入不是字符串，或者 XML 格式不正确时，会抛出异常。

### `validateArchiModel(model: ArchiModel): ArchiValidationResult`

检查已经解析完成的模型的结构完整性——包括缺失/重复的标识符、悬空引用、无法解析的原生 Junction 值。完整的检查列表请参见[验证](#验证)。

这个验证器并不是企业架构质量方面的 linter。一个模型即使结构上完全有效，也仍然可能是糟糕的架构。

### `extractArchiModelXml(bytes: Uint8Array): string`

从 `.archimate` 文件的原始字节中返回模型的 XML 文本，无论该文件是纯 XML 还是 Archi 的压缩包（zip）变体（`model.xml` 加上每个内嵌自定义图标对应的一条 `images/` 条目，一起打包压缩——参见 [Zip 归档 `.archimate` 文件](#zip-归档-archimate-文件)）。将返回结果传给 `parseArchiModel` 即可。

如果输入看起来像压缩包但没有 `model.xml` 条目、使用了 Stored/Deflate 之外的压缩方式（Archi 从不会写出其他压缩方式），或者是一个截断/损坏的压缩包，则会抛出异常。

### `getLabelExpression(features: ArchiFeature[]): string | null`

从图表对象/连接/便签的 `features` 中返回原始的 Label Expression 模板字符串（例如 `"${name}\n${property:First}"`），如果未设置则返回 `null`。参见[原生 `<feature>` 条目和 Label Expressions](#原生-feature-条目和-label-expressions)。

### `resolveLabelExpression(model: ArchiModel, node: ArchiDiagramObject | ArchiDiagramConnection | ArchiNote): string | null`

根据模型对 Label Expression 求值，解析 `${name}`、`${documentation}`、`${property:key}`、`${properties}`、`${propertiesvalues}`、`${properties:separator:key}`、`${content}`、`${type}`、`${strength}`、`${accessType}`、`${wordwrap:count:expression}`、`${if:...}` 以及 `${nvl:...}`——包括嵌套在另一个表达式参数内部的表达式。当对象根本没有 `labelExpression` feature 时，返回 `null`。

### 公共类型

该包导出以下内容：

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

## 原始类型和语义类型

元素和关系会同时暴露以下两个字段：

- `xsiType`：原生 XML 中的值，例如 `"archimate:BusinessActor"`；
- `type`：去掉命名空间前缀后的语义值，例如 `"BusinessActor"`。

这个推导过程是通用的。解析器不需要事先把 Archi 所有可能的类型都硬编码进去。

诸如 `sourceId`、`targetId`、`archimateElementId`、`referencedModelId` 以及图表连接的端点等交叉引用，都是普通的字符串标识符。

这个包刻意不内置查找辅助函数。如果调用方需要频繁查找，可以根据自己的使用场景构建合适的 `Map<string, ...>` 索引。

## 自动包含与连接索引

原生 XML 只通过嵌套来表达包含关系（一个 `<child>` 嵌套在另一个 `<child>` 内，一个 `<folder>` 嵌套在另一个 `<folder>` 内）。`parseArchiModel` 会多做一次 O(n) 的推导，让每个父级都预先按源文件顺序计算好其子级的 id 列表——调用方无需自行遍历树结构：

```ts
interface ArchiView {
  diagramObjectIds: string[];     // 直接子级的图表对象（不含嵌套）
  diagramConnectionIds: string[]; // 视图内任意嵌套深度下的所有连接
  noteIds: string[];              // 直接子级的便签（不含嵌套）
}

interface ArchiDiagramObject {
  childrenIds: string[];    // 直接嵌套在此对象内部的图表对象
  connectionIds: string[];  // 以此图表对象为起点（source）的连接
}

interface ArchiFolder {
  containedIds: string[];   // 直接包含的元素/关系/视图（不含子文件夹）
}
```

子文件夹的层级关系则以相反的方式表达：应沿着每个文件夹自身的 `parentId` 向上查找，而不是到父级的 `containedIds` 中去查找它。

## 几何图形：bounds 和 bendpoints

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

**嵌套的图表对象或便签的 `ArchiBounds.x`/`.y` 是相对于其自身父级原点的坐标，而不是画布的绝对坐标**——这正是 Archi 自身原生存储嵌套几何信息的方式。一个 `parentId` 为 `'group-1'`、`bounds` 为 `{ x: 10, y: 10, ... }` 的图表对象，是相对于 `group-1` 自身左上角向右 10px、向下 10px 的位置，而不是相对于视图。要得到绝对坐标，需要沿着 `parentId` 链一路向上累加 `x`/`y` 直到根节点。根级对象（`parentId === null`）的坐标本身就已经是相对于视图的（也就是绝对的）坐标。

`ArchiBounds` 的四个字段中的任意一个都可以独立为 `null`——当 `x`/`y`/`width`/`height` 属性缺失或不是数字时，解析器绝不会捏造出一个 `0`。`validateArchiModel` 不会检查 bounds 是否完整；请像 `archi-open-exchange` 的 mapper 那样，把 `null` 字段视为"无法定位"。

`ArchiBendpoint` 的取值遵循 Archi 自身的原生表示方式：每个 bendpoint 都存储着自己的一对起点/终点坐标，而不是单一的中点，这样无需额外的几何计算逻辑，就能重建出一条弯曲的连接曲线。

## Junction 语义

Archi 使用一个独立于元素 `xsi:type` 的原生 `type` 属性来存储 AND/OR Junction 的身份信息。

对于 Junction，解析器会同时暴露经过解释的语义值和原始的原生值：

```ts
type ArchiJunctionType = 'And' | 'Or';

interface ArchiElement {
  junctionType: ArchiJunctionType | null;
  rawJunctionType: string | null;
}
```

解码规则如下：

| Junction 原生 `type` | `junctionType` | `rawJunctionType` |
| --- | --- | --- |
| 缺失 | `'And'` | `''` |
| `""` | `'And'` | `''` |
| `"or"` | `'Or'` | `'or'` |
| 其他任意值 | `null` | 原始值 |

未知的原生值永远不会被猜测或丢弃。

`parseArchiModel` 仍然会成功执行，而 `validateArchiModel` 会针对原生值无法解析的 Junction 报告 `unrecognized-junction-type`。

对于任何非 Junction 元素：

```ts
junctionType === null
rawJunctionType === null
```

## 关系特有的原生属性

### Access

`AccessRelationship.accessType` 会以如下形式暴露：

```ts
'Write' | 'Read' | 'Unspecified' | 'ReadWrite'
```

它是从 Archi 原生的 `0`-`3` 表示形式解码而来的。

对于 `AccessRelationship`，该字段总会被解析出一个值。当原生属性缺失时，解析器会使用 Archi 的原生默认值：`'Write'`。

对于其他任何关系类型，`accessType` 都是 `null`。

### Influence

`InfluenceRelationship.strength` 包含原生的自由文本修饰符，例如 `"+"`。

对于其他任何关系类型，它都是 `null`；当原生值为空或缺失时，同样也是 `null`。

### Association

对于 association 关系，`AssociationRelationship.directed` 会被解析为一个布尔值；当该属性缺失时，会使用 `false` 作为原生默认值。

对于其他任何关系类型，`directed` 都是 `null`。

## 视觉样式

当设置了相应值时，图表对象、连接和便签会暴露它们原生的填充色/线条颜色/字体颜色以及字体：

```ts
interface ArchiStyle {
  fillColor: string | null;   // 例如 "#ffffff"
  lineColor: string | null;
  fontColor: string | null;
  font: string | null;        // 原生 SWT FontData 字符串，原样保留
  fontName: string | null;    // 从 `font` 解码得到
  fontSize: number | null;    // 从 `font` 解码得到，单位为磅（point）
  fontStyle: ArchiFontStyle | null; // { bold, italic }，从 `font` 解码得到
  lineWidth: number | null;   // 像素
  alpha: number | null;       // 填充不透明度，取值 0-255；在 Connection 上始终为 null（因为没有填充）
}
```

当 `fillColor`/`lineColor`/`fontColor`/`font`/`lineWidth`/`alpha` 都未设置时，`node.style` 本身就是 `null`——而不是一个所有字段都为 `null` 的对象——这样调用方就能以很低的成本区分"没有记录任何样式"和"记录了样式、但都未设置"这两种情况。

`fontName`/`fontSize`/`fontStyle` 是从 Archi 自身的 SWT `FontData.toString()` 序列化结果中解码而来的（例如 `"1|Segoe UI|9.0|1|WINDOWS|...|700|..."`：格式版本 | 名称 | 字号（磅） | 样式位掩码 | 平台 | ……原生字体数据）。只有前四个字段会被解码；如果字符串不符合这种形式，这三个字段会保留为 `null`，同时仍然保留原始的 `font` 字符串——绝不会靠猜测得出结果。

`DiagramObject` 原生的备用图形/图标选择器也会原样暴露，不做任何解释（它的含义取决于具体图形，由 Archi 自身的 UI 按元素类型决定）：

```ts
interface ArchiDiagramObject {
  figureType: string | null; // 原生 `type` 属性的原始值，例如 "0" 或 "1"
}
```

`ArchiView` 原生的连接布线（routing）代码也以同样的方式暴露——原样保留，不做解释，因为 Archi 自身对该编号的定义已经变更过一次（值 `1` 在 Archi 源码中曾被保留后又被弃用）：

```ts
interface ArchiView {
  connectionRouterType: number | null; // 原生属性原始值：0 = 手动 bendpoints，2 = 正交（orthogonal）
}
```

## 原生 `<feature>` 条目和 Label Expressions

图表对象、连接和便签会原样暴露 Archi 通用的 `<feature name="..." value="..."/>` 扩展条目：

```ts
interface ArchiFeature {
  name: string;
  value: string;
}
```

这个机制最广为人知的用法就是 [Label Expressions](https://github.com/archimatetool/archi/wiki/Label-Expressions)（`name="labelExpression"`），它可以自定义图表对象显示的文本，而不是单纯显示元素名称。有两个函数专门用于处理它：

```ts
import { getLabelExpression, resolveLabelExpression } from '@cda/archi-semantic-core';

const raw = getLabelExpression(node.features);
// "${name}\n${property:First}" —— 模板本身，尚未求值

const resolved = resolveLabelExpression(model, node);
// "Shared Component\nOne" —— 已根据模型求值
```

`resolveLabelExpression` 支持 wiki 中的"core"占位符——也就是那些仅凭对象自身即可解析、无需遍历模型图的占位符：`${name}`、`${documentation}`、`${content}`（便签）、`${type}`、`${strength}`、`${accessType}`（Access/Influence 连接）、`${property:key}`、`${properties}`、`${propertiesvalues}`、`${properties:separator:key}`、`${wordwrap:count:expression}`、`${if:cond:val}`、`${if:cond:val1:val2}` 以及 `${nvl:cond:val}`——包括嵌套在另一个表达式自身参数内部的表达式（例如 `${if:${property:key}:<<${property:key}>>}`）。

它**不**支持 wiki 中的"Reference Prefix"形式（`$parent{...}`、`$source{...}`、`$model{...}`、`$<relationship>:source{...}` 等），因为这些需要遍历模型图（父级视图/文件夹、相连的关系），而不只是读取对象本身。这些占位符会原样保留在输出中，不做解析——绝不会被静默丢弃。`${specialization}` 和 `${viewpoint}` 同样也不会被解析。

对于由 `archimateElementId` 支撑的 `DiagramObject`，占位符会根据其底层的 `ArchiElement` 进行解析。对于由 `archimateRelationshipId` 支撑的 `DiagramConnection`，则会根据其底层的 `ArchiRelationship` 进行解析。对于 Group/`DiagramModelReference`（没有底层元素）而言，只有 `${name}`/`${type}` 会被解析，其值来自该视觉对象自身的 `name`/`xsiType`；在这种情况下，`${documentation}`/`${property:*}` 会解析为空字符串。

## Specializations 和 Profiles

Archi 的 Specializations（在 UI 中以 `<<Name>>` 形式展示的具名子类型）和通用的 Profiles（可复用的具名属性集合）在模型根部都是原生的 `<profile>` 元素，二者仅通过一个布尔值来区分：

```ts
interface ArchiProfile {
  id: string;
  name: string | null;
  conceptType: string | null;   // 该 Profile 限定的 ArchiMate 类型（如果有的话）
  specialization: boolean;      // true = Specialization，false = 通用 Profile
  imagePath: string | null;     // 自定义图标的引用，不会被解析为字节数据
}

interface ArchiModel {
  profiles: ArchiProfile[];
}
```

当原生属性缺失时，`specialization` 默认为 `true`（这是 Archi 自身文档记载的 EMF 默认值）——这与 EMF/XMI 序列化在属性值等于其声明的默认值时会省略该属性的做法是一致的。

元素和关系通过 id 来引用 profiles：

```ts
interface ArchiElement {
  profiles: string[]; // ArchiProfile.id 的值；未设置时为空数组
}

interface ArchiRelationship {
  profiles: string[]; // 结构相同——Specializations 同样也适用于关系
}
```

这一点已经对照 Archi 自身的源码（`archimate.ecore` 中的 `Profile` EClass 以及 `IProfile.java`）加以确认，而不仅仅是根据观察到的样本文件得出的结论。

## Zip 归档 `.archimate` 文件

只要模型包含内嵌图片、并且没有存放在受 git 追踪的文件夹中，Archi 就会自动把模型保存为压缩包——`model.xml` 加上每个内嵌自定义图标对应的一条 `images/` 条目，全部使用同样的 `.archimate` 扩展名（Archi 自身的 `ArchiveManager` 在 git 文件夹内更倾向于使用"纯 XML + 同级 `images/` 文件夹"的布局，这样图片二进制文件对 diff 更友好）。压缩包格式的 `.archimate` 文件是二进制的，而不是文本——如果在检测格式之前就用文本解码器去读取它，会造成无法恢复的损坏。

```ts
import { readFileSync } from 'node:fs';
import { extractArchiModelXml, parseArchiModel } from '@cda/archi-semantic-core';

const bytes = readFileSync('MyModel.archimate'); // 按字节读取，而不是按文本读取
const xml = extractArchiModelXml(bytes);
const model = parseArchiModel(xml);
```

`extractArchiModelXml` 会检测压缩包的文件签名，然后要么直接把输入解码为 UTF-8 文本（纯 XML 情况），要么先解压再解码其中的 `model.xml` 条目（压缩包情况）——使用的是 Node 内置的 `zlib`，不引入额外依赖。内嵌图片不会被提取出来；如果你需要自己定位这些图片，可以把 `ArchiProfile.imagePath` 或 `DiagramModelImageProvider` 的图片路径仅仅当作指向压缩包内 `images/` 条目的引用来使用。

## 验证

`validateArchiModel` 会构建一个覆盖全部七种带 id 集合（文件夹、元素、关系、视图、图表对象、图表连接、便签——Archi 的所有 id，无论语义还是视觉层面的，都取自同一个共享的 id 池）的全局 id 集合，然后进行以下检查：

| 代码 | 触发条件 |
| --- | --- |
| `missing-id` | 某个条目完全没有 `id`。 |
| `duplicate-id` | 同一个 `id` 在模型中的多个条目上重复出现。 |
| `broken-relationship-source` | 某个关系的 `sourceId` 无法解析到任何已知 id。 |
| `broken-relationship-target` | 某个关系的 `targetId` 无法解析到任何已知 id。 |
| `unrecognized-junction-type` | 某个 `Junction` 元素的原生 `type` 属性既不是 `""`/缺失（对应 And），也不是 `"or"`（对应 Or）。 |
| `broken-diagram-object-element` | 某个图表对象的 `archimateElementId` 无法解析到任何已知 id。 |
| `broken-diagram-object-model-reference` | 某个 `DiagramModelReference` 的 `referencedModelId` 无法解析到任何已知 id。 |
| `broken-diagram-connection-relationship` | 某个连接的 `archimateRelationshipId` 无法解析到任何已知 id。 |
| `broken-diagram-connection-source` | 某个连接的 `sourceId` 无法解析到任何已知 id。 |
| `broken-diagram-connection-target` | 某个连接的 `targetId` 无法解析到任何已知 id。 |

每一条问题都带有一个 `path` 定位符（例如 `"relationships[rel-1].sourceId"`），指向返回的 `ArchiModel`——而不是原始 XML——因此可以直接追溯到出问题的那个字段。

`{ valid: true, errors: [] }` 意味着每个带 id 的条目都拥有唯一且非空的 id，并且这个验证器所检查的每一个交叉引用都能正确解析——但它不会检查 `ArchiBounds` 是否完整、`ArchiProfile`/`profiles` 引用，也不会检查任何与样式或 feature 相关的内容。

## 已覆盖的内容

- 模型元数据：id、名称、原生版本号、`purpose`，以及模型级别的属性。
- 文件夹，包括空文件夹、层级结构、路径、文档和属性。
- 以通用方式保留的 ArchiMate 元素和关系。
- 预先计算好的包含/连接 id 索引（`childrenIds`、`connectionIds`、`diagramObjectIds`、`diagramConnectionIds`、`noteIds`、`containedIds`）——无需遍历树结构即可知道谁包含谁。
- Junction 的 AND/OR 原生语义。
- 关系特有的 Access、Influence 和 Association 属性。
- 视图，包括原生的 `viewpoint`、`connectionRouterType`、嵌套的图表对象、便签、连接和 bendpoints。
- `DiagramModelReference` 节点，包括 `referencedModelId`。
- 通用视觉容器，例如 Archi 的 `Group`，包括其自身的 `documentation` 以及原生的备用图形/图标选择器（`figureType`）。
- 文档和属性。
- 视觉样式：填充色/线条颜色/字体颜色，字体名称/字号/粗体/斜体，线宽，填充不透明度（`alpha`）。
- Archi 通用的 `<feature>` 扩展条目，以及基于它构建的 Label Expressions（原始模板字符串，以及针对"core"占位符集合的求值结果）。
- Specializations 和通用 Profiles，以及哪些元素/关系引用了它们。
- 两种 `.archimate` 文件形态：纯 XML，以及 Archi 的压缩包（zip）变体。
- 结构验证（`validateArchiModel`）：全部七种带 id 集合中的缺失/重复 id 以及悬空引用——参见[验证](#验证)。
- 诸如 `&#xD;&#xA;` 之类的 XML 数字字符引用，会被解码为文本。

各个集合都保留原始 XML 中的顺序。

## 不在范围内的内容

- ArchiMate Model Exchange File Format 的导入或导出。
- 编辑或修改模型。
- 将 `ArchiModel` 重新序列化回原生 `.archimate` XML。
- 渲染、绘图、自动布线（routing）或 UI。
- 从压缩包（zip）格式的 `.archimate` 文件中提取内嵌图片的*字节数据*——只会保留 `imagePath` 这个引用字符串。
- Label Expressions 的"Reference Prefix"形式（`$parent{...}`、`$source{...}`、`$model{...}`、`$<relationship>:source{...}` 等），因为它们需要遍历模型图，而不是只读取单个对象。`${specialization}` 和 `${viewpoint}` 占位符同样不会被求值。
- 将 Archi 的 Sketch 和 Canvas 视图当作语义化的 `ArchiView`。这些视图使用的是非 `archimate:` 的根类型，会以通用方式保留，而不会被重新解释为 ArchiMate 视图。

## 环境要求和模块格式

Node.js：

```text
^20.0.0 || ^22.0.0 || >=24.0.0
```

该包仅支持 ESM：

```json
{
  "type": "module"
}
```

不支持 CommonJS 的 `require('@cda/archi-semantic-core')` 用法。

现代浏览器打包工具同样可以使用这个包。

## 开发

```sh
git clone https://github.com/Continuous-DrivenArchitecture/archi-semantic-core.git
cd archi-semantic-core
npm install

npm run typecheck
npm run build
npm test
npm pack --dry-run
```

## 设计原则

`archi-semantic-core` 应当理解**Archi 原生的模型语义**。

它不应该知道其他格式、渲染器、编辑器或交换标准选择如何表示这些语义。

正是这条边界，让这个解析器能够作为其他 Continuous-DrivenArchitecture 工具的可复用基础。

## 许可证

MIT——参见 [LICENSE](./LICENSE)。
