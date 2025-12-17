import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { SiteHeader } from './SiteHeader';
import { getToken } from '@/utils/request';
import { getTheme } from '@/utils/theme';

export default function MainLayout() {
  const navigate = useNavigate();

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      // 主题变化时，可以在这里做额外处理
      const theme = getTheme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };
    
    // 监听 storage 事件（跨标签页同步）
    window.addEventListener('storage', handleThemeChange);
    
    // 监听自定义主题变化事件
    const themeChangeEvent = () => {
      handleThemeChange();
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
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '4rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

