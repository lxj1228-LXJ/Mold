import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  SettingOutlined,
  WarningOutlined,
  AppstoreOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/molds', icon: <ToolOutlined />, label: '模具管理' },
  { key: '/maintenance', icon: <SettingOutlined />, label: '保养管理' },
  { key: '/repairs', icon: <AppstoreOutlined />, label: '维修管理' },
  { key: '/parts', icon: <WarningOutlined />, label: '备件管理' },
  { key: '/alerts', icon: <AlertOutlined />, label: '预警中心' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #1e2a4a 0%, #2d1b69 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 700,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          letterSpacing: 1,
        }}>
          {collapsed ? '模保' : '模具保养维修系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          lineHeight: '56px',
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
            {menuItems.find(m => m.key === selectedKey)?.label || '工作台'}
          </span>
          <span style={{ color: '#999', fontSize: 14 }}>管理员</span>
        </Header>
        <Content style={{ margin: 16, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
