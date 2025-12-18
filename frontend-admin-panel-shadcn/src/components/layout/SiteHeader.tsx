import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Clock } from '@/components/motion-primitives/clock';

const pageTitles: Record<string, string> = {
  '/home': '首页',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/settings': '设置',
  '/dashboard': '仪表板',
};

export function SiteHeader() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || '管理面板';

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="grid w-full grid-cols-3 items-center gap-1 px-4 py-2 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{pageTitle}</h1>
        </div>
        <div className="flex justify-center">
          <Clock />
        </div>
        <div></div>
      </div>
    </header>
  );
}

