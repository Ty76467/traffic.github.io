// 生成模拟数据
function generateMockData() {
    const bounds = {
        minLng: 106.3, maxLng: 107.0, // 更大范围
        minLat: 26.2, maxLat: 27.0
    };
    const data = [];
    const total = 100;
    const blueCount = Math.round(total * 0.6); // 60%蓝色
    const redCount = total - blueCount;        // 40%红色
    for (let i = 0; i < total; i++) {
        const lng = Math.random() * (bounds.maxLng - bounds.minLng) + bounds.minLng;
        const lat = Math.random() * (bounds.maxLat - bounds.minLat) + bounds.minLat;
        const status = i < blueCount ? '出游' : '居住';
        data.push({
            name: '用户' + (i + 1),
            value: [lng, lat],
            status: status
        });
    }
    // 统计百分比
    window.scatterPercent = {
        blue: blueCount,
        red: redCount,
        total: total
    };
    return data;
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
            // 生成用户数据
            var userData = generateMockData();
            // 配置项
            var option = {
                title: {
                    text: '职住分布分析图',
                    left: 'center',
                    textStyle: {
                        color: '#f3f3f3',
                        fontFamily: '宋体'
                    }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        if (params.seriesType === 'scatter' && params.data && params.data.status) {
                            return params.data.name + '<br/>状态: ' + params.data.status + '<br/>经度: ' + params.data.value[0].toFixed(6) + '<br/>纬度: ' + params.data.value[1].toFixed(6);
                        } else {
                            return params.name;
                        }
                    }
                },
                legend: {
                    data: ['出游', '居住'],
                    right: 40,
                    top: 40,
                    textStyle: { color: '#333' },
                    formatter: function(name) {
                        if (window.scatterPercent) {
                            if (name === '出游') {
                                return '出游 (' + Math.round(window.scatterPercent.blue / window.scatterPercent.total * 100) + '%)';
                            } else if (name === '居住') {
                                return '居住 (' + Math.round(window.scatterPercent.red / window.scatterPercent.total * 100) + '%)';
                            }
                        }
                        return name;
                    }
                },
                geo: {
                    map: 'guiyang',
                    roam: true,
                    label: { show: true, color: '#333', fontFamily: '宋体' },
                    itemStyle: { areaColor: '#2a333d', borderColor: '#999', borderWidth: 2 },
                    emphasis: {
                        label: { color: '#fff', fontFamily: '宋体' },
                        itemStyle: { areaColor: '#389BB7' }
                    }
                },
                series: [
                    {
                        name: '贵阳市',
                        type: 'map',
                        map: 'guiyang',
                        geoIndex: 0,
                        roam: true,
                        label: {
                            show: true,
                            color: '#333',
                            textStyle: { fontFamily: '宋体' }
                        },
                        itemStyle: {
                            areaColor: '#2a333d',
                            borderColor: '#999',
                            borderWidth: 2
                        },
                        emphasis: {
                            label: {
                                color: '#fff',
                                textStyle: { fontFamily: '宋体' }
                            },
                            itemStyle: {
                                areaColor: '#389BB7'
                            }
                        }
                    },
                    {
                        name: '用户分布',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        geoIndex: 0,
                        data: userData,
                        symbolSize: 16,
                        itemStyle: {
                            color: function(params) {
                                return params.data.status === '出游' ? '#3b5cff' : '#ff6b6b';
                            }
                        }
                    }
                ]
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