// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查ECharts是否已加载
    if (typeof echarts === 'undefined') {
        document.getElementById('error').innerHTML = 'ECharts加载失败，请刷新页面重试';
        throw new Error('ECharts未加载');
    }

    // 检查jQuery是否已加载
    if (typeof $ === 'undefined') {
        document.getElementById('error').innerHTML = 'jQuery加载失败，请刷新页面重试';
        throw new Error('jQuery未加载');
    }

    // 获取地图容器
    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        document.getElementById('error').innerHTML = '找不到地图容器元素';
        throw new Error('找不到地图容器元素');
    }

    // 初始化ECharts实例
    var myChart = echarts.init(mapContainer);

    // 加载贵阳市地图数据
    $.ajax({
        url: 'static/js/coordinates.json',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            try {
                // 将数据转换为GeoJSON格式
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
                
                // 注册地图
                echarts.registerMap('guiyang', geojson);
                

                // 配置项
                var option = {
                    title: {
                        text: '贵阳市地图',
                        left: 'center',
                        textStyle:{
                            color: '#f3f3f3',
                            fontFamily:'宋体'
                        }
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}'
                    },
                    series: [
                        {
                            name: '贵阳市',
                            type: 'map',
                            map: 'guiyang',
                            roam: true,
                            label: {
                                show: true,
                                color: '#333',
                                textStyle: {
                                    fontFamily: '宋体'
                                }
                            },
                            itemStyle: {
                                areaColor: '#f3f3f3',
                                borderColor: '#999',
                                borderWidth: 2
                            },
                            emphasis: {
                                label: {
                                    color: '#fff',
                                    textStyle: {
                                    fontFamily: '宋体'
                                    }
                                },
                                itemStyle: {
                                    areaColor: '#389BB7'
                                }
                            },
                            select: {
                                itemStyle: {
                                    areaColor: '#389BB7',
                                    shadowBlur: 20,
                                    shadowColor: '#000',
                                    shadowOffsetX: 0,
                                    shadowOffsetY: 0
                                }
                            },//阴影突出效果
                            selectedMode:'single'
                        }
                    ]
                };
                
                // 使用配置项显示地图
                myChart.setOption(option);
                //自动选中区域
                const targetArea = '开阳县';
                const targetIndex = geojson.features.findIndex(f => f.properties.name === targetArea);
                
                if(targetIndex !== -1) {
                    myChart.dispatchAction({
                        type: 'select',
                        seriesIndex: 0,
                        dataIndex: targetIndex
                    });
                }

                // 监听窗口大小变化
                window.addEventListener('resize', function() {
                    myChart.resize();
                });
                // 监听地图点击事件
                myChart.on('click', function (params) {
                    // 取消之前选中的区域
                    myChart.dispatchAction({
                        type: 'unselect',
                        seriesIndex: 0,
                        dataIndex: params.dataIndex
                    });
                    // 选中当前点击的区域
                    myChart.dispatchAction({
                        type: 'select',
                        seriesIndex: 0,
                        dataIndex: params.dataIndex
                    });
                });
            } catch (error) {
                document.getElementById('error').innerHTML = '地图初始化失败: ' + error.message;
                console.error('地图初始化失败:', error);
            }
        },
        error: function(xhr, status, error) {
            document.getElementById('error').innerHTML = '地图数据加载失败，请检查网络连接或刷新页面';
            console.error('地图数据加载失败:', error);
        }
    });
}); 