import React from 'react';
import { Layout, Typography } from 'antd';
import styled from 'styled-components';
import Dashboard from './components/Dashboard';
import SignalOptimizer from './components/SignalOptimizer';

const { Header, Content } = Layout;
const { Title } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #001529;
  padding: 0 20px;
  display: flex;
  align-items: center;
`;

const StyledContent = styled(Content)`
  padding: 20px;
  background: #f0f2f5;
`;

const App = () => {
  return (
    <StyledLayout>
      <StyledHeader>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          智慧交通信号灯监测系统
        </Title>
      </StyledHeader>
      <StyledContent>
        <Dashboard />
        <SignalOptimizer />
      </StyledContent>
    </StyledLayout>
  );
};

export default App; 