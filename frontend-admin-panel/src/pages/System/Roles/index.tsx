import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Form,
  Input,
  Modal,
  Message,
  Space,
  Card,
  Typography,
  Pagination,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconSearch } from '@arco-design/web-react/icon';
import type { SysRole, RolePageQueryParams } from '@/types';
import {
  queryRolesWithPage,
  createRole,
  updateRole,
  deleteRole,
} from '@/api/system/AdminSysRole';
import './index.css';

const { Title } = Typography;
const FormItem = Form.Item;

export default function RolesPage() {
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<SysRole | null>(null);
  const [form] = Form.useForm();

  // 查询参数
  const [queryParams, setQueryParams] = useState<RolePageQueryParams>({
    page: 0,
    size: 10,
  });

  // 加载角色列表
  const loadRoles = async () => {
    setLoading(true);
    try {
      const params: RolePageQueryParams = {
        ...queryParams,
        page: currentPage - 1, // 后端从0开始，前端从1开始
        size: pageSize,
      };
      const data = await queryRolesWithPage(params);
      setRoles(data);
      // 注意：后端返回的是列表，没有总数，这里假设返回的数据长度就是总数
      // 实际应该从后端返回分页信息中获取总数
      setTotal(data.length);
    } catch (error: any) {
      Message.error(error.message || '加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
  const handleOpenModal = (role?: SysRole) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue(role);
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setVisible(false);
    setEditingRole(null);
    form.resetFields();
  };

  // 保存角色
  const handleSave = async () => {
    try {
      const values = await form.validate();
      if (editingRole?.code) {
        // 更新
        await updateRole(editingRole.code, values);
        Message.success('更新角色成功');
      } else {
        // 新增
        await createRole(values);
        Message.success('创建角色成功');
      }
      handleCloseModal();
      loadRoles();
    } catch (error: any) {
      if (error.message) {
        Message.error(error.message);
      }
    }
  };

  // 删除角色
  const handleDelete = (role: SysRole) => {
    if (!role.code) return;
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色 "${role.name || role.code}" 吗？`,
      onOk: async () => {
        try {
          await deleteRole(role.code!);
          Message.success('删除角色成功');
          loadRoles();
        } catch (error: any) {
          Message.error(error.message || '删除角色失败');
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '角色代码',
      dataIndex: 'code',
      width: 150,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 300,
      ellipsis: true,
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SysRole) => (
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
    <div className="roles-page">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和操作 */}
          <div className="page-header">
            <Title heading={4} style={{ margin: 0 }}>
              角色管理
            </Title>
            <Button type="primary" icon={<IconPlus />} onClick={() => handleOpenModal()}>
              新增角色
            </Button>
          </div>

          {/* 搜索表单 */}
          <Card size="small">
            <Form
              layout="inline"
              onSubmit={handleSearch}
              style={{ marginBottom: 0 }}
            >
              <FormItem label="角色代码" field="code">
                <Input placeholder="请输入角色代码" allowClear />
              </FormItem>
              <FormItem label="角色名称" field="name">
                <Input placeholder="请输入角色名称" allowClear />
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
            data={roles}
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
        title={editingRole ? '编辑角色' : '新增角色'}
        visible={visible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        autoFocus={false}
        focusLock={true}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem
            label="角色代码"
            field="code"
            rules={[
              { required: true, message: '请输入角色代码' },
              { minLength: 2, message: '角色代码至少2个字符' },
            ]}
          >
            <Input
              placeholder="请输入角色代码"
              disabled={!!editingRole?.code}
            />
          </FormItem>
          <FormItem
            label="角色名称"
            field="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </FormItem>
          <FormItem label="描述" field="description">
            <Input.TextArea
              placeholder="请输入角色描述"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}

