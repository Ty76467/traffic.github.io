# 智能路口监测系统

## 项目结构
```
信号灯优化大屏/
├── index.html                # 主页面
├── styles.css                # 样式文件
├── main.js                   # 前端逻辑
├── app.py                    # 后端服务
├── requirements.txt          # Python依赖
└── images/                   # 存放摄像头图片
    ├── camera1.jpg
    ├── camera2.jpg
    ├── camera3.jpg
    └── camera4.jpg
```

## 环境要求
1. Python 3.7+
2. 现代浏览器（推荐 Chrome/Edge/Firefox）

## 安装步骤

### 1. 安装Python依赖
```bash
pip install -r requirements.txt
```

### 2. 准备图片文件
确保 `images` 文件夹中包含以下图片：
- camera1.jpg
- camera2.jpg
- camera3.jpg
- camera4.jpg

## 运行方法

### 1. 启动后端服务
```bash
python app.py
```
后端服务将在 http://localhost:5000 运行

### 2. 启动前端页面
有三种方式可以运行前端：

#### 方式一：使用Python启动本地服务器
```bash
python -m http.server 8000
```
然后在浏览器访问：http://localhost:8000

#### 方式二：使用Node.js启动本地服务器
```bash
npx http-server
```
默认端口为8080，访问：http://localhost:8080

#### 方式三：使用VSCode的Live Server插件
1. 安装Live Server插件
2. 右键点击index.html
3. 选择"Open with Live Server"

## 常见问题

1. **地图无法显示**
   - 确保网络可以访问高德地图
   - 检查浏览器控制台是否有错误信息

2. **图片无法显示**
   - 检查images文件夹中的图片文件名是否正确
   - 确保图片文件存在且可访问

3. **页面空白**
   - 确保使用本地服务器运行，而不是直接打开HTML文件
   - 检查浏览器控制台是否有错误信息

4. **后端服务无法启动**
   - 检查Python版本是否符合要求
   - 确保所有依赖包都已正确安装
   - 检查5000端口是否被占用

## 部署到服务器

1. 将整个文件夹内容上传到服务器
2. 安装Python依赖
3. 使用gunicorn启动后端服务：
   ```bash
   gunicorn app:app -b 0.0.0.0:5000
   ```
4. 配置Nginx或Apache等Web服务器，将前端文件部署到静态目录
5. 配置反向代理，将API请求转发到后端服务

## 系统功能说明

1. **路口选择**
   - 顶部下拉菜单可选择不同路口
   - 地图会自动定位到选中路口

2. **实时监控**
   - 显示当前车流量
   - 显示平均车速
   - 显示异常事件数量
   - 显示信号灯状态

3. **热力图显示**
   - 地图上显示交通流量热力图
   - 颜色越深表示流量越大

4. **信号灯优化**
   - 可调整遗传算法参数
   - 显示当前配时和优化建议
   - 实时更新优化结果

## 注意事项

1. 确保服务器有足够的计算资源运行遗传算法
2. 建议定期备份数据
3. 生产环境部署时注意配置安全措施
4. 建议使用HTTPS协议保护数据传输安全 