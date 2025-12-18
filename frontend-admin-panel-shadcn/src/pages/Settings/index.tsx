import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getAnimationEnabled, setAnimationEnabled } from '@/utils/animation';

export default function SettingsPage() {
  const [animationEnabled, setAnimationEnabledState] = useState(getAnimationEnabled());

  useEffect(() => {
    // 监听动画设置变化（跨标签页同步）
    const handleAnimationChange = () => {
      setAnimationEnabledState(getAnimationEnabled());
    };
    window.addEventListener('storage', handleAnimationChange);
    window.addEventListener('animationchange', handleAnimationChange);
    return () => {
      window.removeEventListener('storage', handleAnimationChange);
      window.removeEventListener('animationchange', handleAnimationChange);
    };
  }, []);

  const handleAnimationToggle = (checked: boolean) => {
    setAnimationEnabled(checked);
    setAnimationEnabledState(checked);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground">
          管理系统设置和偏好
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>界面设置</CardTitle>
          <CardDescription>
            自定义界面显示效果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="animation-switch">动画效果</Label>
              <p className="text-sm text-muted-foreground">
                开启后，页面切换和登录页文字会有动画效果
              </p>
            </div>
            <Switch
              id="animation-switch"
              checked={animationEnabled}
              onCheckedChange={handleAnimationToggle}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

