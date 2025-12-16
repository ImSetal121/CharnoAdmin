import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Divider } from '@arco-design/web-react';
import { getToken } from '@/utils/request';
import './index.css';

const { Title, Paragraph } = Typography;

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
    <div className="dashboard-container">
      <div className="dashboard-content">
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title heading={2}>管理面板</Title>
              <Paragraph type="secondary">
                欢迎使用系统管理面板
              </Paragraph>
            </div>
            <Divider />
            <div>
              <Title heading={4}>临时页面</Title>
              <Paragraph>
                这是一个临时管理面板页面，功能正在开发中...
              </Paragraph>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}

