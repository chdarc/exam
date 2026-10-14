# 题库文件格式（banks/<id>/info.json）

一个题库目录包含：

```
banks/<id>/
├── info.json      # 题库信息 + 题目列表（唯一必需文件）
└── assets/        # 题库内资源（图片 / 音频 / 视频 / 文件，按需）
```

## 顶层字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `version` | number | 是 | 格式版本，当前为 `1` |
| `id` | string | 否 | 题库 id（页面加载时会以 URL 参数覆盖） |
| `title` | string | 是 | 题库标题 |
| `brief` | string | 否 | 题库简介 |
| `total` | number | 否 | 总题数（缺省时按 `questions.length`） |
| `types` | object | 否 | 题型 → 数量映射，如 `{"single": 6, "multiple": 2, "subjective": 1}` |
| `exam` | object | 否 | 模拟考试配置 |
| `exam.duration` | number | 否 | 考试时长（秒），缺省 1800 |
| `exam.count` | number | 否 | 考试抽题数，缺省为全部 |
| `questions` | array | 是 | 题目列表 |

> `types` 用于题库信息页展示，建议与题目实际分布一致。

## 题目对象字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number/string | 是 | 题号（唯一） |
| `brief` | string | 否 | 题目简短主题（展示在题号旁与记录列表） |
| `type` | string | 是 | `single`（单选）/ `multiple`（多选）/ `subjective`（主观） |
| `stem` | string | 是 | 题干（纯文本，换行会保留） |
| `media` | array | 否 | 附加题干（见下） |
| `options` | array | 否 | 选项文本（单选 / 多选必填，主观题不填） |
| `answer` | — | 是 | 正确答案（见下） |
| `explain` | string | 否 | 题解 / 解析 |

### answer 按题型约定

| 题型 | answer 类型 | 示例 | 说明 |
| --- | --- | --- | --- |
| `single` | string | `"B"` | 单个选项键（A=第 1 项，B=第 2 项…） |
| `multiple` | array | `["A", "C"]` | 选项键数组（顺序无关） |
| `subjective` | string | `"参考要点…"` | 参考答案文本 |

选项键由系统按选项顺序自动生成 `A、B、C…`，支持超过 26 个选项（`A…Z、AA、AB…`）。

### 附加题干 media

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | string | `image` / `audio` / `video` / `file` |
| `src` | string | 资源路径，**相对题库目录**（如 `assets/fig.png`），也支持绝对地址 |
| `alt` | string | 仅 image：图片说明 |
| `label` | string | 仅 file：下载链接文字 |

展示行为：`image` 自动展示在题干下方；`file` 显示下载链接；`audio` / `video` 显示播放控件。

## 完整示例

```json
{
  "version": 1,
  "id": "class-a",
  "title": "A 类操作证题库",
  "brief": "示例题库",
  "total": 3,
  "types": { "single": 1, "multiple": 1, "subjective": 1 },
  "exam": { "duration": 600, "count": 3 },
  "questions": [
    {
      "id": 1,
      "brief": "法规 · 执照有效期",
      "type": "single",
      "stem": "我国业余无线电台执照的有效期为多少年？",
      "media": [],
      "options": ["3 年", "5 年", "10 年", "长期有效"],
      "answer": "B",
      "explain": "有效期为 5 年。"
    },
    {
      "id": 2,
      "brief": "电学 · 功率",
      "type": "single",
      "stem": "下图所示模块的名称是：",
      "media": [{ "type": "image", "src": "assets/circuit.svg", "alt": "功放示意图" }],
      "options": ["功率放大器", "衰减器", "滤波器", "混频器"],
      "answer": "A",
      "explain": "图中为功率放大器（PA）。"
    },
    {
      "id": 3,
      "brief": "操作 · 干扰",
      "type": "subjective",
      "stem": "简述遇到有害干扰时的处理步骤。",
      "media": [],
      "answer": "先自查、后记录、再报告。",
      "explain": "不得继续发射或自行对抗。"
    }
  ]
}
```

## 校验要点

- JSON 必须合法，`questions` 为非空数组；
- `type` 只能为 `single / multiple / subjective`；
- 单选 / 多选必须提供 `options`，且 `answer` 的选项键必须存在于选项中；
- 主观题不提供 `options`，`answer` 为参考答案文本；
- `media[].src` 指向的文件应存在于对应题库目录下。
