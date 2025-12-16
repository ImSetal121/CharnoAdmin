import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from '@arco-design/web-react';
import { ConfigProvider } from '@arco-design/web-react';
import { getToken } from '@/utils/request';
import { getTheme } from '@/utils/theme';
import Header from './Header';
import Sidebar from './Sidebar';
import './index.css';

const { Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(getTheme());
    };
    
    // 监听 storage 事件（跨标签页同步）
    window.addEventListener('storage', handleThemeChange);
    
    // 监听自定义主题变化事件
    const themeChangeEvent = () => {
      setTheme(getTheme());
    };
    window.addEventListener('themechange', themeChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themechange', themeChangeEvent as EventListener);
    };
  }, []);

  // 检查登录状态
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <ConfigProvider>
      <Layout className="layout-container">
        <Header 
          onThemeChange={() => setTheme(getTheme())}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapseChange={setSidebarCollapsed}
        />
        <Layout>
          <Sidebar collapsed={sidebarCollapsed} />
          <Layout className="layout-content-wrapper">
            <Content className="layout-content">
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

