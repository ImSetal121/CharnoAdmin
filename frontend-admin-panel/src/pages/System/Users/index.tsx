import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  Modal,
  Message,
  Space,
  Card,
  Typography,
  Pagination,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch, IconUserAdd } from '@arco-design/web-react/icon';
import type { SysUser, UserPageQueryParams, RegisterRequest, SysRole } from '@/types';
import {
  queryUsersWithPage,
  createUser,
  updateUser,
  deleteUser,
} from '@/api/system/AdminSysUser';
import { queryRoles } from '@/api/system/AdminSysRole';
import { register } from '@/api/system/Register';
import './index.css';

const { Title } = Typography;
const FormItem = Form.Item;
const Option = Select.Option;

export default function UsersPage() {
  const [users, setUsers] = useState<SysUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SysUser | null>(null);
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [form] = Form.useForm();
  const [registerForm] = Form.useForm<RegisterRequest>();

  // 查询参数
  const [queryParams, setQueryParams] = useState<UserPageQueryParams>({
    page: 0,
    size: 10,
  });

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: UserPageQueryParams = {
        ...queryParams,
        page: currentPage - 1, // 后端从0开始，前端从1开始
        size: pageSize,
      };
      const data = await queryUsersWithPage(params);
      setUsers(data);
      // 注意：后端返回的是列表，没有总数，这里假设返回的数据长度就是总数
      // 实际应该从后端返回分页信息中获取总数
      setTotal(data.length);
    } catch (error: any) {
      Message.error(error.message || '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const data = await queryRoles();
      setRoles(data);
    } catch (error: any) {
      Message.error(error.message || '加载角色列表失败');
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [currentPage, pageSize, queryParams]);

  // 处理搜索
  const handleSearch = (values: any) => {
    setQueryParams({
      ...values,
      page: 0,
      size: pageSize,
    });
    setCurrentPage(1);
  };

  // 处理重置
  const handleReset = () => {
    setQueryParams({
      page: 0,
      size: pageSize,
    });
    setCurrentPage(1);
  };

  // 打开新增/编辑弹窗
  const handleOpenModal = (user?: SysUser) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue(user);
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 保存用户
  const handleSave = async () => {
    try {
      const values = await form.validate();
      if (editingUser?.id) {
        // 更新
        await updateUser(editingUser.id, values);
        Message.success('更新用户成功');
      } else {
        // 新增
        await createUser(values);
        Message.success('创建用户成功');
      }
      handleCloseModal();
      loadUsers();
    } catch (error: any) {
      if (error.message) {
        Message.error(error.message);
      }
    }
  };

  // 删除用户
  const handleDelete = (user: SysUser) => {
    if (!user.id) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.nickname || user.accountIdentifier}" 吗？`,
      onOk: async () => {
        try {
          await deleteUser(user.id!);
          Message.success('删除用户成功');
          loadUsers();
        } catch (error: any) {
          Message.error(error.message || '删除用户失败');
        }
      },
    });
  };

  // 打开注册弹窗
  const handleOpenRegisterModal = () => {
    registerForm.resetFields();
    setRegisterVisible(true);
  };

  // 关闭注册弹窗
  const handleCloseRegisterModal = () => {
    setRegisterVisible(false);
    registerForm.resetFields();
  };

  // 处理注册
  const handleRegister = async () => {
    try {
      const values = await registerForm.validate();
      await register(values);
      Message.success('注册成功');
      handleCloseRegisterModal();
      loadUsers();
    } catch (error: any) {
      if (error.message) {
        Message.error(error.message);
      }
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '账号标识',
      dataIndex: 'accountIdentifier',
      width: 180,
    },
    {
      title: '账号类型',
      dataIndex: 'accountType',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          EMAIL: '邮箱',
          PHONE: '手机',
          USERNAME: '用户名',
          WECHAT: '微信',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 150,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      render: (gender: string) => {
        const genderMap: Record<string, string> = {
          MALE: '男',
          FEMALE: '女',
          UNKNOWN: '未知',
        };
        return genderMap[gender] || gender || '-';
      },
    },
    {
      title: '角色代码',
      dataIndex: 'roleCode',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          ENABLED: { text: '启用', color: 'green' },
          DISABLED: { text: '禁用', color: 'red' },
          LOCKED: { text: '锁定', color: 'orange' },
        };
        const statusInfo = statusMap[status] || { text: status, color: 'gray' };
        return <span style={{ color: statusInfo.color }}>{statusInfo.text}</span>;
      },
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginAt',
      width: 180,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
    {
      title: '最后登录IP',
      dataIndex: 'lastLoginIp',
      width: 140,
      render: (ip: string) => ip || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SysUser) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="users-page">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和操作 */}
          <div className="page-header">
            <Title heading={4} style={{ margin: 0 }}>
              用户管理
            </Title>
            <Space>
              <Button type="primary" icon={<IconUserAdd />} onClick={handleOpenRegisterModal}>
                新用户注册
              </Button>
            <Button type="primary" icon={<IconPlus />} onClick={() => handleOpenModal()}>
              新增用户
            </Button>
            </Space>
          </div>

          {/* 搜索表单 */}
          <Card size="small">
            <Form
              layout="inline"
              onSubmit={handleSearch}
              style={{ marginBottom: 0 }}
            >
              <FormItem label="账号标识" field="accountIdentifier">
                <Input placeholder="请输入账号标识" allowClear />
              </FormItem>
              <FormItem label="昵称" field="nickname">
                <Input placeholder="请输入昵称" allowClear />
              </FormItem>
              <FormItem label="状态" field="status">
                <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
                  <Option value="ENABLED">启用</Option>
                  <Option value="DISABLED">禁用</Option>
                  <Option value="LOCKED">锁定</Option>
                </Select>
              </FormItem>
              <FormItem label="账号类型" field="accountType">
                <Select placeholder="请选择账号类型" allowClear style={{ width: 120 }}>
                  <Option value="EMAIL">邮箱</Option>
                  <Option value="PHONE">手机</Option>
                  <Option value="USERNAME">用户名</Option>
                  <Option value="WECHAT">微信</Option>
                </Select>
              </FormItem>
              <FormItem>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<IconSearch />}>
                    查询
                  </Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </FormItem>
            </Form>
          </Card>

          {/* 表格 */}
          <Table
            columns={columns}
            data={users}
            loading={loading}
            pagination={false}
            border
          />

          {/* 分页 */}
          <div className="pagination-wrapper">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              showTotal
              showJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>
        </Space>
      </Card>

      {/* 注册弹窗 */}
      <Modal
        title="新用户注册"
        visible={registerVisible}
        onOk={handleRegister}
        onCancel={handleCloseRegisterModal}
        autoFocus={false}
        focusLock={true}
        style={{ width: 500 }}
      >
        <Form form={registerForm} layout="vertical">
          <FormItem
            label="用户名"
            field="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { minLength: 2, message: '用户名至少2个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </FormItem>
          <FormItem
            label="密码"
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </FormItem>
          <FormItem
            label="昵称"
            field="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { minLength: 1, message: '昵称不能为空' },
            ]}
          >
            <Input placeholder="请输入昵称" />
          </FormItem>
        </Form>
      </Modal>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={visible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        autoFocus={false}
        focusLock={true}
        style={{ width: 700 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="账号标识"
            field="accountIdentifier"
            rules={[{ required: true, message: '请输入账号标识' }]}
          >
            <Input placeholder="请输入账号标识" />
          </FormItem>
          <FormItem
            label="昵称"
            field="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </FormItem>
          <FormItem label="角色" field="roleCode">
            <Select placeholder="请选择角色" allowClear>
              {roles.map((role) => 
                role.code ? (
                  <Option key={role.code} value={role.code}>
                    {role.name || role.code}
                  </Option>
                ) : null
              )}
            </Select>
          </FormItem>
          <FormItem label="状态" field="status">
            <Select placeholder="请选择状态">
              <Option value="ENABLED">启用</Option>
              <Option value="DISABLED">禁用</Option>
              <Option value="LOCKED">锁定</Option>
            </Select>
          </FormItem>
          <FormItem label="账号类型" field="accountType">
            <Select placeholder="请选择账号类型">
              <Option value="EMAIL">邮箱</Option>
              <Option value="PHONE">手机</Option>
              <Option value="USERNAME">用户名</Option>
              <Option value="WECHAT">微信</Option>
            </Select>
          </FormItem>
          <FormItem label="性别" field="gender">
            <Select placeholder="请选择性别" allowClear>
              <Option value="MALE">男</Option>
              <Option value="FEMALE">女</Option>
              <Option value="UNKNOWN">未知</Option>
            </Select>
          </FormItem>
          <FormItem label="头像URL" field="avatarUrl">
            <Input placeholder="请输入头像URL" />
          </FormItem>
          <FormItem label="语言环境" field="locale">
            <Input placeholder="请输入语言环境，如：zh-CN, en-US" />
          </FormItem>
          <FormItem label="时区" field="timezone">
            <Input placeholder="请输入时区，如：Asia/Shanghai" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}

