import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">账户设置</h1>
        <p className="text-muted-foreground">
          管理您的账户信息
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>账户设置</CardTitle>
          <CardDescription>
            内容待开发
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            账户设置功能正在开发中...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

