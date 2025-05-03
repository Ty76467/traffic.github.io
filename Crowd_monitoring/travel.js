// 模拟迁徙数据
const mockMigrationData = {
    '南明区': [
        { to: '云岩区', value: 3500 },
        { to: '观山湖区', value: 2800 },
        { to: '花溪区', value: 2000 },
        { to: '白云区', value: 1500 },
        { to: '乌当区', value: 1200 }
    ],
    '云岩区': [
        { to: '观山湖区', value: 4200 },
        { to: '白云区', value: 2500 },
        { to: '南明区', value: 3000 },
        { to: '乌当区', value: 1800 },
        { to: '花溪区', value: 1600 }
    ],
    '花溪区': [
        { to: '南明区', value: 2200 },
        { to: '乌当区', value: 1800 },
        { to: '清镇市', value: 1500 },
        { to: '修文县', value: 900 },
        { to: '云岩区', value: 1400 }
    ],
    '观山湖区': [
        { to: '白云区', value: 2600 },
        { to: '云岩区', value: 3800 },
        { to: '清镇市', value: 2000 },
        { to: '修文县', value: 1200 },
        { to: '南明区', value: 2100 }
    ],
    '白云区': [
        { to: '乌当区', value: 1500 },
        { to: '观山湖区', value: 2300 },
        { to: '云岩区', value: 2100 },
        { to: '南明区', value: 1800 },
        { to: '息烽县', value: 800 }
    ],
    '乌当区': [
        { to: '南明区', value: 1600 },
        { to: '云岩区', value: 2000 },
        { to: '白云区', value: 1400 },
        { to: '息烽县', value: 1000 },
        { to: '开阳县', value: 800 }
    ],
    '清镇市': [
        { to: '观山湖区', value: 2200 },
        { to: '花溪区', value: 1800 },
        { to: '修文县', value: 1500 },
        { to: '南明区', value: 1200 },
        { to: '云岩区', value: 1100 }
    ],
    '修文县': [
        { to: '观山湖区', value: 1600 },
        { to: '清镇市', value: 1400 },
        { to: '花溪区', value: 900 },
        { to: '白云区', value: 800 },
        { to: '南明区', value: 700 }
    ],
    '息烽县': [
        { to: '乌当区', value: 1200 },
        { to: '白云区', value: 1000 },
        { to: '开阳县', value: 800 },
        { to: '云岩区', value: 900 },
        { to: '南明区', value: 700 }
    ],
    '开阳县': [
        { to: '乌当区', value: 1100 },
        { to: '息烽县', value: 900 },
        { to: '云岩区', value: 800 },
        { to: '南明区', value: 700 },
        { to: '白云区', value: 600 }
    ]
};

// 区域中心点坐标（经纬度）
const geoCoordMap = {
    '南明区': [106.714374, 26.568583],
    '云岩区': [106.724426, 26.604594],
    '花溪区': [106.670791, 26.409817],
    '观山湖区': [106.622453, 26.618217],
    '白云区': [106.623007, 26.678557],
    '乌当区': [106.750625, 26.630845],
    '清镇市': [106.470278, 26.556078],
    '修文县': [106.592108, 26.838926],
    '息烽县': [106.740407, 27.090479],
    '开阳县': [106.965089, 27.057764]
};

// 生成迁徙线数据
function convertData(data) {
    const res = [];
    for (let fromCity in data) {
        const fromCoord = geoCoordMap[fromCity];
        data[fromCity].forEach(item => {
            const toCoord = geoCoordMap[item.to];
            if (fromCoord && toCoord) {
                res.push({
                    fromName: fromCity,
                    toName: item.to,
                    coords: [fromCoord, toCoord],
                    value: item.value
                });
            }
        });
    }
    return res;
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载完成');
    
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        console.error('ECharts未加载');
        document.getElementById('error').innerHTML = 'ECharts加载失败，请刷新页面重试';
        return;
    }
    console.log('ECharts已加载');

    // 获取地图容器
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('找不到地图容器元素');
        document.getElementById('error').innerHTML = '找不到地图容器元素';
        return;
    }
    console.log('找到地图容器元素');

    // 设置地图容器的高度
    mapContainer.style.height = '600px';
    mapContainer.style.width = '100%';

    // 初始化ECharts实例
    const chart = echarts.init(mapContainer);
    console.log('ECharts实例已初始化');
    
    // 加载地图数据
    fetch('coordinates.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('地图数据加载失败');
            }
            return response.json();
        })
        .then(mapData => {
            console.log('成功加载地图数据');
            
            // 将数据转换为GeoJSON格式
            const geojson = {
                type: 'FeatureCollection',
                features: Object.entries(mapData).map(([name, coordinates]) => ({
                    type: 'Feature',
                    properties: {
                        name: name
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    }
                }))
            };
            
            // 注册地图
            echarts.registerMap('guiyang', geojson);
            console.log('地图注册成功');
            
            // 使用模拟数据
            const mockStayPoints = [
                { longitude: 106.630153, latitude: 26.647661, points: [1,2,3,4,5], start_time: 0, end_time: 3600 },
                { longitude: 106.712251, latitude: 26.578363, points: [1,2,3], start_time: 0, end_time: 1800 },
                { longitude: 106.675972, latitude: 26.615238, points: [1,2,3,4], start_time: 0, end_time: 2700 }
            ];
            
            const heatmapData = mockStayPoints.map(point => ({
                        value: [point.longitude, point.latitude, point.points.length],
                cluster: 1
                    }));
                    
                    // 配置图表选项
                    const option = {
                        title: {
                    text: '出行驻留分析图',
                    left: 'center',
                    textStyle: {
                        color: '#f3f3f3',
                        fontFamily: '宋体'
                    }
                        },
                        tooltip: {
                            trigger: 'item',
                            formatter: function(params) {
                        if (params.seriesType === 'effectScatter') {
                            return params.name + '<br/>坐标: ' + params.value;
                        } else if (params.seriesType === 'lines') {
                            return params.data.fromName + ' → ' + params.data.toName + '<br/>人数: ' + params.data.value;
                        } else if (params.seriesName === '驻留点') {
                            const point = mockStayPoints[params.dataIndex];
                            return `驻留点 ${params.dataIndex + 1}<br/>经度: ${point.longitude.toFixed(6)}<br/>纬度: ${point.latitude.toFixed(6)}<br/>驻留时长: ${((point.end_time - point.start_time) / 3600).toFixed(1)}小时<br/>数据点数量: ${point.points.length}`;
                        } else {
                            return params.name;
                        }
                    }
                },
                geo: {
                    map: 'guiyang',
                    roam: true,
                    label: {
                        show: true,
                        color: '#333',
                        fontFamily: '宋体'
                    },
                    itemStyle: {
                        areaColor: '#2a333d',
                        borderColor: '#999',
                        borderWidth: 2
                    },
                    emphasis: {
                        label: {
                            color: '#fff',
                            fontFamily: '宋体'
                        },
                        itemStyle: {
                            areaColor: '#389BB7'
                        }
                    }
                },
                series: [
                    {
                        name: '迁徙线路',
                        type: 'lines',
                        coordinateSystem: 'geo',
                        zlevel: 2,
                        effect: {
                            show: true,
                            period: 4,
                            trailLength: 0.2,
                            color: '#fff',
                            symbolSize: 4
                        },
                        lineStyle: {
                            color: '#3399ff',
                            width: 2,
                            opacity: 0.6,
                            curveness: 0.2
                        },
                        data: convertData(mockMigrationData)
                    },
                    {
                        name: '迁徙点',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        zlevel: 3,
                        rippleEffect: {
                            brushType: 'stroke'
                        },
                        label: {
                            show: true,
                            position: 'right',
                            formatter: '{b}'
                        },
                        symbolSize: 8,
                        itemStyle: {
                            color: '#46bee9'
                        },
                        data: Object.keys(geoCoordMap).map(name => ({
                            name,
                            value: geoCoordMap[name]
                        }))
                    },
                    {
                        name: '驻留点',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        zlevel: 4,
                        symbolSize: 10,
                        itemStyle: {
                            color: '#eac736',
                            shadowBlur: 10,
                            shadowColor: '#333'
                        },
                        data: mockStayPoints.map(point => ({
                            name: '驻留点',
                            value: [point.longitude, point.latitude]
                        }))
                    }
                ]
            };
            
            console.log('开始设置地图配置');
                    chart.setOption(option);
            console.log('地图配置设置完成');
            
            // 监听窗口大小变化
            window.addEventListener('resize', function() {
                chart.resize();
                });
        })
        .catch(error => {
            console.error('加载地图数据失败:', error);
            const errorElement = document.getElementById('error');
            if (errorElement) {
                errorElement.innerHTML = '加载地图数据失败: ' + error.message;
            }
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