import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout } from "../redux/authSlice";
import type { AppDispatch, RootState } from "../redux/store";

interface LayoutWrapperProps {
  children: ReactNode;
}

const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="relative min-h-screen">
      {isAuthenticated && !isAuthPage && (
        <button
          onClick={handleLogout}
          className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      )}
      {children}
    </div>
  );
};

export default LayoutWrapper;
