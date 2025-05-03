// Vue实例
new Vue({
    el: '#app',
    data: {
        currentFlow: 1200,
        averageSpeed: 32,
        abnormalEvents: 2,
        currentSignal: 'red',
        countdown: 120,
        currentAlert: '警告：东向入口检测到车辆碰撞事件',
        populationSize: 100,
        iterations: 50,
        efficiency: 82,
        map: null,
        phaseChart: null,
        trendChart: null,
        currentPhase: {
            red: 120,
            green: 60
        },
        optimizedPhase: {
            red: 98,
            green: 72
        },
        historicalData: [],
        selectedIntersection: 'intersection1',
        intersectionCoordinates: {
            'intersection1': [106.713478, 26.578343], // 花果园中央商务区
            'intersection2': [106.633079, 26.647661], // 观山湖区行政中心
            'intersection3': [106.632768, 26.686464], // 贵阳北站
            'intersection4': [106.709180, 26.573588], // 云岩区中华路
            'intersection5': [106.714358, 26.568092]  // 南明区市西
        }
    },
    mounted() {
        // 确保OpenLayers加载完成
        if (typeof ol === 'undefined') {
            console.error('OpenLayers未正确加载');
            return;
        }
        
        try {
            this.initMap();
            this.initPhaseChart();
            this.initTrendChart();
            this.startSignalCycle();
            this.startAlertCycle();
            this.updateMetrics();
            this.startDataCollection();
        } catch (error) {
            console.error('初始化失败:', error);
        }
    },
    methods: {
        initMap() {
            try {
                // 初始化OpenLayers地图，使用高德地图图层
                const initialCoordinates = this.intersectionCoordinates[this.selectedIntersection];
                this.map = new ol.Map({
                    target: 'map',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.XYZ({
                                url: 'https://webst0{1-4}.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}',
                                crossOrigin: 'anonymous'
                            })
                        })
                    ],
                    view: new ol.View({
                        center: ol.proj.fromLonLat(initialCoordinates),
                        zoom: 17,
                        projection: 'EPSG:3857'
                    })
                });

                // 添加热力图层
                const vectorSource = new ol.source.Vector({
                    features: this.generateHeatmapData()
                });

                const heatmapLayer = new ol.layer.Heatmap({
                    source: vectorSource,
                    blur: 15,
                    radius: 10,
                    opacity: 0.8
                });

                this.map.addLayer(heatmapLayer);
            } catch (error) {
                console.error('地图初始化失败:', error);
            }
        },

        generateHeatmapData() {
            // 生成模拟的交通流量热力数据
            const coordinates = this.intersectionCoordinates[this.selectedIntersection];
            const features = [];
            for (let i = 0; i < 100; i++) {
                const point = [
                    coordinates[0] + (Math.random() - 0.5) * 0.002,
                    coordinates[1] + (Math.random() - 0.5) * 0.002
                ];
                const feature = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat(point))
                });
                feature.set('weight', Math.random());
                features.push(feature);
            }
            return features;
        },

        initPhaseChart() {
            this.phaseChart = echarts.init(document.getElementById('phaseChart'));
            const option = {
                title: {
                    text: '信号配时对比',
                    textStyle: {
                        color: '#fff',
                        fontSize: 14
                    }
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                legend: {
                    data: ['当前配时', '优化建议'],
                    textStyle: {
                        color: '#fff'
                    },
                    top: 25
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['红灯', '绿灯'],
                    axisLabel: {
                        color: '#fff'
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        color: '#fff'
                    }
                },
                series: [
                    {
                        name: '当前配时',
                        type: 'bar',
                        data: [this.currentPhase.red, this.currentPhase.green],
                        itemStyle: {
                            color: '#ea4335'
                        }
                    },
                    {
                        name: '优化建议',
                        type: 'bar',
                        data: [this.optimizedPhase.red, this.optimizedPhase.green],
                        itemStyle: {
                            color: '#34a853'
                        }
                    }
                ]
            };
            this.phaseChart.setOption(option);
        },

        initTrendChart() {
            this.trendChart = echarts.init(document.getElementById('trendChart'));
            const option = {
                title: {
                    text: '24小时周期优化趋势',
                    textStyle: {
                        color: '#fff',
                        fontSize: 14
                    }
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['当前红灯', '建议红灯', '当前绿灯', '建议绿灯'],
                    textStyle: {
                        color: '#fff'
                    },
                    top: 25
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: Array.from({length: 24}, (_, i) => `${i}:00`),
                    axisLabel: {
                        color: '#fff'
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        color: '#fff'
                    }
                },
                series: [
                    {
                        name: '当前红灯',
                        type: 'line',
                        data: Array(24).fill(120),
                        itemStyle: {
                            color: '#ea4335'
                        }
                    },
                    {
                        name: '建议红灯',
                        type: 'line',
                        data: Array(24).fill(98),
                        itemStyle: {
                            color: '#fbbc05'
                        }
                    },
                    {
                        name: '当前绿灯',
                        type: 'line',
                        data: Array(24).fill(60),
                        itemStyle: {
                            color: '#34a853'
                        }
                    },
                    {
                        name: '建议绿灯',
                        type: 'line',
                        data: Array(24).fill(72),
                        itemStyle: {
                            color: '#1a73e8'
                        }
                    }
                ]
            };
            this.trendChart.setOption(option);
        },

        startSignalCycle() {
            // 模拟信号灯周期变化
            const cycle = () => {
                if (this.currentSignal === 'red') {
                    this.currentSignal = 'green';
                    this.countdown = 60;
                } else if (this.currentSignal === 'green') {
                    this.currentSignal = 'yellow';
                    this.countdown = 5;
                } else {
                    this.currentSignal = 'red';
                    this.countdown = 120;
                }
            };

            setInterval(() => {
                this.countdown--;
                if (this.countdown <= 0) {
                    cycle();
                }
            }, 1000);
        },

        startAlertCycle() {
            // 模拟异常事件告警
            const alerts = [
                '警告：东向入口检测到车辆碰撞事件',
                '提示：南向出口发现车辆抛锚',
                '警告：西向人行道检测到行人闯红灯'
            ];
            let index = 0;
            setInterval(() => {
                this.currentAlert = alerts[index];
                index = (index + 1) % alerts.length;
            }, 5000);
        },

        updateMetrics() {
            // 模拟实时数据更新
            setInterval(() => {
                this.currentFlow = 1200 + Math.floor(Math.random() * 200 - 100);
                this.averageSpeed = 32 + Math.floor(Math.random() * 6 - 3);
                this.abnormalEvents = Math.floor(Math.random() * 3);
                this.efficiency = 82 + Math.floor(Math.random() * 4);
            }, 3000);
        },

        updateOptimization() {
            // 模拟优化计算
            this.optimizedPhase.red = Math.max(90, 120 - Math.floor(this.populationSize / 10));
            this.optimizedPhase.green = Math.min(80, 60 + Math.floor(this.iterations / 5));
            
            // 更新图表
            this.updateCharts();
        },

        updateCharts() {
            if (this.phaseChart) {
                this.phaseChart.setOption({
                    series: [
                        {
                            data: [this.currentPhase.red, this.currentPhase.green]
                        },
                        {
                            data: [this.optimizedPhase.red, this.optimizedPhase.green]
                        }
                    ]
                });
            }
        },

        startDataCollection() {
            // 模拟24小时数据收集
            setInterval(() => {
                const hour = new Date().getHours();
                const randomFactor = Math.random() * 10 - 5;
                
                if (this.trendChart) {
                    const series = this.trendChart.getOption().series;
                    series[1].data[hour] = this.optimizedPhase.red + randomFactor;
                    series[3].data[hour] = this.optimizedPhase.green + randomFactor;
                    
                    this.trendChart.setOption({
                        series: series
                    });
                }
            }, 3000);
        },

        handleIntersectionChange() {
            const intersectionId = this.selectedIntersection;
            const intersection = this.intersectionCoordinates[intersectionId];
            
            // 更新地图中心
            this.map.getView().setCenter(ol.proj.fromLonLat(intersection));
            
            // 获取路口实时数据
            fetch(`http://localhost:5000/api/traffic/${intersectionId}`)
                .then(response => response.json())
                .then(data => {
                    // 更新热力图数据
                    const heatmapData = this.generateHeatmapData(data.lanes);
                    const vectorSource = new ol.source.Vector({
                        features: heatmapData
                    });
                    const heatmapLayer = new ol.layer.Heatmap({
                        source: vectorSource,
                        blur: 15,
                        radius: 10,
                        opacity: 0.8
                    });
                    this.map.addLayer(heatmapLayer);
                    
                    // 更新指标面板
                    this.updateMetrics(data.lanes);
                })
                .catch(error => console.error('Error fetching traffic data:', error));
        },

        updateMetrics(lanes) {
            // 计算总流量
            const totalFlow = Object.values(lanes).reduce((sum, lane) => sum + lane.flow, 0);
            document.getElementById('current-traffic').textContent = totalFlow;
            
            // 计算平均速度（模拟）
            const avgSpeed = Math.round(30 + Math.random() * 20);
            document.getElementById('avg-speed').textContent = avgSpeed;
            
            // 计算异常事件（模拟）
            const abnormalEvents = Math.round(Math.random() * 5);
            document.getElementById('abnormal-events').textContent = abnormalEvents;
            
            // 更新信号灯状态
            const signalStatus = abnormalEvents > 2 ? '异常' : '正常';
            document.getElementById('signal-status').textContent = signalStatus;
        },

        runOptimization() {
            const intersectionId = this.selectedIntersection;
            const populationSize = this.populationSize;
            const iterations = this.iterations;
            
            // 调用优化API
            fetch(`http://localhost:5000/api/optimize/${intersectionId}?population_size=${populationSize}&iterations=${iterations}`)
                .then(response => response.json())
                .then(data => {
                    // 更新建议配时
                    document.getElementById('suggested-phase').textContent = 
                        `北: ${data.optimal_times.north}s, 南: ${data.optimal_times.south}s, 东: ${data.optimal_times.east}s, 西: ${data.optimal_times.west}s`;
                    
                    // 更新当前配时（模拟）
                    this.currentPhase.red = data.optimal_times.north;
                    this.currentPhase.green = data.optimal_times.south;
                    this.updateCharts();
                })
                .catch(error => console.error('Error running optimization:', error));
        }
    }
}); 