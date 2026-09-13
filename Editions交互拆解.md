# Shopify Editions | Winter '26 交互拆解与移植说明

> 参考页面：`https://www.shopify.com/editions/winter2026`
> 拆解日期：2026-09-11
> 本文件里的**所有数值均来自该页的线上产物**（DOM + Tailwind 编译产物），不是目测估计。
> 落地位置：本站 `assets/css/editions.css` 与 `assets/js/editions.js`

---

## 一、先说方法：扒到什么程度

只抓 HTML 文本是拿不到动效的——那页是 CSR 渲染，CSS 全在外部产物里。实际做了三步：

1. 抓取页面 HTML（1.45 MB），从中定位到 Tailwind 编译产物地址
2. 下载并解析该 CSS（129 KB），提取出全部 `@keyframes` 与工具类
3. 反查 DOM，确认每个动画挂在什么元素上、配什么数值

**从产物里直接拿到的 `@keyframes` 共 14 个**：
`emoji-rise` · `fade-in` · `line-fade` · `load-lines` · `media-entrance` · `nav-item-in` · `opacityPulse` · `orbit-path` · `search-loading-rotate` · `search-loading-stroke` · `show-close-button` · `slide` · `stagger-fade-in` · `timeline-start`

下面挑出对官网真正有用的 12 条。

---

## 二、真实设计令牌（原始值）

### 配色

| 用途 | 原始值 | 出现次数 | 说明 |
|---|---|---|---|
| 主底 | `#1c004f` | 60 | 深靛蓝。**这是全页视觉主色**，不是黑 |
| 强调 | `#7126ff` | 20 | 电光紫，用在手绘 SVG 涂鸦上 |
| 纸面 | `#ffffff` / `#fcfcfd` | 21 | 明暗交替的亮色区块 |
| 次级文字 | `#cfcfd5` | 20 | 深底上的正文灰 |
| 深墨 | `#303030` | 12 | 纸白区块上的正文色 |
| 描边 | `border-white/10` | 12 | 10% 白，发丝级分隔 |

> 值得注意：它**没有用纯黑**。深靛蓝 `#1c004f` 比黑更有色彩倾向，这是它看起来"贵"的原因之一。

### 几何

| 令牌 | 原始值 | 证据 |
|---|---|---|
| 圆角 | **12px** | `rounded-12`，全站出现 24 次，卡片全用它 |
| 投影 | **`3px 6px 12px rgba(0,0,0,.13)`** | `shadow-[3px_6px_12px_rgba(0,0,0,0.13)]`，12 次 |
| 栅格间距 | `gap-10` / `gap-y-30` | 命名 token `grid-spacing-md` |

> 这个投影很关键：**x 和 y 不等距（3 和 6）**，带方向感，像纸片被斜着顶起来。换成对称投影立刻变平庸。

### 字型

| 令牌 | 原始值 | 证据 |
|---|---|---|
| 大标题行高 | **95%** | `leading-[95%]` |
| 负字距 | `-0.48px` | `tracking-[-0.48px]`，按字号换算约 `-0.03em` |
| 显示字体 | `PP Neue Montreal` | 内联 `font-family` |
| 正文字体 | `Inter Variable` | `font-inter-variable` |
| 排版裁剪 | `text-box: trim-both` | `.text-trim-both` |

> **95% 行高是它"不土"的第一原因。** 一般官网用 1.2~1.4，它压到 0.95，大标题变成一块实心色块。
> 注意：中文不能照搬——汉字是满框字身，0.95 行高在 `overflow:hidden` 容器里会切掉上下笔画。本项目中文标题取 **1.02~1.05**，英文/数字区块才用 0.95。

### 入场节奏

原始页首屏元素的 `animation-delay` 依次为 **500 / 540 / 580 / 620 / 660 ms** —— 步长严格 **40ms**。
本项目把 40ms 固化成 `--ez-stagger`，序号由 JS 自动注入 `--i`，不需要手写 delay。

---

## 三、12 个动效机制逐条拆解

### 1. 卡片 3D 翻起入场 ★ 最有价值

```css
@keyframes timeline-start {
  0%  { opacity: 0; translate: 0 75cqw; rotate: x -90deg; scale: 1.5; }
  100%{ opacity: 1; translate: 0;       rotate: x 0deg;   scale: 1; }
}
/* 调用处 */
.animate-timeline-start { animation: .75s ease-in-out forwards timeline-start; }
```

三个技术细节，缺一个都不是这个效果：

- **`translate: 0 75cqw`** —— 位移用了**容器查询单位**。父级必须设 `container-type: inline-size`，否则 `cqw` 会退化成视口宽度，位移量完全失控。
- **`rotate: x -90deg`** —— 用的是**独立变换属性**（`rotate` 而非 `transform`），绕 X 轴翻 90°，起始时卡片正对镜头成一条线，等于不可见。
- **`scale: 1.5`** —— 起始放大 1.5 倍，归位时缩小，产生"从近处冲过来"的纵深。

三者叠加 = 卡片从下方远处、侧身翻着冲上来，落定成平面。`.75s ease-in-out` 让落点有一次轻微减速。

> **移植注意**：`rotate: x` 没有 `perspective` 就是纯平面挤压，看不到立体感。父容器必须加 `perspective`（本项目用 1400px）。

**落地**：`index.html` 交付流程区块的 5 张卡片，`.ez-stage` + `.ez-drop`。

---

### 2. 媒体揭示

```css
@keyframes media-entrance { 0%{opacity:0} to{opacity:1} }
.animate-media-entrance { animation: .3s forwards media-entrance; }
```

只有透明度，`.3s`——**短得刻意**。68 处调用，全站所有视频/图片容器都套这层。

> 反常识的点：**动效不是越长越高级**。这里只有 0.3s，观众几乎意识不到有动画，只觉得"内容出现了"。
> 本项目把这条用在 `.ez-media`，并额外锁死 `aspect-ratio`（原页每个媒体容器都内联写了精确比值，如 `1920/1080`、`1016/529`、`752/740`），保证零布局抖动。

---

### 3. 导航项穿行

```css
@keyframes nav-item-in {
  0%  { opacity: 0; transform: translateY(-100%); }
  100%{ opacity: 1; transform: translateY(100%); }
}
```

从 -100% 穿到 +100%，**穿过**而不是停在 0。配合父容器的 `overflow:hidden`，形成"文字从上面滑进来、又滑出去"的穿行感。

**落地**：本项目改造成悬停效果（`.ez-swap`）——两层相同文字叠在同一个裁切格里，悬停时上下互换。由 `editions.js` 自动包装导航与页脚链接，不用手改 8 个页面。

---

### 4. 涂鸦上浮 ★ 定义气质的一条

```css
@keyframes emoji-rise {
  0%  { transform: translate(-50%) translateY(0) scale(var(--random-scale,1)); opacity: 1; }
  70% { opacity: 1; }
  100%{ transform: translate(-50%) translateY(-200px) scale(var(--random-scale,1)); opacity: 0; }
}
```

- 上浮 **200px** 后消失
- **70% 处才开始淡出** —— 不是匀速消失，前 70% 保持实心，最后 30% 快速隐去
- **`--random-scale` 是每个元素独立的随机值**，由 JS 注入

那页 DOM 里有 **232 个 `emoji` 类**。这些是随机散布的装饰贴纸，随滚动上浮。**它是整页"活泼感"的主要来源**——没有这层，页面会严肃很多。

**落地**：`.ez-doodles` 层 + JS 随机散布（位置 / 尺寸 / 缩放 / 延迟 / 时长五维随机）。本站用线描图标代替 emoji，更克制。

---

### 5. 分隔线渐显

```css
@keyframes line-fade { 0%{stroke:#ffffffbf} to{stroke:#ffffff26} }
```

- 起始 `#ffffffbf` = 75% 白
- 结束 `#ffffff26` = 15% 白

**分隔线不是静态的**：一开始亮，进入视口后**变暗**。方向是"由亮转暗"，用来把视觉焦点让给内容。

**落地**：`.ez-rule` —— 用内联 SVG `<line>`（不是 `<hr>`），因为只有 SVG 的 `stroke` 能这样插值。需配 `vector-effect="non-scaling-stroke"` 才能在任何宽度下保持 1px。

---

### 6. 线条自绘

```css
@keyframes load-lines { to { stroke-dashoffset: .2px; } }
```

`stroke-dashoffset` 归零 = 描线动画。

原页用 `.2px` 的终点（而非 0）来避免某些渲染器上最后一帧的抖动。
**本项目改用更稳的写法**：给元素加 `pathLength="1"`，然后 `stroke-dasharray:1; stroke-dashoffset:1 → 0`。这样不用去量每条路径的真实长度，任意路径都能一次写对。

**落地**：交付流程 5 张卡片里的小图表，都是描出来的。

---

### 7. 轨道粒子 ★ 最被低估的一条

```css
@keyframes orbit-path {
  0%     { offset-distance: 0%;   z-index: var(--orbital-dot-z-front); }
  57.99% { z-index: var(--orbital-dot-z-front); }
  58%    { offset-distance: 58%;  z-index: var(--orbital-dot-z-behind); }
  91.99% { z-index: var(--orbital-dot-z-behind); }
  92%    { offset-distance: 92%;  z-index: var(--orbital-dot-z-front); }
  99.99% { z-index: var(--orbital-dot-z-front); }
  100%   { offset-distance: 100%; z-index: var(--orbital-dot-z-front); }
}
```

用 `offset-distance` 让粒子沿 `offset-path` 绕行。
**精髓在 z-index 的两处翻转**：58% 和 92% 这两个位置，粒子翻到主体**背后**——因为它绕到了场景后方。

为什么是 58% 和 92% 而不是对称的 50%/100%？因为椭圆轨道上"视觉上绕到后面"的位置并不在几何中点，这两个值是调出来的。

**落地**：`.ez-orbit-dot`。本项目额外给每颗粒子随机化半径、周期、相位，避免同步转动显得机械。

> 兼容性：`offset-path` 用基本形状（`ellipse()`）需要 Chrome 116+ / Safari 17.2+ / Firefox 122+。
> 本项目用 `@supports` 包住，不支持时粒子直接不显示，不报错、不降级成乱七八糟的样子。

---

### 8. 图标遮罩系统

```html
<div style="--mask-url:url(.../global-24-menu.svg); -webkit-mask-size:contain"></div>
```

```css
.icon { background-color: currentColor; -webkit-mask-image: var(--mask-url); }
```

原页所有图标都是这个套路：**SVG 当遮罩，颜色由 `background-color: currentColor` 决定**。

三个好处：
- 图标自动跟随文字颜色，可被 CSS 过渡
- 一份 SVG 能出任意颜色，不用准备多套
- 用 `<i>` 而非 `<svg>`，DOM 更轻

**落地**：`.ez-ico` + 8 个遮罩。为了保持零外部依赖，遮罩用内联 data URI 而不是 CDN 文件。

---

### 9. 悬停箭头（`push-out-pop-in`）

原页在视频卡片的播放按钮上：`group-hover:animate-push-out-pop-in`，12 处调用。
效果是箭头从一侧推出屏幕、从另一侧弹回原位。

**落地**：`.ez-cta` 的动作按钮 + `.ez-slash-go` 的"用这个开始"。

---

### 10. 明暗区块交替 ★ 决定"设计感"的版式决策

那页在**深靛蓝 `#1c004f` 与纸白 `#fcfcfd` 之间反复切换**，并用 `#303030` 做纸面正文色。

这是它和大多数"暗色科技风官网"最大的差别。**通篇一个底色 = 视觉疲劳 + 廉价感**；明暗交替才能制造"翻页"的节奏。

**落地**：`index.html` 的交付流程区块整块切成纸白（`.ez-paper-sec`），卡在深色底中间。纸面上还叠了一层极淡的靛蓝网格，避免大块纯白显得空。

---

### 11. 之字形栅格 ★ 最标志性的版式

```html
<div class="lg:grid lg:grid-cols-5">
  <div class="md:col-span-5 md:even:col-start-7">…</div>
</div>
```

关键在 **`md:even:col-start-7` + `md:col-span-5`，在 12 列栅格里出现 137 次**：

- 奇数卡：占第 **1–5** 列
- 偶数卡：占第 **7–11** 列
- 第 6 列、第 12 列**永远留空**

结果是一列始终存在的空白带，和一条"左—右—左—右"的对角阅读路径。比对称的卡片网格有意思得多，而且**空白本身成了设计元素**。

**落地**：`.ez-zig` —— 纯 CSS 实现，两行搞定：

```css
.ez-zig > *                  { grid-column: 1 / span 5; }
.ez-zig > *:nth-child(even)  { grid-column: 7 / span 5; }
```

860px 以下自动全部归为单列。

---

### 12. 章节索引

原页每章末尾都有 `Back to navigation` —— 反推它有一套常驻的章节索引。
全页 12 个章节：`Sidekick / Agentic / Online / Retail / Marketing / Checkout / Operations / Shop app / B2B / Finance / Shipping / Developer`。

**落地**：`.ez-chapters` —— 右侧竖向的章节轨道，滚动时自动高亮当前位置，悬停才展开文字标签。
由 `data-chapter` 属性驱动，`editions.js` 自动收集生成，加章节只要写属性。

---

## 四、还有两个"没写进 CSS 但值得知道"的

**① View Transitions**
原页头部内联了 `style="view-transition-name:navigation"`，配合跨文档 View Transitions API 做页面跳转转场。本项目用 `@view-transition { navigation: auto }` 复刻，头部带 `view-transition-name: navigation` 所以跨页时不会重新入场。

**② 用 Rive 做交互插画**
原页多个容器带 `data-component-name="rive-container"`，插画是 [Rive](https://rive.app) 实时矢量动画，不是视频也不是 GIF。
本项目**没有采用**——Rive 要引入运行时（约 60KB+）和一个设计工具链，对中小企业官网性价比不高。需要用 CSS/SVG 能达到 80% 的效果就够了。

---

## 五、我改了什么、为什么

| 改动 | 参考页原始值 | 本站采用 | 理由 |
|---|---|---|---|
| 卡片入场时长 | 0.75s | **0.75s** | 原样 |
| 入场错峰 | 40ms | **40ms** | 原样 |
| 圆角 | 12px | **12px** | 原样 |
| 硬投影 | `3px 6px 12px rgba(0,0,0,.13)` | **原样** | 这个不等距投影是质感核心 |
| 媒体揭示 | 0.3s | **0.3s** | 原样 |
| 涂鸦上浮 | 200px | **200px** | 原样 |
| 分隔线 | `#ffffffbf → #ffffff26` | **原样** | 原样 |
| 大标题行高 | 0.95 | **1.02~1.05（中文）** | **汉字是满框字身，0.95 会在 `overflow:hidden` 里切掉笔画** |
| 主底 | `#1c004f` | 保留本站深色 `#06070b` | 品牌延续性优先；但**吸收了明暗交替的做法** |
| 强调色 | `#7126ff` | 保留本站紫蓝渐变 | 同上 |
| 字体 | PP Neue Montreal（商用） | 系统字体栈 | 商用字体授权；且本站坚持零外部依赖 |
| Rive 插画 | 有 | 不采用 | 运行时体积换不来等值收益 |

**唯一一处明确偏离是行高。** 其他都是原样照搬数值。

---

## 六、诚实说明：哪些没抄

1. **Rive 实时矢量插画** —— 未采用，成本和收益不匹配
2. **搜索功能**（`search-loading-rotate` / `search-loading-stroke` 属于站内搜索的状态动画）—— 企业官网不需要
3. **12 个章节的量级** —— 本站 8 个章节。原页是产品发布综述，信息密度天然更高
4. **视频 Hero** —— 本站用 Canvas 粒子 + CSS 绘制，坚持零外部依赖。若你后续想上视频，每章开一个全宽视频 Hero 是完全可行的扩展

---

## 七、怎么删掉这一层

`editions.css` 与 `editions.js` 是**完全可剥离的**：

1. 删除两个文件
2. 删掉 8 个 HTML 里的 `<link ... editions.css>`、保险丝 `<script>`、`<script src="assets/js/editions.js">`
3. `index.html` 的交付流程区块需要改回普通 markup（`.ez-paper-sec` / `.ez-zig` / `.ez-card` 这些类名只存在于这一层）
4. 需求预设区块（`#presets`）依赖 `editions.js` 的跳转逻辑，可一并删除或保留为纯展示

**其余所有页面会自动回到原始外观** —— 因为 `style.css` 一行未改。

---

## 八、给开发的两条注意

**① 父容器必须有 `container-type: inline-size`**
否则 `.ez-drop` 的 `75cqw` 会以视口为基准，位移量会大到离谱。这是移植这条动画最容易踩的坑。

**② 隐藏初态挂在 `.ez-js` 上，不是直接写 `opacity: 0`**
所以 HTML 里有一段保险丝脚本：如果 `editions.js` 加载失败，2.4 秒后自动摘掉 `.ez-js`，正文照常显示。
**如果你要改这段包装逻辑，请保留保险丝**——否则脚本一旦 404，整页内容会永远不可见。
