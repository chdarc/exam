# 总目录格式（banks/catalog.json）

总目录是门户首页的唯一数据来源，负责封面与题库列表展示。为保持首页**单次请求、加载轻量**，题库的 `count` 直接写在目录里（展示用）；题库本身的权威信息（总题数、题型分布、题目）以 `info.json` 为准。

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `version` | number | 是 | 格式版本，当前为 `1` |
| `cover` | object | 是 | 首页封面 |
| `cover.title` | string | 是 | 封面主标题 |
| `cover.subtitle` | string | 否 | 封面副标题 |
| `cover.background` | string | 否 | 封面背景图，相对站点根（如 `assets/cover.svg`） |
| `lists` | array | 是 | 目录分类列表 |
| `lists[].id` | string | 否 | 分类标识 |
| `lists[].title` | string | 是 | 分类标题 |
| `lists[].banks` | array | 是 | 该分类下的题库 |
| `banks[].id` | string | 是 | 题库 id，需与 `banks/<id>/info.json` 对应 |
| `banks[].title` | string | 是 | 题库标题 |
| `banks[].brief` | string | 否 | 一句话简介 |
| `banks[].count` | number | 否 | 展示用题数（建议与 info.json 的 total 保持一致） |

## 示例

```json
{
  "version": 1,
  "cover": {
    "title": "业余无线电刷题",
    "subtitle": "A / B 类操作证 · 刷题 · 模拟考试 · 错题本",
    "background": "assets/cover.svg"
  },
  "lists": [
    {
      "id": "license",
      "title": "操作证考试",
      "banks": [
        { "id": "class-a", "title": "A 类操作证", "brief": "入门级题库", "count": 9 },
        { "id": "class-b", "title": "B 类操作证", "brief": "进阶级题库", "count": 5 }
      ]
    }
  ]
}
```

## 校验要点

- `version` 必须为 `1`；
- `cover.title`、`lists` 非空；
- 每个 `banks[].id` 必须存在对应目录 `banks/<id>/info.json`，否则题库信息页会提示加载失败。
