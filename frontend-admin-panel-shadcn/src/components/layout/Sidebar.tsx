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
  useSidebar,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, UserCog, Moon, Sun, LogOut, Settings, ChevronRight, MoreVertical, PlusCircle, Mail, Home } from 'lucide-react';
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

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = getUserInfo();
  const theme = getTheme();
  const { isMobile } = useSidebar();

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
    navigate('/settings');
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
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/system/users');
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">C</span>
                </div>
                <span className="text-base font-semibold">Charno Admin.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip="快速创建"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  onClick={() => {
                    // TODO: 实现快速创建功能
                  }}
                >
                  <PlusCircle />
                  <span>快速创建</span>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                  onClick={() => {
                    // TODO: 实现邮件功能
                  }}
                >
                  <Mail />
                  <span className="sr-only">收件箱</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="!mb-0 !pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/home' || location.pathname === '/'}
                  onClick={() => handleMenuClick('/home')}
                >
                  <Home />
                  <span>首页</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {menuItems.map((group) => {
          const GroupIcon = group.icon;
          const defaultOpen = isGroupOpen(group);
          
          return (
            <SidebarGroup key={group.title} className="!mt-0 !pt-0">
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="设置"
              onClick={handleAccountSettings}
            >
              <Settings />
              <span>设置</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mb-4">
            <SidebarMenuButton
              tooltip={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
              onClick={handleThemeToggle}
            >
              {theme === 'light' ? <Moon /> : <Sun />}
              <span>{theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={userInfo?.avatarUrl} alt={userInfo?.nickname || '用户'} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(userInfo?.nickname || userInfo?.accountIdentifier)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {userInfo?.nickname || userInfo?.accountIdentifier || '用户'}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {userInfo?.roleCode || '未分配角色'}
                    </span>
                  </div>
                  <MoreVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={userInfo?.avatarUrl} alt={userInfo?.nickname || '用户'} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(userInfo?.nickname || userInfo?.accountIdentifier)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {userInfo?.nickname || userInfo?.accountIdentifier || '用户'}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {userInfo?.roleCode || '未分配角色'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

