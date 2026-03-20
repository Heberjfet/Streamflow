import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { LogOut, User, Shield, Home, Play, Settings } from "lucide-react";

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-emerald-400">
                StreamFlow
              </Link>

              <div className="flex items-center gap-6">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Inicio</span>
                </Link>

                <Link
                  to="/catalog"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Catálogo</span>
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span>{user?.username || user?.email}</span>
                {user?.role === "admin" && (
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
