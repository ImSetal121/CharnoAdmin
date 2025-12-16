import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from '@arco-design/web-react';
import { IconUser, IconUserGroup } from '@arco-design/web-react/icon';
import './index.css';

const { Sider } = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const menuConfig = [
  {
    key: 'system',
    title: '系统管理',
    icon: <IconUserGroup />,
    children: [
      {
        key: '/system/users',
        title: '用户管理',
        icon: <IconUser />,
      },
      {
        key: '/system/roles',
        title: '角色管理',
        icon: <IconUserGroup />,
      },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径计算默认展开的菜单项
  const getDefaultOpenKeys = (): string[] => {
    const path = location.pathname;
    for (const menu of menuConfig) {
      for (const child of menu.children) {
        if (path === child.key || path.startsWith(child.key + '/')) {
          return [menu.key];
        }
      }
    }
    return [];
  };

  // 根据当前路径计算默认选中的菜单项
  const getDefaultSelectedKeys = (): string[] => {
    const path = location.pathname;
    for (const menu of menuConfig) {
      for (const child of menu.children) {
        if (path === child.key || path.startsWith(child.key + '/')) {
          return [child.key];
        }
      }
    }
    return [];
  };

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <Sider className="layout-sider" width={220}>
      <Menu
        defaultOpenKeys={getDefaultOpenKeys()}
        defaultSelectedKeys={getDefaultSelectedKeys()}
        onClickMenuItem={handleMenuClick}
        hasCollapseButton
        style={{ width: '100%', height: '100%' }}
      >
        {menuConfig.map((menu) => (
          <SubMenu
            key={menu.key}
            title={
              <>
                {menu.icon}
                {menu.title}
              </>
            }
          >
            {menu.children.map((child) => (
              <MenuItem key={child.key}>
                {child.icon}
                {child.title}
              </MenuItem>
            ))}
          </SubMenu>
        ))}
      </Menu>
    </Sider>
  );
}

