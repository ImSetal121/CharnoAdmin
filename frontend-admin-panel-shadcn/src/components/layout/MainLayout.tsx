import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { SiteHeader } from './SiteHeader';
import { getToken } from '@/utils/request';
import { getTheme } from '@/utils/theme';
import { getAnimationEnabled } from '@/utils/animation';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [animationEnabled, setAnimationEnabled] = useState(getAnimationEnabled());

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

  // 监听动画设置变化
  useEffect(() => {
    const handleAnimationChange = () => {
      setAnimationEnabled(getAnimationEnabled());
    };
    window.addEventListener('storage', handleAnimationChange);
    window.addEventListener('animationchange', handleAnimationChange);
    return () => {
      window.removeEventListener('storage', handleAnimationChange);
      window.removeEventListener('animationchange', handleAnimationChange);
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
              {animationEnabled ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

