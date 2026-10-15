# 刷题网站（exam）

一个纯静态、无构建、无框架依赖的刷题 Web 应用，面向业余电台操作证书考试（A / B / C 类）等题库的练习、模拟考试、错题与收藏管理。

## 功能特性

- **门户首页**：封面（标题 / 副标题 / 下滑动画）+ 题库目录（两屏吸附滚动，下滑即吸附到列表顶端）。
- **题库信息页**：题库简介、题型数量、模拟考试信息、作答进度（作对 / 错题 / 总共）、四种刷题入口卡片（顺序 / 乱序 / 模拟考试 / 错题·收藏）。
- **刷题页**：
  - 顶栏显示“已答 / 总数”并在标题栏下显示进度条；
  - 选择题选项在所有模式下随机乱序；
  - 单选答对后自动进入下一题；
  - 移动端支持左右滑动切换题目；
  - 题干 + 题型 chip + 附加题干（图片自动展示、文件下载、音频 / 视频播放）；
  - 单选（圆形选项键，点击即作答）、多选（方形选项键 + 确定键）、主观（文本框 + 自评）。
- **模拟考试**：按 `info.json` 的 `exam` 配置抽题（题型分布 / 时长 / 及格线），倒计时交卷后评分并判定及格。
- **记录页**：收藏 / 错题两个独立 Tab；每个 Tab 可“开始练习”或“清除记录”（仅清当前 Tab）；从刷题返回时自动刷新列表并保持所看的 Tab。
- **昼夜主题**：默认跟随浏览器，右下角按钮在“跟随系统 / 浅色 / 深色”间切换。
- **作答记录本地保存**：答对消除错题、收藏独立记录，长期保存在浏览器。

## 技术选型

- 纯 HTML + CSS + 原生 JavaScript（ES5 风格，兼容性更好），无第三方库、无构建步骤。
- 页面、脚本、样式均使用**相对路径**，通过 `config.js` 自动探测站点根路径，可部署在任意子目录（如 `https://xxx.cn/exam/`）。
- 本地存储使用 **localStorage**（而非 cookie）：cookie 单条约 4KB 且每次请求都会发送；localStorage 容量更大、仅存本地、长期有效，更适合保存题量较大的作答记录。

## 目录结构

```text
exam/
├── favicon.ico                  # 站点图标（由 tools/gen_binary.py 生成）
├── index.html                   # 门户首页（封面文案写在此 HTML 中）
├── bank.html                    # 题库信息页
├── practice.html                # 刷题页
├── records.html                 # 收藏 / 错题记录页
├── assets/
│   ├── favicon.svg
│   ├── cover.svg                # 门户封面背景（路径在 pages.css 中）
│   ├── style/
│   │   ├── base.css             # 设计变量（浅/深主题）、重置
│   │   ├── components.css       # 复用组件
│   │   └── pages.css            # 页面布局
│   └── script/
│       ├── config.js            # 路径基准 + URL 工具
│       ├── site.js              # 站点文案配置（界面文字集中处）
│       ├── store.js             # 存储读取层
│       ├── data.js              # 数据读取层（题库加载）
│       ├── records.js           # 业务：作答记录 / 收藏
│       ├── session.js           # 业务：会话构建与判题
│       ├── theme.js             # 昼夜主题切换
│       └── ui/
│           ├── common.js        # 共享渲染 / 工具 / 确认弹窗
│           ├── home.js          # 门户
│           ├── bank.js          # 题库信息页
│           ├── practice.js      # 刷题页
│           └── records.js       # 记录页
├── banks/                       # 题库文件夹
│   ├── catalog.json             # 总目录（题库列表展示来源）
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
# 在 exam 目录下任选其一
python -m http.server 8080
# 或
npx serve .
```

然后访问 `http://localhost:8080/`。

## 部署

把整个 `exam/` 目录上传到任意静态站点即可。支持子目录部署：例如上传到服务器 `/var/www/html/exam/`，访问 `https://xxx.cn/exam/` 即可，无需修改任何配置。

## 更换站点内容

文案与数据分离，改用途时只需动三类文件：

1. **品牌文案**（封面标题 / 副标题 / 徽标、页脚、各页 `<title>`）——直接编辑对应 HTML。
2. **界面文案**（刷题模式卡片、空状态、考试提示等）——集中在 `assets/script/site.js` 的 `App.site`。
3. **题库数据**（题库标题 / 简介 / 题数 / 题目 / 考试配置）——在 `banks/catalog.json` 与 `banks/<id>/info.json`。

## 添加题库

1. 在 `banks/` 下新建目录（如 `banks/my-bank/`），放入 `info.json`。
2. 在 `banks/catalog.json` 的 `lists` 中登记该题库。
3. 字段格式见 [docs/question-bank-format.md](docs/question-bank-format.md) 与 [docs/catalog-format.md](docs/catalog-format.md)。

## 从 jsonl 批量导入

现有题库由 `bank/*.jsonl`（A 类 / B 类 / C 类 / 题库）经 `tools/convert_banks.py` 转换生成：J/P/I 合并为题目信息 `brief`，Q 为题干，T 单字母→单选、多字母→多选，F 非空时作为题目图片（图片统一放在 `banks/images/`，题目内以 `../images/<F>` 引用）。更新源 jsonl 后重跑该脚本即可重新生成。

## 模拟考试配置

各题库 `info.json` 顶层 `exam` 可配置：

```json
"exam": {
  "duration": 2400,
  "count": 40,
  "distribution": { "single": 32, "multiple": 8 },
  "pass": 30
}
```

- `duration` 考试时长（秒）；`count` 抽题总数；`distribution` 题型分布（按题型各抽对应题数，缺省则按 `count` 随机抽）；`pass` 及格线（答对题数）。
- 依据 2025 年版考核标准：A 类 40 题（32 单选 + 8 多选，40 分钟，及格 30）；B 类 60 题（45 单选 + 15 多选，60 分钟，及格 45）；C 类 90 题（70 单选 + 20 多选，90 分钟，及格 70）。总题库（all）无正式考试，默认抽全部题、60 分钟，可自行修改。

## 文档索引

- [docs/architecture.md](docs/architecture.md) —— 分层架构与数据流
- [docs/interfaces.md](docs/interfaces.md) —— 前端模块接口定义
- [docs/catalog-format.md](docs/catalog-format.md) —— 总目录格式
- [docs/question-bank-format.md](docs/question-bank-format.md) —— 题库文件格式
