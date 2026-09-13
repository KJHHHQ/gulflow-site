# 湾流智能 GULFLOW —— 企业官网静态站

一套零依赖、零外部请求的企业官网静态页面。暗色科技风 + 电光渐变，
全部效果由原生 HTML / CSS / JS 实现，**断网、双击 index.html 也能满血运行**。

## 一、文件结构

```
gulflow-site/
├── index.html        首页（Hero 粒子 / 能力矩阵 / 纸白交付流程 / 案例 / 需求预设 / 数据 / 技术栈 / 评价 / CTA）
├── services.html     技术服务（7 条产线详情 / 3 种合作模式 / 交付保障 / FAQ）
├── cases.html        客户案例（6 个案例 / 行业筛选 / 成果数据）
├── edu-ai.html       教育 AI 底座（五层架构全景 / 核心能力 / 教育数据模型 / 技术底座 / CTA）
├── news.html         新闻动态（头条 + 6 篇文章 / 分类筛选）
├── news-detail.html  文章详情（正文排版体系 / 上一篇下一篇）
├── about.html        关于我们（概况 / 价值观 / 发展历程 / 团队 / 资质 / 招聘）
├── contact.html      联系我们（需求表单 / 联系方式 / 地图占位）
├── 404.html          404 页（已设 noindex，Nginx 配 error_page 404 /404.html;）
├── robots.txt        爬虫规则（需替换域名）
├── sitemap.xml       站点地图（需替换域名）
├── Editions交互拆解.md  Shopify Editions Winter '26 交互机制的逐条拆解（含原始数值）
└── assets/
    ├── css/style.css    设计系统 + 全部基础样式
    ├── css/editions.css Editions 交互层（可整层删除）
    ├── js/main.js       基础交互脚本
    └── js/editions.js   Editions 交互行为（可整层删除）
```

> favicon 已使用图片 logo（`assets/img/logo.png`，PNG 128px）；
> 换 favicon：直接替换 `assets/img/logo.png` 即可，全站页头与标签图标同步生效。

## 一·五、Editions 交互层（2026-09 新增）

参考 **Shopify Editions | Winter '26** 移植的一层交互系统，详见 `Editions交互拆解.md`。
关键点：

- **完全可剥离**：`editions.css` + `editions.js` 两个文件 + 各页 3 行引用。
  删掉即回到原版外观 —— `style.css` 一行未改。
- **防白屏保险丝**：各页 `<head>` 里有一段内联脚本，若 `editions.js` 加载失败，
  2.4 秒后自动摘掉 `.ez-js`，正文不会因为「等待入场」的隐藏初态而不可见。
  **改包装逻辑时请保留这段保险丝。**
- **已移植的机制**（原始数值照搬）：卡片 3D 翻起入场（`translate:0 75cqw + rotate:x -90deg + scale:1.5`，.75s）、
  40ms 入场错峰、媒体揭示 .3s、涂鸦上浮 200px（`--random-scale` 随机）、
  SVG 发丝线由亮转暗、线条自绘、轨道粒子（58%/92% 处翻转层级）、图标遮罩（`--mask-url` + currentColor）、
  12px 圆角 + 硬投影 `3px 6px 12px rgba(0,0,0,.13)`、明暗区块交替、12 列宽呼吸带栅格、View Transitions 页面转场。
- **唯一有意偏离**：大标题行高用 1.02~1.05 而非原版 0.95 —— 汉字是满框字身，
  0.95 行高在 `overflow:hidden` 容器里会切掉笔画。
- **新增的获客入口**：首页「需求预设」区块（`/制造业ERP` 等 8 条），
  点击后跳转 `contact.html?preset=...` 并自动填入需求描述与需求类型 ——
  这是把参考页里装饰性的 slash 命令列表改写成了真实可用的转化路径。

## 二、本地预览

方式一（最简单）：直接双击 `index.html`。

方式二（推荐，路径行为与线上一致）：

```bash
# 在 gulflow-site 目录下执行
python -m http.server 8123
# 浏览器打开 http://127.0.0.1:8123
```

## 三、待替换文案清单

| 位置 | 当前占位 | 需替换成 |
|------|---------|---------|
| ~~所有页面 `<title>` / `<meta description>`~~ | ✅ 已替换为「湾流智能 GULFLOW」 | 业务描述可按实际微调 |
| ~~页头 / 页脚品牌名~~ | ✅ 已替换为「湾流智能 · Gulflow Tech」 | 英文名如不同请全局替换 `Gulflow` |
| 页头右侧电话 | 400-800-0000 | 真实客服电话（同时改 `tel:` 链接） |
| 页脚邮箱 | hello@gulflow.example | 真实邮箱 |
| 页脚地址 | XX省XX市XX区科技大道 88 号 | 真实办公地址 |
| 页脚备案号 | XXICP备00000000号-1 | 真实 ICP 备案号（国内服务器必填） |
| 首页主标语 | 「一支把代码写成商业结果的研发团队」 | 可保留或换成自己的 slogan |
| 首页数据 | 320+ / 680+ / 6 周 / 98.6% 等 | 真实经营数据（首页、cases、about 三处都要改） |
| 资质徽章 | 高新技术企业 / CMMI3 / ISO27001 | 真实持有的资质，没有的删掉 |
| 案例卡片 | 6 个脱敏改写的行业案例 | 真实案例（注意客户保密义务） |
| 新闻动态 | 1 篇头条 + 6 篇文章（虚构） | 真实动态与复盘文章 |
| 评价卡片 | 3 条客户评价 | 真实客户授权评价 |
| 团队成员 | 陈工 / 周经理 / 林工 / 苏工 | 真实姓名与履历 |
| 招聘岗位 | 4 个岗位与薪资区间 | 真实在招岗位 |
| 技术栈网格 | Java / Go / K8s 等 12 项 | 团队实际使用的技术栈 |

> 所有占位处均带 `TODO 替换` 注释，全局搜索 `TODO` 可一次定位。

## 四、改配色 / 改品牌

打开 `assets/css/style.css` 顶部「00 设计令牌」，只改变量即可全站生效：

```css
--brand:  #d3af37;   /* 主色：鎏金 */
--brand-3:#f7e8bf;   /* 点缀色：香槟金 */
--hot:    #ff6b4a;   /* 强调色：暖橙 */
--bg:     #080705;   /* 页面底色：黑钛台面 */
```

换 Logo：湾流智能芯片标已接入（`assets/img/logo.png`，透明底 128px / 29KB）；
更新 Logo：用新图覆盖该文件即可（建议 128×128 PNG 透明底，正方形）。

页脚超大字 `GULFLOW`：搜索 `footer-word` 修改文字内容。

## 五、表单接入（三选一，均不需要后端）

当前表单为**纯前端演示**，不会真的发送数据。正式上线任选其一：

1. **腾讯问卷 / 金数据**：做一个同样的表单，把 `contact.html` 里的表单区换成服务商提供的嵌入代码。
2. **Formspree / Getform**（免费额度够用）：
   ```html
   <form action="https://formspree.io/f/你的ID" method="POST">
   ```
   并删除 `main.js` 中「12. 表单校验」里的 `e.preventDefault()` 演示逻辑。
3. **企微 / 飞书机器人 Webhook**：需要一层云函数中转，适合已有企业内部协作习惯的团队。

## 六、地图接入（contact.html）

页面上的地图是样式化占位块。接入高德地图只需替换 `.map-box` 内部为：

```html
<iframe src="https://uri.amap.com/marker?position=经度,纬度&name=公司名"
        style="width:100%;height:320px;border:0;border-radius:26px"></iframe>
```

> 注意：国内合规要求使用高德 / 百度 / 腾讯等国内地图服务商坐标系（GCJ-02），不要直接嵌入海外地图服务。

## 七、部署

### 方案 A：Vercel / Netlify（免费，5 分钟上线，适合快速验证）

```bash
# Vercel（需 npm）
npm i -g vercel
cd gulflow-site
vercel --prod
```

Netlify：打开 https://app.netlify.com/drop ，把 `gulflow-site` 文件夹拖进去即可。

### 方案 B：国内服务器 + 宝塔（需 ICP 备案）

1. 域名完成 ICP 备案后解析到服务器 IP。
2. 宝塔面板 → 网站 → 添加站点（纯静态）。
3. 把 `gulflow-site` 内全部文件上传到站点根目录（如 `/www/wwwroot/xxx.com`）。
4. 宝塔 → 网站 → SSL → 申请 Let's Encrypt 证书并开启强制 HTTPS。
5. 404 页面：宝塔 → 网站 → 配置文件，加入 `error_page 404 /404.html;`。

### 方案 C：Nginx 手工配置

```nginx
server {
    listen 80;
    server_name xxx.com;
    root /www/wwwroot/xxx.com;
    index index.html;
    location / { try_files $uri $uri/ =404; }
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
    expires 7d;
}
```

## 八、性能与兼容说明

- 无任何外部依赖（无 CDN、无字体请求、无图片），首屏 Lighthouse 评分天然占优。
- 全站图片位用 CSS 渐变绘制，替换真实图片时建议：案例封面 1200×800、团队照 400×400。
- 已适配移动端（断点 1180 / 1024 / 768px），并支持 `prefers-reduced-motion` 降级。
- 建议浏览器：Chrome / Edge / Safari / Firefox 最新版；不支持 IE。
