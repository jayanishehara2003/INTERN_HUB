import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/student/Dashboard';
import Vacancies from './pages/student/Vacancies';
import Applications from './pages/student/Applications';
import ApplyForm from './pages/student/ApplyForm';
import StudyMaterials from './pages/student/StudyMaterials';
import Quizzes from './pages/student/Quizzes';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import PostVacancy from './pages/admin/PostVacancy';
import ManageVacancies from './pages/admin/ManageVacancies';
import ManageApplications from './pages/admin/ManageApplications';
import UploadMaterial from './pages/admin/UploadMaterial';
import LandingPage from './pages/LandingPage';
import Messages from './pages/admin/Messages';
import CVBuilder from './pages/student/CVBuilder';
import Settings from './pages/student/Settings';
import ManageQuizzes from './pages/admin/ManageQuizzes';


const StudentLayout = ({ children }) => (
  <div className="flex bg-gray-50 min-h-screen">
    <Sidebar />
    <main className="flex-1 transition-all duration-300">{children}</main>
  </div>
);

const AdminLayout = ({ children }) => (
  <div className="flex bg-gray-50 min-h-screen">
    <AdminSidebar />
    <main className="ml-64 flex-1">{children}</main>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">🎓</div>
        <p className="text-gray-500">Loading InternHub...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  const normalizedRole = String(user?.role || '').trim().toLowerCase();
  if (adminOnly && !['admin', 'administrator'].includes(normalizedRole)) {
    return <Navigate to="/student/dashboard" />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute><StudentLayout><Dashboard /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/vacancies" element={
        <ProtectedRoute><StudentLayout><Vacancies /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/applications" element={
        <ProtectedRoute><StudentLayout><Applications /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/apply/:vacancyId" element={
        <ProtectedRoute><StudentLayout><ApplyForm /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/study-materials" element={
        <ProtectedRoute><StudentLayout><StudyMaterials /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/quizzes" element={
        <ProtectedRoute><StudentLayout><Quizzes /></StudentLayout></ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><ManageUsers /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/admin/post-vacancy" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><PostVacancy /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/admin/vacancies" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><ManageVacancies /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/admin/applications" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><ManageApplications /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/admin/upload-material" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><UploadMaterial /></AdminLayout></ProtectedRoute>
      } />
      
      <Route path="/admin/messages" element={
        <ProtectedRoute adminOnly={true}><AdminLayout><Messages /></AdminLayout></ProtectedRoute>
      } />
      <Route path="/student/cv-builder" element={
       <ProtectedRoute><StudentLayout><CVBuilder /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/settings" element={
        <ProtectedRoute><StudentLayout><Settings /></StudentLayout></ProtectedRoute>
      } />
      <Route path="/student/quizzes" element={
       <ProtectedRoute><StudentLayout><Quizzes /></StudentLayout></ProtectedRoute>
      } />

      <Route path="/admin/quizzes" element={
       <ProtectedRoute adminOnly={true}><AdminLayout><ManageQuizzes /></AdminLayout></ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}