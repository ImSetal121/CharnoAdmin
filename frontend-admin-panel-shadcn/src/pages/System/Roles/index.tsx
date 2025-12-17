import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { SysRole, RolePageQueryParams } from '@/types';
import {
  queryRolesWithPage,
  createRole,
  updateRole,
  deleteRole,
} from '@/api/system/AdminSysRole';
import { toast } from 'sonner';

const roleSchema = z.object({
  code: z.string().min(2, '角色代码至少2个字符'),
  name: z.string().min(1, '请输入角色名称'),
  description: z.string().optional(),
});

export default function RolesPage() {
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<SysRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<SysRole | null>(null);
  const [queryParams, setQueryParams] = useState<RolePageQueryParams>({
    page: 0,
    size: 10,
  });
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const form = useForm<SysRole>({
    resolver: zodResolver(roleSchema),
    defaultValues: {},
  });

  const searchForm = useForm<RolePageQueryParams>({
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

  // 加载角色列表
  const loadRoles = async () => {
    setLoading(true);
    try {
      const sortParam = sortField && sortDirection 
        ? `${sortField},${sortDirection}` 
        : undefined;
      
      const params: RolePageQueryParams = {
        ...queryParams,
        page: currentPage - 1,
        size: pageSize,
        sort: sortParam,
      };
      const result = await queryRolesWithPage(params);
      setRoles(result.data);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || '加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [currentPage, pageSize, queryParams, sortField, sortDirection]);

  // 处理搜索
  const handleSearch = (values: RolePageQueryParams) => {
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
  const handleOpenModal = (role?: SysRole) => {
    if (role) {
      setEditingRole(role);
      form.reset(role);
    } else {
      setEditingRole(null);
      form.reset({});
    }
    setVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setVisible(false);
    setEditingRole(null);
    form.reset({});
  };

  // 保存角色
  const handleSave = async (values: SysRole) => {
    try {
      if (editingRole?.code) {
        await updateRole(editingRole.code, values);
        toast.success('更新角色成功');
      } else {
        await createRole(values);
        toast.success('创建角色成功');
      }
      handleCloseModal();
      loadRoles();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 删除角色
  const handleDeleteConfirm = async () => {
    if (!roleToDelete?.code) return;
    try {
      await deleteRole(roleToDelete.code);
      toast.success('删除角色成功');
      setRoleToDelete(null);
      loadRoles();
    } catch (error: any) {
      toast.error(error.message || '删除角色失败');
    }
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
          <h1 className="text-3xl font-bold tracking-tight">角色管理</h1>
          <p className="text-muted-foreground">管理系统角色信息</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          新增角色
        </Button>
      </div>

      {/* 搜索表单 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={searchForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色代码</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入角色代码" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入角色名称" {...field} />
                      </FormControl>
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
          <CardTitle>角色列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    field="code"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    角色代码
                  </SortableTableHead>
                  <SortableTableHead
                    field="name"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    角色名称
                  </SortableTableHead>
                  <TableHead>描述</TableHead>
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
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.code}>
                      <TableCell className="font-medium">{role.code}</TableCell>
                      <TableCell>{role.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>{formatDate(role.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRoleToDelete(role)}
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
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
            <DialogDescription>
              {editingRole ? '修改角色信息' : '创建新的系统角色'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色代码</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入角色代码"
                        disabled={!!editingRole?.code}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色名称</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入角色名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入角色描述"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除角色 "{roleToDelete?.name || roleToDelete?.code}" 吗？此操作不可撤销。
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

