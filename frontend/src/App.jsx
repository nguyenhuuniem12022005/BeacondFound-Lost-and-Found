import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/common';

import MemberLayout from './layouts/MemberLayout';
import AdminLayout from './layouts/AdminLayout';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

import MemberHomePage from './pages/member/MemberHomePage';
import MapSearchPage from './pages/member/MapSearchPage';
import PostDetailPage from './pages/member/PostDetailPage';
import CreatePostPage from './pages/member/CreatePostPage';
import EditPostPage from './pages/member/EditPostPage';
import ProfilePage from './pages/member/ProfilePage';
import EditProfilePage from './pages/member/EditProfilePage';
import NotificationPage from './pages/member/NotificationPage';
import MessagesPage from './pages/member/MessagesPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPosts from './pages/admin/AdminPosts';
import AdminPostDetail from './pages/admin/AdminPostDetail';
import ManageCategoryPage from './pages/admin/AdminCategories';
import AdminReports from './pages/admin/AdminReports';
import AdminReportDetail from './pages/admin/AdminReportDetail';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/home" replace /> : <RegisterPage />} />

      {/* Member (cần đăng nhập) */}
      <Route
        element={
          <RequireAuth>
            <MemberLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<MemberHomePage />} />
        <Route path="/search" element={<MemberHomePage />} />
        <Route path="/map" element={<MapSearchPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<EditPostPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/my-posts" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessagesPage />} />
      </Route>

      {/* Create post: full screen riêng theo thiết kế */}
      <Route
        path="/create-post"
        element={
          <RequireAuth>
            <CreatePostPage />
          </RequireAuth>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="posts/:id" element={<AdminPostDetail />} />
        <Route path="categories" element={<ManageCategoryPage />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/:id" element={<AdminReportDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
