import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

