# 城市交通出行方式可视化分析系统

## 项目简介
本项目基于 ECharts 实现城市交通出行方式、职住分布、实时人群密度等多维度可视化分析。支持多页面切换，地图交互丰富，适合交通大数据可视化展示与分析。

## 目录结构
```
├── index.html              # 首页
├── travel-mode.html        # 出行方式分析页面
├── work-live.html          # 职住分布分析页面
├── density.html            # 实时人群密度页面
├── travel-purpose.html     # 出行目的分析页面
├── *.js                    # 各页面对应的 JS 脚本
├── coordinates.json        # 地图区域坐标数据
├── requirements.txt        # Python 依赖（如有后端）
├── README.md               # 项目说明文档
└── ...                     # 其它资源文件
```

## 依赖库
### 前端依赖
- [ECharts](https://echarts.apache.org/)（地图与可视化，已通过 CDN 引入）
- [jQuery](https://jquery.com/)（部分页面用到，已通过 CDN 引入）

### 后端依赖（如需运行 Python 数据接口）
- Python 3.7+
- Flask（如有接口服务）
- 其它依赖见 `requirements.txt`

## 运行环境
- 推荐使用 **Chrome/Edge/Firefox** 等现代浏览器
- 本地运行无需 Node.js，仅需浏览器即可查看静态页面
- 若需后端数据接口，需安装 Python 3.7+，并运行相关 Flask 服务

## 启动方式
### 仅前端静态页面
1. 直接用浏览器打开 `index.html`、`travel-mode.html` 等页面即可体验全部功能。
2. 若页面涉及本地数据（如 `coordinates.json`），建议用本地服务器（如 VSCode Live Server、Python SimpleHTTPServer）打开，避免跨域问题。

### 启动本地服务器（可选）
- 用 Python 启动本地 HTTP 服务（在项目根目录下）：
  ```bash
  # Python 3
  python -m http.server 8000
  ```
  然后在浏览器访问 `http://localhost:8000/index.html`。

### 启动后端接口（如有）
1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
2. 启动 Flask 服务（如有 `app.py` 或相关后端脚本）：
   ```bash
   python app.py
   ```

## 页面说明
- **index.html**：项目首页，展示贵阳市基础地图。
- **travel-mode.html**：出行方式分析，地图上以不同颜色散点展示用户出行方式及分布，支持图例和百分比。
- **work-live.html**：职住分布分析，地图上以散点区分"出游"与"居住"状态。
- **density.html**：实时人群密度分析，地图区域分级着色，悬停显示具体密度。
- **travel-purpose.html**：出行目的分析页面。

## 常见问题
- **地图或数据加载失败？**
  - 请确保 `coordinates.json` 文件存在且路径正确。
  - 建议用本地服务器方式打开页面，避免浏览器跨域限制。
- **ECharts 加载失败？**
  - 检查网络，或切换至科学上网环境。
- **页面样式错乱？**
  - 建议使用最新版 Chrome/Edge/Firefox 浏览器。

## 联系方式
如有问题或建议，请联系项目负责人或提交 issue。 