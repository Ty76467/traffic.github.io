import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { CarOutlined, WarningOutlined, DashboardOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SignalIndicator = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 10px auto;
  transition: all 0.3s;
  background-color: ${props => props.color};
  box-shadow: 0 0 20px ${props => props.color};
  opacity: ${props => props.active ? 1 : 0.3};
`;

const Dashboard = () => {
  const [currentData, setCurrentData] = useState({
    flow: 1200,
    speed: 32,
    incidents: 2,
    signalPhase: 'red' // red, yellow, green
  });

  // 模拟信号灯相位变化
  useEffect(() => {
    const phases = ['red', 'green', 'yellow'];
    const timer = setInterval(() => {
      setCurrentData(prev => ({
        ...prev,
        signalPhase: phases[(phases.indexOf(prev.signalPhase) + 1) % 3]
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <StyledCard>
            <Statistic 
              title="当前流量" 
              value={currentData.flow}
              suffix="辆/h"
              prefix={<CarOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <Statistic 
              title="平均车速" 
              value={currentData.speed}
              suffix="km/h"
              prefix={<DashboardOutlined />}
            />
          </StyledCard>
        </Col>
        <Col span={8}>
          <StyledCard>
            <Statistic 
              title="异常事件" 
              value={currentData.incidents}
              suffix="起"
              prefix={<WarningOutlined />}
              valueStyle={{ color: currentData.incidents > 0 ? '#cf1322' : '#3f8600' }}
            />
          </StyledCard>
        </Col>
      </Row>

      <StyledCard title="信号灯状态">
        <Row justify="center">
          <Col span={8}>
            <SignalIndicator 
              color="#ff4d4f"
              active={currentData.signalPhase === 'red'}
            />
            <div style={{textAlign: 'center'}}>红灯</div>
          </Col>
          <Col span={8}>
            <SignalIndicator 
              color="#faad14"
              active={currentData.signalPhase === 'yellow'}
            />
            <div style={{textAlign: 'center'}}>黄灯</div>
          </Col>
          <Col span={8}>
            <SignalIndicator 
              color="#52c41a"
              active={currentData.signalPhase === 'green'}
            />
            <div style={{textAlign: 'center'}}>绿灯</div>
          </Col>
        </Row>
      </StyledCard>
    </div>
  );
};

export default Dashboard; 