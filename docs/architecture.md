# 分层架构与数据流

整个前端按职责划分为四层，模块之间只通过 `window.App` 命名空间上暴露的公开接口通信，**禁止跨层直接访问**（例如 UI 层不得直接调用 `localStorage`）。

```
┌─────────────────────────────────────────────────────┐
│  显示交互层  ui/home.js  ui/bank.js                  │
│              ui/practice.js  ui/records.js           │
│              ui/common.js（共享渲染 / 工具）           │
├─────────────────────────────────────────────────────┤
│  业务处理层  records.js（作答记录 / 收藏）             │
│              session.js（会话构建 / 判题 / 评分）       │
├─────────────────────────────────────────────────────┤
│  数据读取层  data.js（题库 / 目录加载与缓存）           │
├─────────────────────────────────────────────────────┤
│  存储读取层  store.js（localStorage 键值读写）         │
└─────────────────────────────────────────────────────┘
                  ↑ 依赖方向：上层依赖下层
```

- **config.js** 为基础设施：路径基准（`App.url`）、URL 参数（`App.util`）、DOM 就绪（`App.ready`）。
- **site.js** 为文案配置：集中存放 JS 需要展示的界面文字（刷题模式卡片、空状态、考试提示等），见下文“文案组织”。品牌文案（封面 / 页脚 / 页面标题）直接写在对应 HTML 中，题库标题、简介等数据在 `banks/*.json` 中。
- **theme.js** 为主题切换：默认跟随浏览器（`prefers-color-scheme`），右下角按钮在“跟随系统 / 浅色 / 深色”间循环，偏好写入 `localStorage`。
- **显示交互层**：负责 DOM 渲染与事件绑定，调用业务层 / 数据层接口，自身不包含判题、记录等业务规则。
- **业务处理层**：纯逻辑，不含 DOM 操作；`records.js` 依赖存储层，`session.js` 只做纯计算并调用 `records.js` 取错题 / 收藏列表。
- **数据读取层**：加载并缓存 JSON，统一注入题库 `_base`（题库目录），供解析题库内相对资源。
- **存储读取层**：唯一接触 `localStorage` 的模块，屏蔽异常，保证上层不因存储失败而崩溃。

## 脚本加载顺序（每个页面在 `</body>` 前）

```
config.js → site.js → store.js → data.js → records.js → session.js → ui/common.js → ui/<当前页>.js → theme.js
```

顺序保证：`config` 先于一切（`store.js` 依赖 `App.config.storagePrefix`），页面脚本最后（依赖前面的全部模块）。

## 文案组织（内容与代码分离）

为了便于整体替换、把站点改作其他用途，文案分三类存放：

1. **品牌文案**：门户封面（标题 / 副标题 / 徽标）、页脚、各页 `<title>` —— 直接写在对应 HTML 里。
2. **数据**：题库标题、简介、题数、题型分布、模拟考试配置、题目内容 —— 在 `banks/catalog.json` 与 `banks/<id>/info.json` 里。
3. **界面文案**：刷题模式卡片、空状态、考试提示、按钮等由 JS 渲染的文字 —— 集中在 `assets/script/site.js` 的 `App.site` 里。

修改任意一类都不会影响其余部分。

## 典型数据流

1. **门户加载**：封面文案直接写在 `index.html`；`home.js` → `data.getCatalog()` → 渲染题库目录列表。
2. **进入刷题**：`bank.html?id=a` → `bank.js` → `data.getBank('a')` → `records.stats()` 展示进度，并读取 `bank.exam` 展示模拟考试信息；点“顺序刷题”跳转 `practice.html?bank=a&mode=sequential`。
3. **作答**：`practice.js` 收到作答 → `session.check()` 判题 → `records.setAnswer()` 写入 → `ui.renderQuestion()` 展示反馈。
4. **收藏**：`records.toggleFavorite()` 写入 → 更新按钮状态。
5. **记录页**：`records.js` → `records.favoriteList() / wrongList()` → 渲染列表。

## 存储键约定

所有键由 `store.js` 统一加前缀 `examapp:`（见 `config.storagePrefix`）：

| 键 | 内容 | 说明 |
| --- | --- | --- |
| `examapp:record.<bankId>` | `{ answer: {qid: "correct"|"wrong"}, favorite: [qid...] }` | 每个题库一份作答记录 |
| `examapp:theme` | `"light"` / `"dark"`（缺省=跟随系统） | 主题偏好（由 theme.js 写入） |

另有一项会话级 UI 状态存于 `sessionStorage`：`examapp:recordsTab:<bankId>`（记录页当前 Tab），用于返回时保持所看的“收藏 / 错题”。

本地保存的是**最小必要信息**：只存“题号 → 对错状态”与“收藏题号”，不重复保存题干等题库内容（题库本身由 `info.json` 提供，可随时更新）。
