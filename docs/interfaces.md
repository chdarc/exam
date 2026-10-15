# 前端模块接口定义

所有模块挂载在 `window.App` 命名空间下。下文中的 `App` 即 `window.App`。

## config.js

| 接口 | 说明 |
| --- | --- |
| `App.config.base` | 站点根路径（以 `/` 结尾，由脚本地址自动探测） |
| `App.config.storagePrefix` | 存储键前缀，默认 `"examapp:"` |
| `App.config.catalogPath` | 总目录路径，默认 `"banks/catalog.json"` |
| `App.config.bankDir` | 题库文件夹名，默认 `"banks"` |
| `App.config.defaultExamDuration` | 考试默认时长（秒），默认 1800 |
| `App.url(rel)` | 把相对站点根的路径拼为完整地址；绝对地址原样返回 |
| `App.util.getParam(name)` | 读取当前页 URL 查询参数，返回字符串（无则 `""`） |
| `App.util.getIntParam(name, fallback)` | 读取整数参数，非法时返回 fallback |
| `App.ready(fn)` | DOM 就绪后执行 fn |

## site.js（文案配置）

| 接口 | 说明 |
| --- | --- |
| `App.site.modes` | 刷题模式卡片：`{ sequential / random / exam / records }`，每项含 `title`、`desc`、`icon`（内联 SVG） |
| `App.site.empty` | 空状态文案：`home`、`practice.{wrong/favorite/none}`、`records.{favorite/wrong}` |
| `App.site.records` | 记录页清除确认文案：`clearFavorite` / `clearWrong` |
| `App.site.exam` | 考试相关文案：`submit / submitted / saved / pass / fail / subjectiveNote / …` |
| `App.site.ui` | 通用界面文案：`confirm / cancel / submitAnswer / reference / explain / …` |

## theme.js（昼夜主题）

默认跟随浏览器 `prefers-color-scheme`，右下角按钮在“跟随系统 → 浅色 → 深色”间循环；偏好写入 `localStorage`（键 `examapp:theme`）。无对外公共接口。

## store.js（存储读取层）

| 接口 | 说明 |
| --- | --- |
| `App.store.get(key, fallback?)` | 读取并 JSON 反序列化；不存在或解析失败返回 fallback（默认 `null`） |
| `App.store.set(key, value)` | JSON 序列化写入；返回是否成功（boolean） |
| `App.store.remove(key)` | 删除指定键 |
| `App.store.keys(prefix)` | 返回以 prefix 开头的键名列表（不含命名空间前缀） |

## data.js（数据读取层）

| 接口 | 说明 |
| --- | --- |
| `App.data.fetchJSON(url)` | 拉取并解析 JSON，带内存缓存；失败 reject |
| `App.data.getCatalog()` | 返回 `Promise<总目录对象>` |
| `App.data.getBank(id)` | 返回 `Promise<题库对象>`，注入 `id` 与 `_base`（题库目录 URL） |
| `App.data.mediaUrl(bank, src)` | 把题库内相对资源地址解析为完整地址 |

## records.js（业务处理层 · 记录）

每个题库一份记录：`{ answer: { "<qid>": "correct"|"wrong" }, favorite: ["<qid>", ...] }`

| 接口 | 说明 |
| --- | --- |
| `App.records.get(bankId)` | 返回记录对象（结构缺失时自动补全） |
| `App.records.setAnswer(bankId, qid, correct)` | 记录一次作答（答对则错题自动消除） |
| `App.records.isWrong(bankId, qid)` | 是否处于错题状态 |
| `App.records.isCorrect(bankId, qid)` | 是否已作对 |
| `App.records.toggleFavorite(bankId, qid)` | 切换收藏，返回切换后是否“已收藏” |
| `App.records.isFavorite(bankId, qid)` | 是否已收藏 |
| `App.records.wrongList(bankId)` | 返回错题题号数组 |
| `App.records.favoriteList(bankId)` | 返回收藏题号数组（按加入顺序） |
| `App.records.stats(bankId, total)` | 返回 `{ total, correct, wrong, done }` |
| `App.records.clear(bankId)` | 清空该题库全部记录 |
| `App.records.clearFavorites(bankId)` | 仅清空该题库收藏 |
| `App.records.clearWrong(bankId)` | 仅清空该题库错题（删除所有“wrong”作答，保留“correct”） |

## session.js（业务处理层 · 会话）

| 接口 | 说明 |
| --- | --- |
| `App.session.MODES` | 支持的刷题模式数组：`sequential / random / exam / wrong / favorite` |
| `App.session.shuffle(arr)` | 返回打乱后的副本 |
| `App.session.shuffledIndices(n)` | 返回打乱后的 `[0..n-1]`（用于选项乱序） |
| `App.session.optionKeys(count)` | 生成选项键 `['A','B','C',...]`（支持超过 26 个） |
| `App.session.buildIds(bank, mode, examCount)` | 按模式生成题目 id 顺序列表；考试模式优先按 `bank.exam.distribution` 抽题 |
| `App.session.check(question, userAnswer)` | 判题（单选/多选），返回 boolean |
| `App.session.gradeExam(questions, answers)` | 批量评分，返回 `{ correct, total, questionCount, results }`（主观题 `ok` 为 `null`，不计分） |

## ui/common.js（显示交互层 · 共享）

| 接口 | 说明 |
| --- | --- |
| `App.ui.h(str)` | HTML 转义 |
| `App.ui.el(tag, attrs?, children?)` | 创建 DOM 节点（支持 `class/text/html/on*` 等属性） |
| `App.ui.typeMeta(type)` | 返回题型 `{ label, cls }` |
| `App.ui.formatAnswer(q)` | 把正确答案渲染为可读文本 |
| `App.ui.renderMedia(bank, mediaList)` | 渲染附加题干，返回容器 |
| `App.ui.renderQuestion(opts)` | 渲染题目卡片（见下） |
| `App.ui.confirm(message, onOk)` | 确认弹窗（“取消 / 确定”） |
| `App.ui.toast(msg)` | 轻提示 |

### renderQuestion(opts)

```js
App.ui.renderQuestion({
  container,          // 渲染目标 DOM
  bank, q,            // 题库与题目
  value,              // 当前已保存作答（单选 'A' / 多选 ['A','C'] / 主观 '文本'）
  order,              // 选项展示顺序（原选项索引数组，可选；缺省按原顺序）
  result,             // null | { ok: boolean|null } —— 非空时展示反馈并锁定
  selfMark,           // boolean —— 主观题“提交后待自评”状态
  onSingle(key),                          // 单选点击
  onMultipleChange(keys),                 // 多选切换（实时）
  onMultipleSubmit(keys),                 // 多选确定
  onSubjectiveChange(text),               // 主观输入
  onSubjectiveSubmit(text),               // 主观提交
  onSelfMark(ok)                          // 主观自评
});
```

## 页面模块

各页面模块（`ui/home.js`、`ui/bank.js`、`ui/practice.js`、`ui/records.js`）不暴露额外公共接口，仅在 `App.ready` 中初始化，通过 `document.body[data-page]` 识别当前页面。

## 页面路由（URL 参数）

| 页面 | 参数 | 说明 |
| --- | --- | --- |
| `index.html` | — | 门户首页 |
| `bank.html` | `id` | 题库 id |
| `practice.html` | `bank` | 题库 id（必填） |
| | `mode` | `sequential / random / exam / wrong / favorite`（默认 sequential） |
| | `count` | 考试模式抽题数（可选，默认全部） |
| | `q` | 打开后跳转到指定题号（可选） |
| `records.html` | `bank` | 题库 id |
| | `tab` | 初始 Tab：`favorite` / `wrong`（缺省 `favorite`，其次读取上次会话 Tab） |
