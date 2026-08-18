# Native Slides — 面向 deck 笔记的 Slides 模式

[English](README.md) | **简体中文**

> 一个 Obsidian 插件：把 deck 笔记变成 **Slides**——沉浸式、可编辑（Live Preview）的
> "一屏一卡"视图，slides 栏提供属性展示与 PPT 式翻页——由一个 frontmatter 属性驱动。

**设计原则** —— 对笔记内容零侵入、对 properties 最小侵入（仅 `deck` 一个属性）、不持久化配置以外的不必要内容、实现高效且代码规范优美。详见 [docs/design-zh.md](docs/design-zh.md)。

## 功能特性

- **Slides 模式**（仅 deck 笔记）：沉浸式、可编辑的卡片视图——"一屏一卡"。用 **Toggle Slides Mode** 命令（默认快捷键 `Mod+Shift+E`）进入；丝带、左右侧边栏与 tab 栏隐藏，幻灯片内容位于**居中卡片**（宽 80vw，主题自适应）内，外观可从 **六套内置样式模板**中选择——_Lecture (jyy)_（默认，参照 [jyywiki.cn](https://jyywiki.cn) 讲义的幻灯片卡片制作）、_虚线边框_、_纸片卡片_、_极简_、_强调边_、_磨砂玻璃_——每套模板同时重绘卡片与 slides 栏；默认隐藏文件名，可通过 **Slides title** 设置选择显示任意 frontmatter 属性（或 `filename` 显示文件名）作为卡片标题，编辑器**裁切到单屏**（不滚动——超出折叠的内容被裁掉），slides 栏显示笔记属性、◀ ▶ 翻页与自动页号。退出时还原进入前的视图（Source / Live Preview / Reading）。
- **原生模式保持不动**：Source 模式、默认 Live Preview 与阅读视图都保持 Obsidian 默认行为——不隐藏状态栏、不加 slides 栏、不全屏、不改样式。Slides 模式是插件的唯一界面，因此可与其它也会修改阅读视图的插件和平共处。
- **PPT 式翻页**，只用一个保留属性 **`deck`**（最多两个 markdown 链接）：

  ```yaml
  # 概览页 —— 一个链接 = 本套 PPT 的第一页
  deck: ["[[welcome]]"]

  # 放映页 —— 第一个链接 = 概览页，第二个链接 = 下一页
  deck: ["[[overview]]", "[[slide-2]]"]
  # 最后一页 —— 只保留概览页链接
  deck: ["[[overview]]"]
  ```

  - **页号自动计算**：沿链接链（概览 → 第 1 页 → 第 2 页 → …）编号，无需再写 `page-number` 属性。概览页显示 "Overview"，放映页显示 "Page N"。
  - 点 slides 栏 ◀ ▶ 按钮翻页，或用 **上一页 / 下一页** 命令（默认快捷键 `Cmd/Ctrl+Shift+←/→`，可在 **设置 → 快捷键** 重新绑定）。在原生模式按下也会自动进入 Slides 并翻页。两个箭头始终显示；无法移动的那一个（第一页的 ◀、最后一页的 ▶）为浅灰色禁用态。
  - **Create Next Slide 命令**：在当前笔记之后创建一张新幻灯片——新文件命名为 `<当前名>-next`（重名自动追加 `-2`、`-3`），两张笔记的 `deck` 属性自动改写，新笔记以编辑模式打开，可直接输入内容。若当前笔记的第二个 `deck` 链接指向不存在的笔记，则直接创建那个声明的笔记（顺带消除 ⚠ 警告）；在概览页上执行则插入一张新的**第一页**。不适用时命令在面板中置灰。

- **演示时没有闪烁光标**：点一下 slides 栏即可让编辑器失焦——讲解时不再有闪烁的输入光标；点回任意幻灯片内容即可继续编辑。**Toggle Mouse Pointer** 命令（`Mod+Shift+M`）更进一步：全窗口隐藏鼠标指针并顺带失焦；再执行一次恢复，退出 Slides 模式也会自动恢复。
- **自动进入 Slides 模式**（设置项，默认关）：打开 deck 笔记直接进入 Slides；关闭则手动进入。
- **设置页**：可选择样式模板，可开关 ◀ ▶ 按钮、页号显示与自动进入。
- **断链警告**：`deck` 链接指向不存在的笔记时，slides 栏显示 ⚠ 警告标签，方便作者发现笔误（该链只会终止或排除，不会报错）。
- **命令**：_Toggle Slides Mode_（`Mod+Shift+E`）、_Previous Page / Next Page_、_Create Next Slide_、_Toggle Mouse Pointer_（`Mod+Shift+M`）、_Toggle Slides Bar_——都可在 _设置 → 快捷键_ 重新绑定。

## 概览页与内置 Base 视图

示例库自带 `overview.md`，其中嵌入了 Obsidian **Base**（核心插件 **Bases**，Obsidian 1.10 引入）视图，筛选所有**指向本概览页**的笔记——即全部放映页：

````markdown
```base
filters:
  and:
    - file.hasLink("overview")
views:
  - type: table
    name: Deck
```
````

如果 Base 视图没有渲染：启用核心插件 _设置 → 核心插件 → Bases_，然后重载该笔记。

> Base 视图需要 Obsidian **1.10+**（Bases 核心插件）；插件本身支持 **1.7.0+**（其 `minAppVersion`）——旧版本上概览表格只是不渲染而已。

## 示例库

演示笔记位于 [`example-vault/`](example-vault/)，这就是要打开的 Obsidian 示例库。它包含 `overview.md`、`welcome.md`、`slide-2.md`、`slide-3.md`、`broken-link-demo.md`（断链警告演示）、`folded-properties-demo.md`（Slides 属性演示）、`typography-demo.md`（Markdown 全家桶——标题/列表/任务/引用/代码块/表格/图片，用于测试 Slides 排版）、五个 `typography-sample-*.md` 笔记（**仅开发版** `Debug: Dump Typography Styles` 命令专用的固定一页采样笔记——请勿改名或删除）、一份最小化的 `.obsidian/` 配置，以及一个插件目录 `example-vault/.obsidian/plugins/native-slides/`，其中的文件（`manifest.json`、`main.js`、`styles.css`）都是**指向仓库根目录的符号链接**——示例库始终运行当前构建。

> 符号链接需要文件系统支持（macOS/Linux 开箱即用；Windows 需开启开发者模式）。若无法使用符号链接，把 `main.js`、`manifest.json`、`styles.css` 复制到 `example-vault/.obsidian/plugins/native-slides/` 即可。

## 快速开始

1. 打开示例库：Obsidian → 打开其他仓库 → 选择本仓库内的 `example-vault/` 目录；
2. 允许第三方插件：设置 → 第三方插件 → 关闭"安全模式"（一次性手动操作）；
3. 在第三方插件列表启用 **Native Slides**；
4. （使用概览页时）启用核心插件 _设置 → 核心插件 → Bases_。

打开 `welcome.md`，按 `Cmd/Ctrl+Shift+E` 进入 Slides 模式——底部即显示属性、◀ ▶ 按钮和 "Page 1"；按 `Cmd/Ctrl+Shift+→` 进入第 2 页。

演示套件：`overview.md` → `welcome.md` → `slide-2.md` → `slide-3.md`。

## 工作原理

| 部分                      | 原理                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 隐藏状态栏（Slides 模式） | `body.native-slides-mode .status-bar { display: none }`——原生模式保留 Obsidian 默认状态栏                                                                           |
| 沉浸布局（Slides 模式）   | `body.native-slides-mode` 隐藏丝带/侧边栏/tab 栏；slides 栏高度对齐 tab bar 实测高度（`--native-slides-tabbar-height`）                                             |
| 隐藏笔记内属性面板        | `.markdown-source-view.mod-cm6.is-live-preview .metadata-container { display: none }`——属性改由 slides 栏展示                                                       |
| 套件解析                  | `computeDeck()` 读取 `deck`（≤ 2 个链接）→ 解析概览页与第一页 → 沿每页第二个链接走链（有防环保护）→ 返回完整链 + 当前索引                                           |
| 页号                      | 链中的位置：索引 0 = "Overview"，放映页 = "Page N"；不需要存储 `page-number`                                                                                        |
| PPT 翻页                  | `navigate()` 沿链步进，用 `workspace.openLinkText` 打开；从原生模式触发时会先进入 Slides 模式                                                                       |
| Slides 进入/退出          | `enterSlides()` 记录当前视图状态并强制切到 Live Preview；`exitSlides()` 精确还原该视图状态（Source / Live Preview / Reading）                                       |
| Create Next Slide         | `planCreateNext()`（纯逻辑核心）算出新文件名、新笔记的 `deck` 链接与改写方案；命令用 `vault.create` + `fileManager.processFrontMatter` 执行，并在编辑模式打开新笔记 |
| 设置                      | `PluginSettingTab` + `loadData/saveData` 持久化开关；快捷键走 Obsidian 原生命令系统                                                                                 |

## 开发

插件用 TypeScript 编写。你不需要会 TS——用自然语言描述想改的功能即可，代码会更新并重新编译。
手动构建：

在仓库根目录执行：

```sh
npm ci             # 仅首次需要（下载 esbuild 等）
npm run build      # 编译 main.ts → main.js（开发版：含 debug 命令）
npm run build:release  # 发布版：压缩并移除 debug 命令
npm run check      # 可选：TypeScript 类型检查（tsc --noEmit）
npm run test       # 可选：vitest 单元测试
npm run lint       # 可选：ESLint
npm run format:check  # 可选：Prettier
```

### 开发循环（重建 + 重载）

先重建，再手动重载：

```sh
npm run dev        # 监听 main.ts，变更时自动重建 main.js
```

编辑 `main.ts` 后，在 Obsidian 里重载插件：按 `Cmd/Ctrl+P` 打开命令面板，搜索 **Reload app without saving** 并执行（该命令默认没有绑定快捷键）。或者，在 _设置 → 第三方插件_ 里关闭再开启 **Native Slides**。

## 开发者

排版测量工具以**仅开发版**命令的形式提供，发布构建中不包含。

- **开发构建**（`npm run build` / `npm run dev`）会注册 `Debug: Dump Typography Styles` 命令：在**编辑与阅读两种视图**各采样一次当前笔记、计算差异，并写入 vault 根目录的 `.native-slides-debug.json`（无需手动复制控制台输出）。在开启 Slides 模式的 deck 笔记上运行；`example-vault/` 里五个 `typography-sample-*.md` 是它的固定一页采样夹具——请勿改名或删除。
- **发布构建**（`npm run build:release`）会压缩 `main.js`，并通过 `--define:DEV_MODE=false` + tree-shaking 彻底移除 debug 命令及其支撑代码。发布后执行 `npm run build` 即可恢复开发版产物。

源码已拆分到 `src/` 模块（`types`、`mode`、`deck-service`、`bar`、`commands`、`settings`、`debug`、`deck`、`createNext`），`main.ts` 仅作编排入口。

## 已知限制

- **仅桌面端**——插件面向 Obsidian 桌面应用；暂不支持移动端。
- Slides 模式仅作用于 **deck 笔记**（带 `deck` 属性的笔记）；其它笔记保持完全原生。
- 属性来源是 **frontmatter**（笔记开头的 `---` YAML 块）；正文中的 `key:: value` 内联属性暂不读取。
- `deck` 是**保留属性名**；`position` 键同样保留且不在 slides 栏显示（可留给其它工具使用，不会挤占 slides 栏）。
- 默认快捷键会占用编辑模式下"选择到行首/行尾"的按键；不需要翻页快捷键可在 设置 → 快捷键 中移除。
- YAML 里链接建议**加引号**（`deck: ["[[slide-2]]"]`）——不加引号 `[[...]]` 会被 YAML 解析成嵌套数组（插件能兼容，但规范写法更稳）。
- 套件链不能有环；某条链接失效只会终止（或排除）该链，不会报错。

## 许可证

本项目基于 [MIT License](LICENSE) 发布。Copyright (c) 2026 Yuanhui Luo。

## 致谢

- **Lecture (jyy) 样式模板**：参考 [jyywiki.cn](https://jyywiki.cn/) 的幻灯片卡片设计，作者 [蒋炎岩（Yanyan Jiang）](https://jyywiki.cn/)。卡片几何（80vw 宽度、柔和阴影、标题底部细线、实心圆点列表、列表项间距）均改编自蒋炎岩的讲义笔记设计。
