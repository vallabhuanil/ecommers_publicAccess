import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Shield, LogOut, Package } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useEffect } from 'react';

export default function Navbar() {
  const { user, role, logout, token } = useAuthStore();
  const { fetchCart, itemCount } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && role === 'USER') fetchCart();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const count = useCartStore((s) => s.cart?.itemCount || 0);

  return (
    <nav className="sticky top-0 z-50 bg-surface-card/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/50">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Shop<span className="text-primary-500">Ease</span></span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              {role === 'USER' && (
                <Link to="/cart" className="relative p-2 hover:bg-surface-border rounded-xl transition-colors">
                  <ShoppingCart size={20} className="text-gray-300" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {count}
                    </span>
                  )}
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400 text-sm font-medium hover:bg-primary-600/30 transition-colors">
                  <Shield size={14} /> Admin
                </Link>
              )}
              <Link to="/orders" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">Orders</Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-xl border border-surface-border">
                <User size={14} className="text-primary-400" />
                <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-gray-400 hover:text-red-400">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
