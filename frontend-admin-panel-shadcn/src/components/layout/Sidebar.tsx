import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Users, UserCog, Moon, Sun, LogOut, Settings, ChevronRight } from 'lucide-react';
import { getUserInfo, clearUserInfo } from '@/utils/user';
import { removeToken } from '@/utils/request';
import { logout } from '@/api/system/Logout';
import { toggleTheme, getTheme } from '@/utils/theme';
import { toast } from 'sonner';

const menuItems = [
  {
    title: '系统管理',
    icon: Settings,
    items: [
      {
        title: '用户管理',
        url: '/system/users',
        icon: Users,
      },
      {
        title: '角色管理',
        url: '/system/roles',
        icon: UserCog,
      },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = getUserInfo();
  const theme = getTheme();

  const handleMenuClick = (url: string) => {
    navigate(url);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    // 触发自定义事件，用于跨组件通信
    window.dispatchEvent(new Event('themechange'));
  };

  const handleLogout = async () => {
    try {
      await logout();
      removeToken();
      clearUserInfo();
      navigate('/login');
      toast.success('退出登录成功');
    } catch {
      // 即使接口调用失败，也清除本地信息并跳转
      removeToken();
      clearUserInfo();
      navigate('/login');
    }
  };

  const handleAccountSettings = () => {
    navigate('/account/settings');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  // 检查是否有子菜单项处于激活状态
  const isGroupOpen = (group: typeof menuItems[0]) => {
    return group.items.some(
      (item) =>
        location.pathname === item.url || location.pathname.startsWith(item.url + '/')
    );
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Charno Admin.</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) => {
          const GroupIcon = group.icon;
          const defaultOpen = isGroupOpen(group);
          
          return (
            <SidebarGroup key={group.title}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible asChild defaultOpen={defaultOpen}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={group.title}>
                          <GroupIcon />
                          <span>{group.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                              location.pathname === item.url ||
                              location.pathname.startsWith(item.url + '/');
                            return (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton
                                  isActive={isActive}
                                  onClick={() => handleMenuClick(item.url)}
                                >
                                  <Icon />
                                  <span>{item.title}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter>
        <Separator className="mb-2" />
        <div className="flex items-center gap-2 px-2 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userInfo?.avatarUrl} alt={userInfo?.nickname || '用户'} />
                  <AvatarFallback>{getInitials(userInfo?.nickname || userInfo?.accountIdentifier)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">
                    {userInfo?.nickname || userInfo?.accountIdentifier || '用户'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {userInfo?.roleCode || '未分配角色'}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleAccountSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>账户设置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleThemeToggle}>
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>切换到暗色模式</span>
                  </>
                ) : (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>切换到亮色模式</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

