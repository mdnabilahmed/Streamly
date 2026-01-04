import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/login";
import Register from "./pages/login/register";
import Dashboard from "./pages/dashboard/Dashboard";
import VideoPage from "./pages/dashboard/VideoPage";
import AdminDashboard from "./pages/Admin/adminDashboard";
import UserDashboard from "./pages/user/userDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LayoutWrapper from "./components/LayoutWrapper";

const App = () => {
  return (
    <LayoutWrapper>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["viewer"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute allowedRoles={["editor"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/video/:id" element={<VideoPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </LayoutWrapper>
  );
};

export default App;
