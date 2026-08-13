# Design Principles 设计原则

Three core principles guide every change to this project. If a change conflicts
with one of them, the change needs a strong justification.

本项目的一切改动都遵循三条核心设计原则。任何改动若与其中一条冲突，都需要强有力的理由。

---

## 1. Zero intrusion into note content 对笔记内容零侵入

Notes stay perfectly readable in **source mode** and **live preview**. The plugin
never rewrites, reorders, or injects markers into note content — it only *reads*
(via `metadataCache`) and *renders UI* (the bottom bar, CSS overrides). The only
in-note footprint is the `deck` frontmatter property, which is plain, readable YAML.

笔记在**源码模式**与**实时预览**下保持完全可读。插件从不改写、重排或在笔记内容中
注入任何标记——它只**读取**（通过 `metadataCache`）并**渲染 UI**（底部栏、CSS 覆盖）。
笔记内唯一的痕迹是 `deck` 这个 frontmatter 属性，它本身就是普通、可读的 YAML。

## 2. Minimal intrusion into properties 对 properties 最小侵入

The plugin adds exactly **one** reserved frontmatter key — `deck` — and nothing
else. All other keys are left untouched and merely *displayed* if the user already
has them. Demo notes keep this footprint to the bare minimum (no decorative
`tags`), so adopting the plugin costs exactly one property per note.

插件只新增**一个**保留属性 `deck`，别无其他。其余属性一律原样保留、仅作展示。
示例笔记也保持这一最小足迹（不带装饰性的 `tags`），因此使用本插件的成本就是
每篇笔记一个属性。

## 3. Efficient code, no unnecessary persistence 实现高效、不持久化多余数据

- Everything derived from the notes (deck chains, page numbers) is computed
  **on the fly** from `metadataCache` — in-memory and cheap; nothing is cached
  to disk.
- The only persisted data are two UI booleans (show ◀ ▶ buttons, show page
  number), via `loadData/saveData`.
- The 500 ms fallback timer re-renders only when the `"path|mode"` key actually
  changed; every other refresh is event-driven.
- No background scans, no indexes, no writes to the vault.

- 从笔记推导的一切（套件链、页号）都**即时计算**自 `metadataCache`——纯内存、
  开销小，绝不落盘缓存。
- 唯一持久化的数据是两个 UI 开关（◀ ▶ 按钮、页号显示），通过
  `loadData/saveData` 保存。
- 500 ms 兜底定时器只在 `"path|mode"` 真正变化时才重绘；其余刷新全部由事件驱动。
- 不做后台扫描、不建索引、不向 vault 写入任何数据。

---

## Trade-offs 权衡

- Reading view hides the in-note properties panel (CSS only) to avoid duplicating
  what the bottom bar shows — the note file itself is never touched.
- The `deck` chain walk reads the frontmatter of every note in the chain on each
  refresh; acceptable because `metadataCache` is in-memory and decks are small.
  If this ever matters, add a memoized chain cache keyed by file stamp.

- 阅读模式下隐藏笔记内属性面板（纯 CSS），避免与底部栏重复——笔记文件本身从不改动。
- `deck` 链式解析每次刷新会读取链上所有笔记的 frontmatter；由于 `metadataCache`
  在内存中、且套件通常很小，这是可接受的。若将来成为瓶颈，可按文件 stamp
  加一层链缓存。
