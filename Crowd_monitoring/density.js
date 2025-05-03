// 模拟人群密度数据
const densityData = [
    { name: '南明区', value: 8500 },
    { name: '云岩区', value: 9200 },
    { name: '花溪区', value: 6800 },
    { name: '观山湖区', value: 7500 },
    { name: '白云区', value: 5500 },
    { name: '乌当区', value: 4800 },
    { name: '清镇市', value: 3500 },
    { name: '修文县', value: 2800 },
    { name: '息烽县', value: 2200 },
    { name: '开阳县', value: 2000 }
];

// 等待DOM加载完成
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
            // 配置项
            var option = {
                title: {
                    text: '人群密度分析图',
                    left: 'center',
                    textStyle: {
                        color: '#333',
                        fontFamily: '宋体'
                    }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        return params.name + '<br/>人群密度: ' + params.value;
                    }
                },
                visualMap: {
                    min: 2000,
                    max: 9500,
                    left: 'right',
                    top: 'center',
                    text: ['高', '低'],
                    inRange: {
                        color: ['#e0ffff', '#00bfff', '#ffec8b', '#ff7f50', '#ff4500']
                    },
                    calculable: true,
                    textStyle: {
                        color: '#333'
                    }
                },
                series: [
                    {
                        name: '人群密度',
                        type: 'map',
                        map: 'guiyang',
                        roam: true,
                        data: densityData,
                        label: {
                            show: true,
                            color: '#333',
                            textStyle: { fontFamily: '宋体' }
                        },
                        itemStyle: {
                            areaColor: '#f3f3f3',
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

// 模块切换处理函数
function handleModuleChange() {
    const select = document.getElementById('moduleSelect');
    const selectedValue = select.value;
    if (selectedValue !== '#') {
        window.location.href = selectedValue;
    }
} 