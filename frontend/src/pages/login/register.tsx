import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  ArrowRight,
  ChevronDown,
  Loader,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { registerUser } from "../../redux/authSlice";

enum UserRole {
  Admin = "admin",
  Editor = "editor",
  Viewer = "viewer",
}

interface FormData {
  email: string;
  password: string;
  role: UserRole;
}

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    role: UserRole.Viewer,
  });

  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin-dashboard");
      else if (user.role === "editor") navigate("/user-dashboard");
      else navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Create Account
          </h2>
          <p className="text-zinc-400 text-sm">
            Join us and start your journey today
          </p>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 text-red-200 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-1 focus:ring-white focus:border-white outline-none placeholder-zinc-600"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-1 focus:ring-white focus:border-white outline-none placeholder-zinc-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 ml-1">
                Select Role
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-1 focus:ring-white focus:border-white outline-none appearance-none cursor-pointer"
                >
                  <option
                    value={UserRole.Admin}
                    className="bg-zinc-900 text-white"
                  >
                    Admin
                  </option>
                  <option
                    value={UserRole.Editor}
                    className="bg-zinc-900 text-white"
                  >
                    Editor
                  </option>
                  <option
                    value={UserRole.Viewer}
                    className="bg-zinc-900 text-white"
                  >
                    Viewer
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </div>
              </div>
              <p className="text-xs text-zinc-500 ml-1">
                * Determines your access level within the application.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-white hover:text-zinc-300 font-medium transition-colors hover:underline underline-offset-4 cursor-pointer"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
