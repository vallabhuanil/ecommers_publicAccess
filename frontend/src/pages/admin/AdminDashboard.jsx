import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, TrendingUp, Users, ArrowRight } from 'lucide-react';
import api from '../../api/axiosClient';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className="card p-6 flex items-center gap-5 hover:border-primary-500/50 transition-all duration-200 hover:-translate-y-0.5 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={26} />
      </div>
      <div className="flex-1">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white mt-0.5">{value ?? '—'}</p>
      </div>
      <ArrowRight size={18} className="text-gray-600 group-hover:text-primary-400 transition-colors" />
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders?page=0&size=5'),
      api.get('/products?page=0&size=1'),
    ]).then(([ordRes, prodRes]) => {
      const orders = ordRes.data.data;
      const revenue = orders.content?.reduce((sum, o) =>
        o.status !== 'CANCELLED' ? sum + (o.totalAmount || 0) : sum, 0) || 0;
      setStats({
        orders: orders.totalElements || 0,
        products: prodRes.data.data.totalElements || 0,
        revenue,
      });
      setRecentOrders(orders.content || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = {
    PENDING:   'bg-yellow-500/20 text-yellow-400',
    PAID:      'bg-blue-500/20 text-blue-400',
    SHIPPED:   'bg-purple-500/20 text-purple-400',
    DELIVERED: 'bg-green-500/20 text-green-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your store</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.orders}
          color="bg-blue-500/20 text-blue-400" to="/admin/orders" />
        <StatCard icon={Package} label="Total Products" value={stats.products}
          color="bg-purple-500/20 text-purple-400" to="/admin/products" />
        <StatCard icon={TrendingUp} label="Revenue (₹)"
          value={stats.revenue.toLocaleString('en-IN')}
          color="bg-green-500/20 text-green-400" to="/admin/orders" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link to="/admin/products"
          className="card p-5 flex items-center gap-4 hover:border-primary-500/50 transition-all duration-200 group">
          <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
            <Package size={22} className="text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Manage Products</p>
            <p className="text-gray-500 text-sm">Add, edit or delete products</p>
          </div>
          <ArrowRight size={16} className="text-gray-600 group-hover:text-primary-400 ml-auto transition-colors" />
        </Link>
        <Link to="/admin/orders"
          className="card p-5 flex items-center gap-4 hover:border-primary-500/50 transition-all duration-200 group">
          <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
            <ShoppingBag size={22} className="text-primary-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Manage Orders</p>
            <p className="text-gray-500 text-sm">View and update order status</p>
          </div>
          <ArrowRight size={16} className="text-gray-600 group-hover:text-primary-400 ml-auto transition-colors" />
        </Link>
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Orders</h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <div className="card overflow-hidden divide-y divide-surface-border">
            {recentOrders.map(o => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-white font-medium">Order #{o.id}</span>
                  <span className="text-gray-500 text-sm ml-3">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-400 font-semibold">
                    ₹{o.totalAmount?.toLocaleString('en-IN')}
                  </span>
                  <span className={`badge ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
