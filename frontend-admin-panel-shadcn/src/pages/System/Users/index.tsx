import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, UserPlus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { getPaginationPages } from '@/utils/pagination';
import type { SysUser, UserPageQueryParams, RegisterRequest, SysRole } from '@/types';
import {
  queryUsersWithPage,
  createUser,
  updateUser,
  deleteUser,
} from '@/api/system/AdminSysUser';
import { queryRoles } from '@/api/system/AdminSysRole';
import { register } from '@/api/system/Register';
import { toast } from 'sonner';

const userSchema = z.object({
  accountIdentifier: z.string().min(1, '请输入账号标识'),
  nickname: z.string().min(1, '请输入昵称'),
  roleCode: z.string().optional(),
  status: z.string().optional(),
  accountType: z.string().optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

const registerSchema = z.object({
  username: z.string().min(2, '用户名至少2个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  nickname: z.string().min(1, '昵称不能为空'),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<SysUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SysUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SysUser | null>(null);
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [queryParams, setQueryParams] = useState<UserPageQueryParams>({
    page: 0,
    size: 10,
  });
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {},
  });

  const registerForm = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      nickname: '',
    },
  });

  const searchForm = useForm<UserPageQueryParams>({
    defaultValues: {},
  });

  // 处理排序点击
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 同一字段：asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // 不同字段：设置为 asc
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    try {
      const sortParam = sortField && sortDirection 
        ? `${sortField},${sortDirection}` 
        : undefined;
      
      const params: UserPageQueryParams = {
        ...queryParams,
        page: currentPage - 1,
        size: pageSize,
        sort: sortParam,
      };
      const result = await queryUsersWithPage(params);
      setUsers(result.data);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || '加载用户列表失败');
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
      toast.error(error.message || '加载角色列表失败');
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [currentPage, pageSize, queryParams, sortField, sortDirection]);

  // 处理搜索
  const handleSearch = (values: UserPageQueryParams) => {
    setQueryParams({
      ...values,
      page: 0,
      size: pageSize,
    });
    setCurrentPage(1);
  };

  // 处理重置
  const handleReset = () => {
    searchForm.reset();
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
      form.reset(user);
    } else {
      setEditingUser(null);
      form.reset({});
    }
    setVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setVisible(false);
    setEditingUser(null);
    form.reset({});
  };

  // 保存用户
  const handleSave = async (values: UserFormData) => {
    try {
      if (editingUser?.id) {
        await updateUser(editingUser.id, values as SysUser);
        toast.success('更新用户成功');
      } else {
        await createUser(values as SysUser);
        toast.success('创建用户成功');
      }
      handleCloseModal();
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 删除用户
  const handleDeleteConfirm = async () => {
    if (!userToDelete?.id) return;
    try {
      await deleteUser(userToDelete.id);
      toast.success('删除用户成功');
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || '删除用户失败');
    }
  };

  // 打开注册弹窗
  const handleOpenRegisterModal = () => {
    registerForm.reset();
    setRegisterVisible(true);
  };

  // 关闭注册弹窗
  const handleCloseRegisterModal = () => {
    setRegisterVisible(false);
    registerForm.reset();
  };

  // 处理注册
  const handleRegister = async (values: RegisterRequest) => {
    try {
      await register(values);
      toast.success('注册成功');
      handleCloseRegisterModal();
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || '注册失败');
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { text: string; variant: 'default' | 'destructive' | 'secondary' }> = {
      ENABLED: { text: '启用', variant: 'default' },
      DISABLED: { text: '禁用', variant: 'destructive' },
      LOCKED: { text: '锁定', variant: 'secondary' },
    };
    const statusInfo = statusMap[status || ''] || { text: status || '-', variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const getTypeText = (type?: string) => {
    const typeMap: Record<string, string> = {
      EMAIL: '邮箱',
      PHONE: '手机',
      USERNAME: '用户名',
      WECHAT: '微信',
    };
    return typeMap[type || ''] || type || '-';
  };

  const getGenderText = (gender?: string) => {
    const genderMap: Record<string, string> = {
      MALE: '男',
      FEMALE: '女',
      UNKNOWN: '未知',
    };
    return genderMap[gender || ''] || gender || '-';
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户信息</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenRegisterModal}>
            <UserPlus className="mr-2 h-4 w-4" />
            新用户注册
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            新增用户
          </Button>
        </div>
      </div>

      {/* 搜索表单 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={searchForm.control}
                  name="accountIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号标识</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入账号标识" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>昵称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入昵称" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ENABLED">启用</SelectItem>
                          <SelectItem value="DISABLED">禁用</SelectItem>
                          <SelectItem value="LOCKED">锁定</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号类型</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择账号类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">邮箱</SelectItem>
                          <SelectItem value="PHONE">手机</SelectItem>
                          <SelectItem value="USERNAME">用户名</SelectItem>
                          <SelectItem value="WECHAT">微信</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  查询
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  重置
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    field="id"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    ID
                  </SortableTableHead>
                  <SortableTableHead
                    field="accountIdentifier"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    账号标识
                  </SortableTableHead>
                  <SortableTableHead
                    field="accountType"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    账号类型
                  </SortableTableHead>
                  <SortableTableHead
                    field="nickname"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    昵称
                  </SortableTableHead>
                  <SortableTableHead
                    field="gender"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    性别
                  </SortableTableHead>
                  <SortableTableHead
                    field="roleCode"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    角色代码
                  </SortableTableHead>
                  <SortableTableHead
                    field="status"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    状态
                  </SortableTableHead>
                  <SortableTableHead
                    field="lastLoginAt"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    最后登录时间
                  </SortableTableHead>
                  <SortableTableHead
                    field="createdAt"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    创建时间
                  </SortableTableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.id?.substring(0, 8)}...</TableCell>
                      <TableCell>{user.accountIdentifier}</TableCell>
                      <TableCell>{getTypeText(user.accountType)}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell>{getGenderText(user.gender)}</TableCell>
                      <TableCell>{user.roleCode || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Label htmlFor="page-size-select" className="text-sm">
                每页显示：
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="page-size-select" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                共 {total} 条记录
              </span>
            </div>
            {totalPages > 1 && (
              <Pagination className="sm:mx-0 sm:w-auto sm:justify-end">
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {getPaginationPages(currentPage, totalPages, 3).map((page, index) => (
                    <PaginationItem key={page === 'ellipsis' ? `ellipsis-${index}` : page}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 注册弹窗 */}
      <Dialog open={registerVisible} onOpenChange={setRegisterVisible}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新用户注册</DialogTitle>
            <DialogDescription>创建新的系统用户账号</DialogDescription>
          </DialogHeader>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>昵称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入昵称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseRegisterModal}>
                  取消
                </Button>
                <Button type="submit">注册</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 新增/编辑弹窗 */}
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息' : '创建新的系统用户'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号标识</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入账号标识" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>昵称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入昵称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roleCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) =>
                            role.code ? (
                              <SelectItem key={role.code} value={role.code}>
                                {role.name || role.code}
                              </SelectItem>
                            ) : null
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ENABLED">启用</SelectItem>
                          <SelectItem value="DISABLED">禁用</SelectItem>
                          <SelectItem value="LOCKED">锁定</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号类型</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择账号类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMAIL">邮箱</SelectItem>
                          <SelectItem value="PHONE">手机</SelectItem>
                          <SelectItem value="USERNAME">用户名</SelectItem>
                          <SelectItem value="WECHAT">微信</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性别</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择性别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">男</SelectItem>
                          <SelectItem value="FEMALE">女</SelectItem>
                          <SelectItem value="UNKNOWN">未知</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>头像URL</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入头像URL" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>语言环境</FormLabel>
                      <FormControl>
                        <Input placeholder="如：zh-CN, en-US" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>时区</FormLabel>
                      <FormControl>
                        <Input placeholder="如：Asia/Shanghai" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 "{userToDelete?.nickname || userToDelete?.accountIdentifier}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

