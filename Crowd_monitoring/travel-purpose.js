// 加载地图数据
fetch('coordinates.json')
    .then(response => response.json())
    .then(data => {
        // 注册地图数据
        echarts.registerMap('guizhou', {
            geoJSON: {
                type: 'FeatureCollection',
                features: Object.entries(data).map(([name, coordinates]) => ({
                    type: 'Feature',
                    properties: { name },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates]
                    }
                }))
            }
        });

        // 初始化 ECharts 实例
        const myChart = echarts.init(document.getElementById('main'));

        // 定义出行目的的颜色映射
        const purposeColors = {
            '上班': '#5470c6',
            '购物': '#91cc75',
            '娱乐': '#fac858',
            '就医': '#ee6666',
            '上学': '#73c0de',
            '回家': '#3ba272'
        };

        // 生成模拟数据（实际项目中应该从后端获取）
        function generateMockData() {
            const data = [];
            const purposes = Object.keys(purposeColors);
            
            // 贵阳市各区县中心坐标
            const centers = {
                '南明区': [106.714374, 26.568583],
                '云岩区': [106.724426, 26.604594],
                '花溪区': [106.670791, 26.409817],
                '观山湖区': [106.622453, 26.618217],
                '白云区': [106.623007, 26.678557],
                '乌当区': [106.750625, 26.630845],
                '清镇市': [106.470278, 26.556078],
                '修文县': [106.592108, 26.838926],
                '息烽县': [106.740407, 27.090479]
            };

            // 为每个区域生成随机点
            Object.entries(centers).forEach(([area, center]) => {
                for (let i = 0; i < 50; i++) {  // 每个区域生成50个点
                    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * 0.05;  // 控制点的分布范围
                    
                    const lng = center[0] + radius * Math.cos(angle);
                    const lat = center[1] + radius * Math.sin(angle);
                    
                    data.push({
                        name: purpose,
                        value: [lng, lat, purpose],
                        itemStyle: {
                            color: purposeColors[purpose]
                        }
                    });
                }
            });
            return data;
        }

        // 配置项
        const option = {
            title: {
                text: '出行',
                left: 'center',
                top: 20
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    return `出行目的：${params.value[2]}<br>经度：${params.value[0].toFixed(4)}<br>纬度：${params.value[1].toFixed(4)}`;
                }
            },
            legend: {
                orient: 'vertical',
                right: 20,
                top: 'center',
                data: Object.keys(purposeColors),
                textStyle: {
                    color: '#333'
                }
            },
            geo: {
                map: 'guizhou',
                roam: true,
                zoom: 1.2,
                center: [106.6302, 26.6470],
                itemStyle: {
                    normal: {
                        areaColor: '#323c48',
                        borderColor: '#111'
                    },
                    emphasis: {
                        areaColor: '#2a333d'
                    }
                }
            },
            series: [{
                name: '出行目的',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: generateMockData(),
                symbolSize: 6,
                label: {
                    normal: {
                        show: false
                    }
                },
                emphasis: {
                    scale: true
                }
            }]
        };

        // 使用配置项设置图表
        myChart.setOption(option);

        // 响应窗口大小变化
        window.addEventListener('resize', function() {
            myChart.resize();
        });
    }); 

// 模拟出行目的数据
const travelPurposeData = {
    '购物': {
        color: '#FF69B4',
        data: [
            {value: [106.64, 26.64, 30], name: '南明区'},
            {value: [106.71, 26.61, 25], name: '云岩区'},
            {value: [106.66, 26.56, 35], name: '花溪区'},
            {value: [106.61, 26.60, 28], name: '观山湖区'},
            {value: [106.67, 26.67, 22], name: '白云区'}
        ]
    },
    '工作': {
        color: '#4682B4',
        data: [
            {value: [106.65, 26.65, 40], name: '南明区'},
            {value: [106.72, 26.62, 35], name: '云岩区'},
            {value: [106.67, 26.57, 30], name: '花溪区'},
            {value: [106.62, 26.61, 38], name: '观山湖区'},
            {value: [106.68, 26.68, 32], name: '白云区'}
        ]
    },
    '娱乐': {
        color: '#9370DB',
        data: [
            {value: [106.66, 26.66, 20], name: '南明区'},
            {value: [106.73, 26.63, 28], name: '云岩区'},
            {value: [106.68, 26.58, 25], name: '花溪区'},
            {value: [106.63, 26.62, 22], name: '观山湖区'},
            {value: [106.69, 26.69, 18], name: '白云区'}
        ]
    },
    '就医': {
        color: '#20B2AA',
        data: [
            {value: [106.67, 26.67, 15], name: '南明区'},
            {value: [106.74, 26.64, 18], name: '云岩区'},
            {value: [106.69, 26.59, 12], name: '花溪区'},
            {value: [106.64, 26.63, 16], name: '观山湖区'},
            {value: [106.70, 26.70, 14], name: '白云区'}
        ]
    },
    '其他': {
        color: '#FFA500',
        data: [
            {value: [106.68, 26.68, 10], name: '南明区'},
            {value: [106.75, 26.65, 12], name: '云岩区'},
            {value: [106.70, 26.60, 8], name: '花溪区'},
            {value: [106.65, 26.64, 11], name: '观山湖区'},
            {value: [106.71, 26.71, 9], name: '白云区'}
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof echarts === 'undefined') {
        console.error('ECharts加载失败');
        return;
    }

    var myChart = echarts.init(document.getElementById('map'));

    // 定义出行目的和对应的颜色
    const travelPurposes = {
        '工作': '#FF4B4B',
        '购物': '#4B96FF',
        '休闲': '#4BFF68',
        '其他': '#FFD700'
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
        const purposes = Object.keys(travelPurposes);
        
        // 为每个出行目的分配不同比例的点数
        const purposeDistribution = {
            '工作': 0.40,    // 40%
            '购物': 0.25,    // 25%
            '休闲': 0.20,    // 20%
            '其他': 0.15     // 15%
        };

        areas.forEach(area => {
            const areaData = areaCenters[area];
            
            // 为每种出行目的生成对应比例的点
            Object.entries(purposeDistribution).forEach(([purpose, ratio]) => {
                const numPoints = Math.floor(totalPoints * ratio / areas.length);
                
                for (let i = 0; i < numPoints; i++) {
                    // 使用改进的随机分布算法
                    const angle = Math.random() * 2 * Math.PI;
                    const r = Math.pow(Math.random(), 0.5) * areaData.radius;
                    
                    // 计算偏移后的坐标，增加随机性
                    const lng = areaData.center[0] + r * Math.cos(angle) + (Math.random() - 0.5) * 0.02;
                    const lat = areaData.center[1] + r * Math.sin(angle) + (Math.random() - 0.5) * 0.02;
                    
                    points.push({
                        name: purpose,
                        value: [lng, lat],
                        userId: generateUserId(),
                        area: area,
                        itemStyle: {
                            color: travelPurposes[purpose]
                        }
                    });
                }
            });
        });
        
        return points;
    }

    $.ajax({
        url: 'coordinates.json',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            try {
                var geojson = {
                    "type": "FeatureCollection",
                    "features": Object.entries(data).map(([name, coordinates]) => ({
                        "type": "Feature",
                        "properties": {
                            "name": name
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [coordinates]
                        }
                    }))
                };
                
                echarts.registerMap('guiyang', geojson);

                const points = generateRandomPoints();
                
                var option = {
                    title: {
                        text: '出行目的',
                        left: 20,
                        top: 20,
                        textStyle: {
                            color: '#333',
                            fontSize: 16,
                            fontWeight: 'normal'
                        }
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: function(params) {
                            return [
                                '用户ID: ' + params.data.userId,
                                '区域: ' + params.data.area,
                                '出行目的: ' + params.data.name
                            ].join('<br/>');
                        }
                    },
                    geo: {
                        map: 'guiyang',
                        roam: true,
                        zoom: 0.8,
                        center: [106.55, 26.75],
                        label: {
                            show: true,
                            color: '#fff',
                            fontSize: 16,
                            // 修改字体为宋体
                            fontFamily: 'SimSun',
                            // 修改字体为加粗
                            fontWeight: 'bold',
                            position: 'center',
                            formatter: function(params) {
                                return params.name;
                            }
                        },
                        itemStyle: {
                            areaColor: '#2a333d',
                            borderColor: '#404a59',
                            borderWidth: 1
                        },
                        emphasis: {
                            itemStyle: {
                                areaColor: '#2a333d'
                            },
                            label: {
                                show: true,
                                color: '#fff',
                                fontSize: 18,
                                fontWeight: 'bold',
                                // 修改字体为加粗
                                // 修改字体为宋体
                                fontFamily: 'SimSun',
                            }
                        }
                    },
                    series: [{
                        name: '出行目的',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: points,
                        symbolSize: 4,
                        itemStyle: {
                            color: function(params) {
                                return travelPurposes[params.data.name];
                            }
                        },
                        emphasis: {
                            itemStyle: {
                                borderColor: '#fff',
                                borderWidth: 1
                            }
                        }
                    }]
                };

                myChart.setOption(option);

                window.addEventListener('resize', function() {
                    myChart.resize();
                });

            } catch (error) {
                console.error('地图初始化失败:', error);
            }
        },
        error: function(xhr, status, error) {
            console.error('地图数据加载失败:', error);
        }
    });
});

function handleModuleChange() {
    const select = document.getElementById('moduleSelect');
    const selectedValue = select.value;
    if (selectedValue !== '#') {
        window.location.href = selectedValue;
    }
} 