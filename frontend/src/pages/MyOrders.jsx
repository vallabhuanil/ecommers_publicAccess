import { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import api from '../api/axiosClient';
import { OrderSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PENDING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PAID:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SHIPPED:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function OrderCard({ order, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const canCancel = order.status === 'PENDING' || order.status === 'PAID';

  return (
    <div className="card overflow-hidden animate-fadeIn">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-primary-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Order #{order.id}</p>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
            {order.paymentId && (
              <p className="text-xs text-gray-600 mt-0.5">Payment: {order.paymentId}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-primary-400 font-bold text-lg">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
          <span className={`badge border ${STATUS_COLORS[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
            {order.status}
          </span>
          {canCancel && (
            <button onClick={() => onCancel(order.id)}
              className="btn-danger text-xs py-1.5 px-3">
              <XCircle size={13} /> Cancel
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border px-5 py-4 space-y-3 bg-surface/40">
          {order.items?.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-gray-600" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 text-sm font-medium truncate">{item.productName}</p>
                <p className="text-gray-500 text-xs">×{item.quantity} @ ₹{item.price?.toLocaleString('en-IN')}</p>
              </div>
              <span className="text-gray-300 text-sm font-medium">
                ₹{item.subtotal?.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Package size={24} className="text-primary-400" /> My Orders
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-16 text-center">
          <Package size={56} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">No orders yet</p>
          <p className="text-gray-600 text-sm mt-1">Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <OrderCard key={o.id} order={o} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}
