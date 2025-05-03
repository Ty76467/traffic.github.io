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

    // 检查jQuery是否已加载
    if (typeof $ === 'undefined') {
        console.error('jQuery未加载');
        document.getElementById('error').innerHTML = 'jQuery加载失败，请刷新页面重试';
        return;
    }
    console.log('jQuery已加载');

    // 获取地图容器
    var mapContainer = document.getElementById('map');
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
    var myChart = echarts.init(mapContainer);
    console.log('ECharts实例已初始化');

    // 加载贵阳市地图数据
    $.ajax({
        url: 'coordinates.json',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            console.log('成功加载地图数据');
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
                
                console.log('开始注册地图');
                // 注册地图
                echarts.registerMap('guiyang', geojson);
                console.log('地图注册成功');
                
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
                            }
                        }
                        // 迁徙线和迁徙点 series 已被注释或删除
                    ]
                };
                
                console.log('开始设置地图配置');
                // 使用配置项显示地图
                myChart.setOption(option);
                console.log('地图配置设置完成');
                
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
                console.error('地图初始化失败:', error);
                document.getElementById('error').innerHTML = '地图初始化失败: ' + error.message;
            }
        },
        error: function(xhr, status, error) {
            console.error('地图数据加载失败:', error);
            document.getElementById('error').innerHTML = '地图数据加载失败，请检查网络连接或刷新页面';
        }
    });
}); 