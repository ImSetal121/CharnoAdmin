import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/Login';
import MainLayout from '@/components/Layout';
import UsersPage from '@/pages/System/Users';
import RolesPage from '@/pages/System/Roles';
import AccountSettingsPage from '@/pages/AccountSettings';
import '@arco-design/web-react/dist/css/arco.css';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/system/users" replace />} />
        <Route path="dashboard" element={<Navigate to="/system/users" replace />} />
        <Route path="system/users" element={<UsersPage />} />
        <Route path="system/roles" element={<RolesPage />} />
        <Route path="account/settings" element={<AccountSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
