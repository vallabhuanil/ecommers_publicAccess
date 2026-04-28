import { useEffect, useState } from 'react';
import { ShoppingBag, ChevronDown, Package } from 'lucide-react';
import api from '../../api/axiosClient';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PAID:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SHIPPED:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function StatusSelect({ orderId, current, onUpdated }) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === current) return;
    setUpdating(true);
    try {
      // Backend: PUT /orders/:id/status?status=SHIPPED (not /admin/orders)
      await api.put(`/orders/${orderId}/status`, null, { params: { status: newStatus } });
      toast.success(`Order #${orderId} → ${newStatus}`);
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={current}
        onChange={handleChange}
        disabled={updating}
        className={`text-xs font-semibold rounded-full px-3 py-1 border appearance-none pr-6 cursor-pointer
          focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-60
          ${STATUS_COLORS[current] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s} className="bg-surface-card text-gray-200">{s}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
    </div>
  );
}

function OrderRow({ order, onUpdated }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-surface/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-5 py-3 text-gray-200 font-medium">#{order.id}</td>
        <td className="px-5 py-3 text-gray-400 hidden sm:table-cell">
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </td>
        <td className="px-5 py-3 text-right">
          <span className="text-primary-400 font-bold">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
        </td>
        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end">
            <StatusSelect orderId={order.id} current={order.status} onUpdated={onUpdated} />
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-surface/40">
          <td colSpan={4} className="px-5 pb-4 pt-2">
            <div className="space-y-2">
              {order.paymentId && (
                <p className="text-xs text-gray-500">
                  Payment ID: <span className="text-gray-400">{order.paymentId}</span>
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {order.items?.map(item => (
                  <div key={item.id}
                    className="flex items-center gap-3 bg-surface border border-surface-border rounded-xl px-3 py-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-card flex-shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Package size={14} className="text-gray-600" />
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-xs font-medium truncate">{item.productName}</p>
                      <p className="text-gray-600 text-xs">×{item.quantity}</p>
                    </div>
                    <span className="text-gray-400 text-xs">₹{item.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?page=${page}&size=15`);
      setOrders(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag size={24} className="text-primary-400" /> All Orders
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Click a row to expand order items. Update status inline.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-surface-border text-gray-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Order ID</th>
              <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Date</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4].map(j => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : orders.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-gray-500">
                      <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                      No orders found.
                    </td>
                  </tr>
                )
                : orders.map(o => (
                  <OrderRow key={o.id} order={o} onUpdated={fetchOrders} />
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
