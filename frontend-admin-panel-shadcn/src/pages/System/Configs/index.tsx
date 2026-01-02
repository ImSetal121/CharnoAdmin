import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { getPaginationPages } from '@/utils/pagination';
import type { SysConfig, ConfigPageQueryParams } from '@/types';
import {
  queryConfigsWithPage,
  createConfig,
  updateConfig,
  deleteConfig,
} from '@/api/system/AdminSysConfig';
import { toast } from 'sonner';

const configSchema = z.object({
  key: z.string().min(1, '配置键不能为空'),
  value: z.string().optional(),
  description: z.string().optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function ConfigsPage() {
  const [configs, setConfigs] = useState<SysConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SysConfig | null>(null);
  const [configToDelete, setConfigToDelete] = useState<SysConfig | null>(null);
  const [queryParams, setQueryParams] = useState<ConfigPageQueryParams>({
    page: 0,
    size: 10,
  });
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {},
  });

  const searchForm = useForm<ConfigPageQueryParams>({
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

  // 加载配置列表
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const sortParam = sortField && sortDirection 
        ? `${sortField},${sortDirection}` 
        : undefined;
      
      const params: ConfigPageQueryParams = {
        ...queryParams,
        page: currentPage - 1,
        size: pageSize,
        sort: sortParam,
      };
      const result = await queryConfigsWithPage(params);
      setConfigs(result.data);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || '加载配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [currentPage, pageSize, queryParams, sortField, sortDirection]);

  // 处理搜索
  const handleSearch = (values: ConfigPageQueryParams) => {
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
  const handleOpenModal = (config?: SysConfig) => {
    if (config) {
      setEditingConfig(config);
      form.reset(config);
    } else {
      setEditingConfig(null);
      form.reset({});
    }
    setVisible(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setVisible(false);
    setEditingConfig(null);
    form.reset({});
  };

  // 保存配置
  const handleSave = async (values: ConfigFormData) => {
    try {
      if (editingConfig?.key) {
        await updateConfig(editingConfig.key, values as SysConfig);
        toast.success('更新配置成功');
      } else {
        await createConfig(values as SysConfig);
        toast.success('创建配置成功');
      }
      handleCloseModal();
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  // 删除配置
  const handleDeleteConfirm = async () => {
    if (!configToDelete?.key) return;
    try {
      await deleteConfig(configToDelete.key);
      toast.success('删除配置成功');
      setConfigToDelete(null);
      loadConfigs();
    } catch (error: any) {
      toast.error(error.message || '删除配置失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">配置管理</h1>
          <p className="text-muted-foreground">管理系统配置信息</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          新增配置
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
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>配置键</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入配置键" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>配置值</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入配置值" {...field} />
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
          <CardTitle>配置列表</CardTitle>
          <CardDescription>共 {total} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    field="key"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  >
                    配置键
                  </SortableTableHead>
                  <TableHead>配置值</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config) => (
                    <TableRow key={config.key}>
                      <TableCell className="font-medium">{config.key}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {config.value || '-'}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {config.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfigToDelete(config)}
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

      {/* 新增/编辑弹窗 */}
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑配置' : '新增配置'}</DialogTitle>
            <DialogDescription>
              {editingConfig ? '修改配置信息' : '创建新的系统配置'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>配置键</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="请输入配置键"
                        disabled={!!editingConfig?.key}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>配置值</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入配置值"
                        className="min-h-[100px]"
                        {...field}
                      />
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
                        placeholder="请输入配置描述"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
      <AlertDialog open={!!configToDelete} onOpenChange={(open) => !open && setConfigToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除配置 "{configToDelete?.key}" 吗？此操作不可撤销。
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

