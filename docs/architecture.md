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
- **显示交互层**：负责 DOM 渲染与事件绑定，调用业务层 / 数据层接口，自身不包含判题、记录等业务规则。
- **业务处理层**：纯逻辑，不含 DOM 操作；`records.js` 依赖存储层，`session.js` 只做纯计算并调用 `records.js` 取错题 / 收藏列表。
- **数据读取层**：加载并缓存 JSON，统一注入题库 `_base`（题库目录），供解析题库内相对资源。
- **存储读取层**：唯一接触 `localStorage` 的模块，屏蔽异常，保证上层不因存储失败而崩溃。

## 脚本加载顺序（每个页面在 `</body>` 前）

```
config.js → store.js → data.js → records.js → session.js → ui/common.js → ui/<当前页>.js
```

顺序保证：`config` 先于一切（`store.js` 依赖 `App.config.storagePrefix`），页面脚本最后（依赖前面的全部模块）。

## 典型数据流

1. **门户加载**：`home.js` → `data.getCatalog()` → 渲染封面与目录。
2. **进入刷题**：`bank.html?id=class-a` → `bank.js` → `data.getBank('class-a')` → `records.stats()` 展示进度；点“顺序刷题”跳转 `practice.html?bank=class-a&mode=sequential`。
3. **作答**：`practice.js` 收到作答 → `session.check()` 判题 → `records.setAnswer()` 写入 → `ui.renderQuestion()` 展示反馈。
4. **收藏**：`records.toggleFavorite()` 写入 → 更新按钮状态。
5. **记录页**：`records.js` → `records.favoriteList() / wrongList()` → 渲染列表。

## 存储键约定

所有键由 `store.js` 统一加前缀 `examapp:`（见 `config.storagePrefix`）：

| 键 | 内容 | 说明 |
| --- | --- | --- |
| `examapp:record.<bankId>` | `{ answer: {qid: "correct"|"wrong"}, favorite: [qid...] }` | 每个题库一份作答记录 |

本地保存的是**最小必要信息**：只存“题号 → 对错状态”与“收藏题号”，不重复保存题干等题库内容（题库本身由 `info.json` 提供，可随时更新）。
