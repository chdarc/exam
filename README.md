# 刷题网站（examapp）

一个纯静态、无构建、无框架依赖的刷题 Web 应用，面向业余电台操作证书考试（A / B / C 类）等题库的练习、模拟考试、错题与收藏管理。

## 功能特性

- **门户首页**：封面（标题 / 副标题 / 下滑动画）+ 题库目录（分类列表，每项含标题、简介、题数）。
- **题库信息页**：题库简介、题型数量、作答进度（作对 / 错题 / 总共）、四种刷题入口卡片（顺序 / 乱序 / 模拟考试 / 错题·收藏）。
- **刷题页**：
  - 顶栏：左侧退出、中间题库标题、右侧倒计时（仅考试模式）；
  - 题目信息（题号、简介）与收藏按钮；
  - 上一题 / 跳转指定题号 / 下一题；
  - 题干 + 题型 chip + 附加题干（图片自动展示、文件下载、音频 / 视频播放）；
  - 单选（圆形选项键，点击即作答）、多选（方形选项键 + 确定键）、主观（文本框 + 自评）。
- **记录页**：收藏 / 错题两个 Tab，可跳转到对应题目或直接开始练习。
- **作答记录本地保存**：答对消除错题、收藏独立记录，长期保存在浏览器。

## 技术选型

- 纯 HTML + CSS + 原生 JavaScript（ES5 风格，兼容性更好），无第三方库、无构建步骤。
- 页面、脚本、样式均使用**相对路径**，通过 `config.js` 自动探测站点根路径，可部署在任意子目录（如 `https://xxx.cn/exam/`）。
- 本地存储使用 **localStorage**（而非 cookie）：cookie 单条约 4KB 且每次请求都会发送；localStorage 容量更大、仅存本地、长期有效，更适合保存题量较大的作答记录。

## 目录结构

```
examapp/
├── favicon.ico                  # 站点图标（由 tools/gen_binary.py 生成）
├── index.html                   # 门户首页
├── bank.html                    # 题库信息页
├── practice.html                # 刷题页
├── records.html                 # 收藏 / 错题记录页
├── assets/
│   ├── favicon.svg
│   ├── cover.svg                # 门户封面背景
│   ├── style/
│   │   ├── base.css             # 设计变量、重置
│   │   ├── components.css       # 复用组件
│   │   └── pages.css            # 页面布局
│   └── script/
│       ├── config.js            # 路径基准 + URL 工具
│       ├── store.js             # 存储读取层
│       ├── data.js              # 数据读取层（题库加载）
│       ├── records.js           # 业务：作答记录 / 收藏
│       ├── session.js           # 业务：会话构建与判题
│       └── ui/
│           ├── common.js        # 共享渲染 / 工具
│           ├── home.js          # 门户
│           ├── bank.js          # 题库信息页
│           ├── practice.js      # 刷题页
│           └── records.js       # 记录页
├── banks/                       # 题库文件夹
│   ├── catalog.json             # 总目录（门户展示来源）
│   ├── images/                  # 各题库共享的题目图片
│   ├── a/                       # A 类题库（info.json）
│   ├── b/                       # B 类题库（info.json）
│   ├── c/                       # C 类题库（info.json）
│   └── all/                     # 总题库（全量题目 info.json）
└── docs/                        # 文档（格式与接口定义）
```

## 快速开始

由于使用 `fetch` 加载 JSON，请通过静态服务器访问（直接用 `file://` 打开会因浏览器安全策略无法加载题库）。

```bash
# 在 examapp 目录下任选其一
python -m http.server 8080
# 或
npx serve .
```

然后访问 `http://localhost:8080/`。

## 部署

把整个 `examapp/` 目录上传到任意静态站点即可。支持子目录部署：例如上传到服务器 `/var/www/html/exam/`，访问 `https://xxx.cn/exam/` 即可，无需修改任何配置。

## 添加题库

1. 在 `banks/` 下新建目录（如 `banks/my-bank/`），放入 `info.json` 与 `assets/` 资源。
2. 在 `banks/catalog.json` 的 `lists` 中登记该题库。
3. 字段格式见 [docs/question-bank-format.md](docs/question-bank-format.md) 与 [docs/catalog-format.md](docs/catalog-format.md)。

## 从 jsonl 批量导入

现有题库由 `题库/*.jsonl`（A 类 / B 类 / C 类 / 题库）经 `tools/convert_banks.py` 转换生成：J/P/I 合并为题目信息 `brief`，Q 为题干，T 单字母→单选、多字母→多选，F 非空时作为题目图片（图片统一放在 `banks/images/`，题目内以 `../images/<F>` 引用）。更新源 jsonl 后重跑该脚本即可重新生成。

## 模拟考试配置

各题库 `info.json` 顶层可配置 `exam`：`duration` 为考试时长（秒），`count` 为抽题数（缺省为全部题目）。如需模拟真实考试题量，请设置 `count`。

## 文档索引

- [docs/architecture.md](docs/architecture.md) —— 分层架构与数据流
- [docs/interfaces.md](docs/interfaces.md) —— 前端模块接口定义
- [docs/catalog-format.md](docs/catalog-format.md) —— 总目录格式
- [docs/question-bank-format.md](docs/question-bank-format.md) —— 题库文件格式
