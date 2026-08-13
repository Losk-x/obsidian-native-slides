# read-props-bar — Reading-View Properties Bar (属性底栏)

> An Obsidian plugin that hides the status bar and shows the current note's
> properties in a bottom bar during reading view — with PPT-style deck
> navigation driven by a single frontmatter property.
>
> 一个 Obsidian 插件：隐藏状态栏，在阅读模式下把当前笔记的属性显示在底部
> 属性栏中——通过一个 frontmatter 属性实现 PPT 式的前一页 / 后一页翻页与
> 自动编号。

---

## English

**Design principles** — zero intrusion into note content, minimal properties footprint (a single `deck` key), and efficient code with no unnecessary persistence. See [docs/design.md](docs/design.md).

### Features

- Hides Obsidian's native status bar and renders a **properties bar** at the bottom of the window.
- In **reading view**, shows the current note's properties (YAML frontmatter) as chips in the bar; the in-note properties panel is hidden (kept in edit view).
- Reading view **auto-enters a fullscreen-like mode**: the ribbon, sidebars, tab bar and the pane header bar are hidden, and the OS-level fullscreen is requested (falls back gracefully). Everything restores when you leave reading view — and **pressing `Esc` exits both fullscreen and reading view**.
- **PPT-style deck navigation** with **one reserved frontmatter property, `deck`** (up to two markdown links):

  ```yaml
  # Overview page — one link = the first page of the deck
  deck: ["[[welcome]]"]

  # Slide page — first link = the overview page, second link = the next slide
  deck: ["[[overview]]", "[[slide-2]]"]
  # Last slide — only the overview link
  deck: ["[[overview]]"]
  ```

  - **Page numbers are auto-computed** by scanning the vault and walking the link chain (overview → slide 1 → slide 2 → …), so no `page-number` property is needed. The overview page shows "Overview", slides show "Page N".
  - Flip pages with the ◀ ▶ buttons on the left of the bar, or with the **Previous Page / Next Page** commands (default hotkeys `Cmd/Ctrl+Shift+←/→`, rebindable under **Settings → Hotkeys**). Slide 1's ◀ goes back to the overview; the last slide has no ▶.
  - Navigation keeps you in reading view, so the immersive fullscreen experience is uninterrupted.
- A **settings tab** toggles the ◀ ▶ buttons and the page number.

### Overview page with an embedded Base view

The repo ships an `overview.md` that embeds an Obsidian **Base** view (core **Bases** plugin, introduced in Obsidian 1.10) filtering every note that **links to the overview page** — i.e. all slides:

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

Enable the core plugin if the view does not render: *Settings → Core plugins → Bases*.

### Getting started

1. Open this folder as a vault: Obsidian → *Open another vault* → select this `obsidian/` directory.
2. Allow community plugins: *Settings → Community plugins → Turn off Safe mode* (one-time, manual).
3. Enable **Read-View Properties Bar** under *Settings → Community plugins*.
4. (For the overview page) Enable the core **Bases** plugin: *Settings → Core plugins → Bases*.

Open `welcome.md` and press `Cmd/Ctrl+E` to switch to reading view — the bottom bar shows the properties, ◀ ▶ buttons and "Page 1". Press `Cmd/Ctrl+Shift+→` to go to slide 2.

Demo deck: `overview.md` → `welcome.md` → `slide-2.md` → `slide-3.md`.

### How it works

| Piece | Mechanism |
|---|---|
| Hide the status bar | `styles.css`: `.status-bar { display: none !important; }` |
| Hide the in-note properties panel (reading view) | `.markdown-reading-view .metadata-container { display: none; }` |
| Fullscreen reading mode | `refresh()` adds `rv-props-fullscreen` to `body` when in reading view; CSS hides ribbon / sidebars / tab bar / `.view-header`; `requestFullscreen()` tries OS fullscreen |
| Esc exits fullscreen + reading view | `fullscreenchange` handler: when the OS leaves fullscreen while we were fullscreen, call `view.setMode("source")` (guarded so our own `exitFullscreen()` never re-triggers it) |
| Deck resolution | `computeDeck()` reads `deck` (≤ 2 links) → resolves the overview and the first page → walks the chain via each slide's second link (cycle-guarded) → returns the chain + current index |
| Page number | position in the chain: index 0 = "Overview", slides = "Page N"; no stored `page-number` property |
| PPT navigation | `navigate()` steps along the chain and opens via `workspace.openLinkText`, preserving reading view |
| Settings | `PluginSettingTab` + `loadData/saveData` persist the toggles; hotkeys use Obsidian's native command system |

### Development

The plugin is written in TypeScript. You don't need to know TS to ask for changes — describe what you want in natural language and the code will be updated and rebuilt. To build manually:

```sh
cd obsidian/.obsidian/plugins/read-props-bar
npm install        # first time only (downloads esbuild etc.)
npm run build      # compiles main.ts → main.js
npm run check      # optional: TypeScript type-check (tsc --noEmit)
```

Then reload the plugin in Obsidian (or install the **Hot Reload** community plugin).

### Known limitations

- Properties come from **frontmatter** (the `---` YAML block at the top); inline `key:: value` properties are not read.
- Hiding the status bar is **global** (all notes, all modes); remove the `.status-bar` rule in `styles.css` to disable.
- `deck` is a **reserved key name**.
- The default hotkeys shadow the editor's "select to line start/end" shortcuts in edit view; remove them in **Settings → Hotkeys** if you don't need page navigation.
- OS-level fullscreen relies on Electron's Fullscreen API; where unsupported it degrades to "hide sidebars and tab bar only".
- Quote link values in YAML (`deck: ["[[slide-2]]"]`) — unquoted `[[...]]` becomes a nested YAML array (the plugin tolerates it, but quoting is the correct form).
- The deck chain must not contain cycles; a broken link simply ends (or excludes) the chain.

---

## 中文说明

**设计原则** —— 对笔记内容零侵入、对 properties 最小侵入（仅 `deck` 一个属性）、实现高效且不持久化多余数据。详见 [docs/design.md](docs/design.md)。

### 功能特性

- 隐藏 Obsidian 原状态栏，在窗口底部渲染一条**属性底栏**。
- **阅读模式**下把当前笔记的属性（YAML frontmatter）以小标签形式显示在底栏中；
  笔记顶部的属性面板同步隐藏（编辑模式保留）。
- 阅读模式**自动进入全屏沉浸态**：隐藏丝带、左右侧边栏、tab 栏和窗格标题栏
  （带前进/后退键的那条栏），并尝试系统级全屏（不支持时自动退化为仅隐藏栏）；
  回到编辑模式一切自动还原——**按 `Esc` 退出全屏的同时也会退出阅读模式**。
- **PPT 式翻页**，只用一个保留属性 **`deck`**（最多两个 markdown 链接）：

  ```yaml
  # 概览页 —— 一个链接 = 本套 PPT 的第一页
  deck: ["[[welcome]]"]

  # 放映页 —— 第一个链接 = 概览页，第二个链接 = 下一页
  deck: ["[[overview]]", "[[slide-2]]"]
  # 最后一页 —— 只保留概览页链接
  deck: ["[[overview]]"]
  ```

  - **页号自动计算**：扫描全库、沿链接链（概览 → 第 1 页 → 第 2 页 → …）编号，
    无需再写 `page-number` 属性。概览页显示 "Overview"，放映页显示 "Page N"。
  - 点底栏左侧 ◀ ▶ 按钮翻页，或用 **上一页 / 下一页** 命令
    （默认快捷键 `Cmd/Ctrl+Shift+←/→`，可在 **设置 → 快捷键** 重新绑定）；
    第 1 页的 ◀ 回到概览页，最后一页没有 ▶。
  - 翻页后仍停留在阅读模式，沉浸式全屏体验不中断。
- **设置页**：可开关 ◀ ▶ 按钮与页号显示。

### 概览页与内置 Base 视图

仓库自带 `overview.md`，其中嵌入了 Obsidian **Base**（核心插件 **Bases**，
Obsidian 1.10 引入）视图，筛选所有**指向本概览页**的笔记——即全部放映页：

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

如果 Base 视图没有渲染：启用核心插件 *设置 → 核心插件 → Bases*，然后重载该笔记。

### 快速开始

1. 把这个文件夹作为笔记库打开：Obsidian → 打开其他仓库 → 选择本 `obsidian/` 目录；
2. 允许第三方插件：设置 → 第三方插件 → 关闭"安全模式"（一次性手动操作）；
3. 在第三方插件列表启用 **Read-View Properties Bar**；
4. （使用概览页时）启用核心插件 *设置 → 核心插件 → Bases*。

打开 `welcome.md`，按 `Cmd/Ctrl+E` 切到阅读模式——底部即显示属性、◀ ▶ 按钮和
"Page 1"；按 `Cmd/Ctrl+Shift+→` 进入第 2 页。

演示套件：`overview.md` → `welcome.md` → `slide-2.md` → `slide-3.md`。

### 工作原理

| 部分 | 原理 |
|---|---|
| 隐藏状态栏 | `styles.css`：`.status-bar { display: none !important; }` |
| 隐藏顶部属性面板（阅读模式） | `.markdown-reading-view .metadata-container { display: none; }` |
| 全屏阅读模式 | `refresh()` 检测到阅读模式即给 `body` 加 `rv-props-fullscreen` 类（CSS 隐藏丝带/侧边栏/tab 栏/`.view-header`），并调用 `requestFullscreen()` 尝试系统全屏 |
| Esc 退出全屏 + 阅读模式 | `fullscreenchange` 处理器：系统退出全屏且我们正处全屏时调用 `view.setMode("source")`（有守卫，我们自己调用 `exitFullscreen()` 时不会误触发） |
| 套件解析 | `computeDeck()` 读取 `deck`（≤ 2 个链接）→ 解析概览页与第一页 → 沿每页第二个链接走链（有防环保护）→ 返回完整链 + 当前索引 |
| 页号 | 链中的位置：索引 0 = "Overview"，放映页 = "Page N"；不需要存储 `page-number` |
| PPT 翻页 | `navigate()` 沿链步进，用 `workspace.openLinkText` 打开，保持阅读模式 |
| 设置 | `PluginSettingTab` + `loadData/saveData` 持久化开关；快捷键走 Obsidian 原生命令系统 |

### 开发

插件用 TypeScript 编写。你不需要会 TS——用自然语言描述想改的功能即可，代码会更新并重新编译。
手动构建：

```sh
cd obsidian/.obsidian/plugins/read-props-bar
npm install        # 仅首次需要（下载 esbuild 等）
npm run build      # 编译 main.ts → main.js
npm run check      # 可选：TypeScript 类型检查（tsc --noEmit）
```

然后在 Obsidian 里重载插件（或装 Hot Reload 社区插件）。

### 已知限制

- 属性来源是 **frontmatter**（笔记开头的 `---` YAML 块）；正文中的 `key:: value` 内联属性暂不读取。
- 隐藏状态栏是**全局**的（所有笔记、所有模式）；不想要可删掉 `styles.css` 里的 `.status-bar` 规则。
- `deck` 是**保留属性名**。
- 默认快捷键会占用编辑模式下"选择到行首/行尾"的按键；不需要翻页快捷键可在 设置 → 快捷键 中移除。
- 系统级全屏依赖 Electron 的全屏 API；不支持的环境自动退化为"仅隐藏侧边栏与 tab 栏"。
- YAML 里链接建议**加引号**（`deck: ["[[slide-2]]"]`）——不加引号 `[[...]]` 会被 YAML 解析成嵌套数组（插件能兼容，但规范写法更稳）。
- 套件链不能有环；某条链接失效只会终止（或排除）该链，不会报错。

---

## License / 许可证

Released under the [MIT License](LICENSE). Copyright (c) 2026 Yuanhui Luo.
本项目基于 [MIT License](LICENSE) 发布。Copyright (c) 2026 Yuanhui Luo。
