import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getToken } from '@/utils/request';

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // 检查登录状态
    const token = getToken();
    if (!token) {
      // 未登录，跳转到登录页
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理面板</h1>
        <p className="text-muted-foreground">
          欢迎使用系统管理面板
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>临时页面</CardTitle>
          <CardDescription>
            这是一个临时管理面板页面，功能正在开发中...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            您可以从侧边栏访问其他功能模块。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

