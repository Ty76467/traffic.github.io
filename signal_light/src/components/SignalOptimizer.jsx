import React, { useState } from 'react';
import { Card, Slider, Button, Row, Col } from 'antd';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SignalOptimizer = () => {
  const [optimizationParams, setOptimizationParams] = useState({
    populationSize: 100,
    iterations: 50
  });

  // 柱状图配置
  const getBarOption = () => ({
    title: {
      text: '信号配时对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['当前时长', '优化建议'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['红灯', '绿灯']
    },
    yAxis: {
      type: 'value',
      name: '时长(秒)'
    },
    series: [
      {
        name: '当前时长',
        type: 'bar',
        data: [120, 60]
      },
      {
        name: '优化建议',
        type: 'bar',
        data: [98, 72]
      }
    ]
  });

  // 趋势图配置
  const getLineOption = () => ({
    title: {
      text: '24小时通行效率趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '06:00', '12:00', '18:00', '24:00']
    },
    yAxis: {
      type: 'value',
      name: '通行效率(%)'
    },
    series: [{
      data: [82, 85, 78, 75, 89],
      type: 'line',
      smooth: true
    }]
  });

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <StyledCard title="优化参数设置">
            <div style={{ marginBottom: 20 }}>
              <div>种群规模</div>
              <Slider
                min={50}
                max={200}
                value={optimizationParams.populationSize}
                onChange={value => setOptimizationParams(prev => ({
                  ...prev,
                  populationSize: value
                }))}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div>迭代次数</div>
              <Slider
                min={10}
                max={100}
                value={optimizationParams.iterations}
                onChange={value => setOptimizationParams(prev => ({
                  ...prev,
                  iterations: value
                }))}
              />
            </div>
            <Button type="primary" block>
              开始优化
            </Button>
          </StyledCard>
        </Col>
        <Col span={12}>
          <StyledCard title="优化效果">
            <ReactECharts option={getBarOption()} style={{ height: 300 }} />
          </StyledCard>
        </Col>
      </Row>
      <StyledCard>
        <ReactECharts option={getLineOption()} style={{ height: 300 }} />
      </StyledCard>
    </div>
  );
};

export default SignalOptimizer; 