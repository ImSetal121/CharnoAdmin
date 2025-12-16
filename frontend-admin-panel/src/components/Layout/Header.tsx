import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Avatar, Space, Menu } from '@arco-design/web-react';
import { IconMoon, IconSun, IconFullscreen, IconFullscreenExit, IconUser, IconPoweroff } from '@arco-design/web-react/icon';
import { toggleTheme, getTheme } from '@/utils/theme';
import { toggleFullscreen, isFullscreen, onFullscreenChange } from '@/utils/fullscreen';
import { getUserInfo, clearUserInfo } from '@/utils/user';
import { removeToken } from '@/utils/request';
import './index.css';

const { Header: ArcoHeader } = Layout;

interface HeaderProps {
  onThemeChange?: () => void;
}

export default function Header({ onThemeChange }: HeaderProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme());
  const [fullscreen, setFullscreen] = useState(isFullscreen());
  const userInfo = getUserInfo();

  // 监听全屏状态变化
  useEffect(() => {
    const cleanup = onFullscreenChange((isFs) => {
      setFullscreen(isFs);
    });
    return cleanup;
  }, []);

  // 处理主题切换
  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
    // 通知父组件主题已变化
    if (onThemeChange) {
      onThemeChange();
    }
    // 触发自定义事件，用于跨组件通信
    window.dispatchEvent(new Event('themechange'));
  };

  // 处理全屏切换
  const handleFullscreenToggle = async () => {
    try {
      await toggleFullscreen();
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    removeToken();
    clearUserInfo();
    navigate('/login');
  };

  // 处理账户设置
  const handleAccountSettings = () => {
    // TODO: 实现账户设置功能
    console.log('账户设置');
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'account',
      icon: <IconUser />,
      title: '账户设置',
      onClick: handleAccountSettings,
    },
    {
      key: 'logout',
      icon: <IconPoweroff />,
      title: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <ArcoHeader className="layout-header">
      <div className="layout-header-left">
        <div className="layout-logo">
          <span>管理系统</span>
        </div>
      </div>
      <div className="layout-header-right">
        <Space size="large">
          {/* 主题切换按钮 */}
          <Button
            type="text"
            icon={theme === 'light' ? <IconMoon /> : <IconSun />}
            onClick={handleThemeToggle}
            className="header-action-btn"
          />
          
          {/* 全屏按钮 */}
          <Button
            type="text"
            icon={fullscreen ? <IconFullscreenExit /> : <IconFullscreen />}
            onClick={handleFullscreenToggle}
            className="header-action-btn"
          />
          
          {/* 用户头像下拉菜单 */}
          <Dropdown
            droplist={
              <Menu>
                {userMenuItems.map((item) => (
                  <Menu.Item key={item.key} onClick={item.onClick}>
                    <Space size={8}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Space>
                  </Menu.Item>
                ))}
              </Menu>
            }
            position="br"
            trigger="click"
          >
            <div className="layout-header-user">
              <Avatar size={32} className="header-avatar">
                {userInfo?.avatarUrl ? (
                  <img src={userInfo.avatarUrl} alt={userInfo.nickname || '用户'} />
                ) : (
                  <IconUser />
                )}
              </Avatar>
              <span className="header-username">
                {userInfo?.nickname || userInfo?.accountIdentifier || '用户'}
              </span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </ArcoHeader>
  );
}

