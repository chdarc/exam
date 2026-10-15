# 总目录格式（banks/catalog.json）

总目录是门户首页“题库列表”的数据来源。封面文案（标题 / 副标题 / 徽标）与页脚已直接写在 `index.html` 中，不在此文件里，便于修改。题库的 `count` 直接写在目录里（展示用）；题库本身的权威信息（总题数、题型分布、题目、考试配置）以 `banks/<id>/info.json` 为准。

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `version` | number | 是 | 格式版本，当前为 `1` |
| `lists` | array | 是 | 目录分类列表 |
| `lists[].id` | string | 否 | 分类标识 |
| `lists[].title` | string | 是 | 分类标题 |
| `lists[].banks` | array | 是 | 该分类下的题库 |
| `banks[].id` | string | 是 | 题库 id，需与 `banks/<id>/info.json` 对应 |
| `banks[].title` | string | 是 | 题库标题 |
| `banks[].brief` | string | 否 | 一句话简介 |
| `banks[].count` | number | 否 | 展示用题数（建议与 info.json 的 total 保持一致） |
| `banks[].badge` | string | 否 | 题库卡片左上角字母徽标（缺省时取 id 首字母大写） |

## 示例

```json
{
  "version": 1,
  "lists": [
    {
      "id": "license",
      "title": "操作证考试",
      "banks": [
        { "id": "a", "title": "A 类操作证", "brief": "入门级题库", "count": 683 },
        { "id": "b", "title": "B 类操作证", "brief": "进阶级题库", "count": 1143 }
      ]
    }
  ]
}
```

## 校验要点

- `version` 必须为 `1`；
- `lists` 非空；
- 每个 `banks[].id` 必须存在对应目录 `banks/<id>/info.json`，否则题库信息页会提示加载失败。
