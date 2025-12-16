import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { login } from '@/api/login';
import type { LoginRequest } from '@/types';
import { setUserInfo } from '@/utils/user';
import './index.css';

const FormItem = Form.Item;

export default function LoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginRequest>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const result = await login(values);
      // 保存用户信息到 localStorage
      if (result.user) {
        setUserInfo(result.user);
      }
      Message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      Message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">欢迎登录</h1>
            <p className="login-subtitle">请输入您的账号信息</p>
          </div>
          <Form
            form={form}
            layout="vertical"
            onSubmit={handleSubmit}
            autoComplete="off"
            className="login-form"
          >
            <FormItem
              label="用户名"
              field="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { minLength: 2, message: '用户名至少2个字符' },
              ]}
            >
              <Input
                placeholder="请输入用户名"
                size="large"
                autoComplete="username"
              />
            </FormItem>
            <FormItem
              label="密码"
              field="password"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                placeholder="请输入密码"
                size="large"
                autoComplete="current-password"
              />
            </FormItem>
            <FormItem>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                long
                loading={loading}
              >
                登录
              </Button>
            </FormItem>
          </Form>
        </div>
      </div>
    </div>
  );
}
