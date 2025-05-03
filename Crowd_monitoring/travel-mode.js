document.addEventListener('DOMContentLoaded', function() {
    if (typeof echarts === 'undefined') {
        console.error('ECharts加载失败');
        return;
    }

    // 初始化ECharts实例
    const mapChart = echarts.init(document.getElementById('map'));
    const pieChart = echarts.init(document.getElementById('pie-chart'));

    // 定义出行方式和对应的蓝色系颜色
    const travelModes = {
        '私家车': '#1C4587',   // 深蓝色
        '公交车': '#6D9EEB',   // 中蓝色
        '步行': '#A4C2F4',    // 浅蓝色
        '共享单车': '#C9DAF8'  // 最浅蓝色
    };

    // 定义各区域的中心点和范围
    const areaCenters = {
        '南明区': { center: [106.614374, 26.668583], radius: 0.4 },
        '云岩区': { center: [106.624426, 26.704594], radius: 0.4 },
        '花溪区': { center: [106.570791, 26.509817], radius: 0.4 },
        '观山湖区': { center: [106.522453, 26.718217], radius: 0.4 },
        '白云区': { center: [106.523007, 26.778557], radius: 0.4 },
        '乌当区': { center: [106.650625, 26.730845], radius: 0.4 }
    };

    // 生成随机用户ID
    function generateUserId() {
        return 'USER_' + Math.random().toString(36).substr(2, 9);
    }

    // 生成随机分布的点
    function generateRandomPoints() {
        const points = [];
        const totalPoints = 2000;
        const areas = Object.keys(areaCenters);
        const modes = Object.keys(travelModes);
        
        // 为每个出行方式分配不同比例的点数
        const modeDistribution = {
            '私家车': 0.35,    // 35%
            '公交车': 0.30,    // 30%
            '步行': 0.20,     // 20%
            '共享单车': 0.15   // 15%
        };

        areas.forEach(area => {
            const areaData = areaCenters[area];
            
            // 为每种出行方式生成对应比例的点
            Object.entries(modeDistribution).forEach(([mode, ratio]) => {
                const numPoints = Math.floor(totalPoints * ratio / areas.length);
                
                for (let i = 0; i < numPoints; i++) {
                    // 使用改进的随机分布算法
                    const angle = Math.random() * 2 * Math.PI;
                    const r = Math.pow(Math.random(), 0.5) * areaData.radius;
                    
                    // 计算偏移后的坐标，增加随机性
                    const lng = areaData.center[0] + r * Math.cos(angle) + (Math.random() - 0.5) * 0.02;
                    const lat = areaData.center[1] + r * Math.sin(angle) + (Math.random() - 0.5) * 0.02;
                    
                    points.push({
                        name: mode,
                        value: [lng, lat],
                        userId: generateUserId(),
                        area: area,
                        itemStyle: {
                            color: travelModes[mode]
                        }
                    });
                }
            });
        });
        
        return points;
    }

    // 加载地图数据
    fetch('coordinates.json')
        .then(response => response.json())
        .then(mapData => {
            // 注册地图
            echarts.registerMap('guizhou', mapData);
            
            // 获取出行方式分析数据
            fetch('http://localhost:5003/api/travel_mode_analysis')
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    // 处理出行方式数据
                    const travelModes = data.travel_modes;
                    const modeStats = data.statistics;
                    
                    // 配置饼图选项
                    const pieOption = {
                        title: {
                            text: '出行方式分布',
                            left: 'center'
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: '{b}: {c} ({d}%)'
                        },
                        legend: {
                            orient: 'vertical',
                            left: 'left'
                        },
                        series: [{
                            type: 'pie',
                            radius: '50%',
                            data: [
                                { value: modeStats.car.count, name: '私家车' },
                                { value: modeStats.bus.count, name: '公交车' },
                                { value: modeStats.subway.count, name: '地铁' },
                                { value: modeStats.walking.count, name: '步行' }
                            ],
                            emphasis: {
                                itemStyle: {
                                    shadowBlur: 10,
                                    shadowOffsetX: 0,
                                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                                }
                            }
                        }]
                    };
                    
                    // 配置地图选项
                    const mapOption = {
                        title: {
                            text: '出行轨迹分析',
                            left: 'center'
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: function(params) {
                                if (params.seriesType === 'lines') {
                                    return `用户ID: ${params.data.user_id}<br/>
                                            出行方式: ${getModeName(params.data.mode)}<br/>
                                            平均速度: ${params.data.avg_speed.toFixed(1)} km/h`;
                                }
                                return params.name;
                            }
                        },
                        series: [
                            {
                                name: '出行轨迹',
                                type: 'lines',
                                coordinateSystem: 'geo',
                                data: travelModes.map(mode => ({
                                    coords: mode.points.map(p => [p.longitude, p.latitude]),
                                    user_id: mode.user_id,
                                    mode: mode.mode,
                                    avg_speed: mode.avg_speed,
                                    lineStyle: {
                                        color: getModeColor(mode.mode),
                                        width: 2
                                    }
                                })),
                                progressiveThreshold: 500,
                                progressive: 200
                            }
                        ],
                        geo: {
                            map: 'guizhou',
                            roam: true,
                            label: {
                                show: true
                            },
                            itemStyle: {
                                areaColor: '#323c48',
                                borderColor: '#111'
                            }
                        }
                    };
                    
                    // 设置图表选项
                    pieChart.setOption(pieOption);
                    mapChart.setOption(mapOption);
                })
                .catch(error => {
                    console.error('获取数据失败:', error);
                    document.getElementById('error-message').textContent = '获取数据失败: ' + error.message;
                });
        })
        .catch(error => {
            console.error('加载地图数据失败:', error);
            document.getElementById('error-message').textContent = '加载地图数据失败: ' + error.message;
        });
    
    // 获取出行方式名称
    function getModeName(mode) {
        const modeNames = {
            'car': '私家车',
            'bus': '公交车',
            'subway': '地铁',
            'walking': '步行'
        };
        return modeNames[mode] || mode;
    }
    
    // 获取出行方式颜色
    function getModeColor(mode) {
        const modeColors = {
            'car': '#FF4500',  // 红色
            'bus': '#4169E1',  // 蓝色
            'subway': '#32CD32',  // 绿色
            'walking': '#FFD700'  // 金色
        };
        return modeColors[mode] || '#000000';
    }
    
    // 窗口大小改变时重绘图表
    window.addEventListener('resize', function() {
        mapChart.resize();
        pieChart.resize();
    });
});

function handleModuleChange() {
    const select = document.getElementById('moduleSelect');
    const selectedValue = select.value;
    if (selectedValue !== '#') {
        window.location.href = selectedValue;
    }
}

// 等待DOM加载完成
// 复制index.html的静态地图渲染逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        document.getElementById('error').innerHTML = 'ECharts加载失败，请刷新页面重试';
        return;
    }

    // 获取地图容器
    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        document.getElementById('error').innerHTML = '找不到地图容器元素';
        return;
    }

    // 设置地图容器的高度
    mapContainer.style.height = '600px';
    mapContainer.style.width = '100%';

    // 初始化ECharts实例
    var myChart = echarts.init(mapContainer);

    // 生成用户散点数据
    var userPoints = generateUserPoints();

    // 加载贵阳市地图数据
    fetch('coordinates.json')
        .then(response => response.json())
        .then(data => {
            // 转换为GeoJSON格式
            var geojson = {
                type: 'FeatureCollection',
                features: Object.entries(data).map(([name, coordinates]) => ({
                    type: 'Feature',
                    properties: { name },
                    geometry: { type: 'Polygon', coordinates: [coordinates] }
                }))
            };
            // 注册地图
            echarts.registerMap('guiyang', geojson);
            // 配置项
            var option = {
                title: {
                    text: '出行方式分析',
                    left: 'center',
                    textStyle: {
                        color: '#333',
                        fontFamily: '宋体'
                    }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        if (params.seriesType === 'scatter' && params.data && params.data.mode) {
                            return params.data.name + '<br/>出行方式: ' + params.data.mode + '<br/>经度: ' + params.data.value[0].toFixed(6) + '<br/>纬度: ' + params.data.value[1].toFixed(6);
                        } else {
                            return params.name;
                        }
                    }
                },
                legend: {
                    data: ['私家车', '公交车', '步行', '共享单车'],
                    right: 40,
                    top: 40,
                    textStyle: { color: '#333' },
                    formatter: function(name) {
                        if (window.travelModeLegend) {
                            const count = window.travelModeLegend.legendPercent[name] || 0;
                            const percent = Math.round(count / window.travelModeLegend.total * 100);
                            return name + ' (' + percent + '%)';
                        }
                        return name;
                    }
                },
                series: [
                    {
                        name: '用户出行方式',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: userPoints,
                        symbolSize: 5,
                        itemStyle: {
                            color: function(params) {
                                return params.data.itemStyle.color;
                            }
                        }
                    }
                ],
                geo: {
                    map: 'guiyang',
                    roam: true,
                    label: { show: true, color: '#333', fontFamily: '宋体' },
                    itemStyle: { areaColor: '#f3f3f3', borderColor: '#999', borderWidth: 2 },
                    emphasis: { itemStyle: { areaColor: '#389BB7' } }
                }
            };
            myChart.setOption(option);
            window.addEventListener('resize', function() {
                myChart.resize();
            });
        })
        .catch(error => {
            document.getElementById('error').innerHTML = '地图数据加载失败: ' + error.message;
        });
});

// 生成用户散点数据
function generateUserPoints() {
    const bounds = {
        minLng: 106.06, maxLng: 107.14,
        minLat: 26.06, maxLat: 27.14
    };
    const total = 800;
    const modeList = [
        { mode: '私家车', color: '#1C4587', percent: 0.35 },
        { mode: '公交车', color: '#6D9EEB', percent: 0.30 },
        { mode: '步行', color: '#A4C2F4', percent: 0.20 },
        { mode: '共享单车', color: '#C9DAF8', percent: 0.15 }
    ];
    let data = [];
    let legendPercent = {};
    let idx = 1;
    modeList.forEach(item => {
        const count = Math.round(total * item.percent);
        legendPercent[item.mode] = count;
        for (let i = 0; i < count; i++) {
            const lng = Math.random() * (bounds.maxLng - bounds.minLng) + bounds.minLng;
            const lat = Math.random() * (bounds.maxLat - bounds.minLat) + bounds.minLat;
            data.push({
                name: '用户' + (idx++),
                value: [lng, lat],
                mode: item.mode,
                itemStyle: { color: item.color }
            });
        }
    });
    // 统计百分比
    window.travelModeLegend = {
        total,
        legendPercent
    };
    return data;
} 