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
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon';
import type { SysUser, UserPageQueryParams } from '@/types';
import {
  queryUsersWithPage,
  createUser,
  updateUser,
  deleteUser,
} from '@/api/user';
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
  const [editingUser, setEditingUser] = useState<SysUser | null>(null);
  const [form] = Form.useForm();

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

  useEffect(() => {
    loadUsers();
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
      title: '昵称',
      dataIndex: 'nickname',
      width: 150,
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
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (time: string) => {
        if (!time) return '-';
        return new Date(time).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      width: 150,
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
            <Button type="primary" icon={<IconPlus />} onClick={() => handleOpenModal()}>
              新增用户
            </Button>
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

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={visible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        autoFocus={false}
        focusLock={true}
        style={{ width: 600 }}
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
          <FormItem label="角色代码" field="roleCode">
            <Input placeholder="请输入角色代码" />
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
        </Form>
      </Modal>
    </div>
  );
}

