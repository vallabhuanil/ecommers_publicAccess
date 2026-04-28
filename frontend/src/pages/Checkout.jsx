import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';
import { useCartStore } from '../stores/cartStore';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, fetchCart, clearLocalCart } = useCartStore();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | success | error

  useEffect(() => { fetchCart(); }, []);

  const items = cart?.items || [];

  const handlePlaceAndPay = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    setPlacingOrder(true);
    try {
      // 1. Place order
      const orderRes = await api.post('/orders');
      const orderId = orderRes.data.data.id;

      // 2. Create Razorpay order
      const payRes = await api.post(`/payment/create-order/${orderId}`);
      const { razorpayOrderId, amount, currency, keyId } = payRes.data.data;

      // 3. Open Razorpay modal
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'ShopEase',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: String(orderId),
            });
            clearLocalCart();
            setStatus('success');
            setPayingOrderId(orderId);
          } catch {
            toast.error('Payment verification failed');
            setStatus('error');
          }
        },
        prefill: {},
        theme: { color: '#3b5bdb' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. Your order is saved as PENDING.', { icon: 'ℹ️' });
            navigate('/orders');
          },
        },
      };

      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay SDK not loaded. Check your internet connection.');
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="card p-12 text-center max-w-md w-full animate-fadeIn">
          <CheckCircle2 size={64} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-400 mb-6">Order #{payingOrderId} is confirmed.</p>
          <button onClick={() => navigate('/orders')} className="btn-primary w-full">
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <CreditCard size={24} className="text-primary-400" /> Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-200">Order Items</h2>
          {items.length === 0
            ? <p className="text-gray-500 text-sm">Your cart is empty.</p>
            : items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-gray-600" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-gray-500 text-xs">×{item.quantity}</p>
                </div>
                <span className="text-primary-400 text-sm font-bold">
                  ₹{item.subtotal?.toLocaleString('en-IN')}
                </span>
              </div>
            ))
          }
        </div>

        {/* Summary & Pay */}
        <div className="card p-5 space-y-4 h-fit">
          <h2 className="font-semibold text-gray-200">Payment Summary</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{cart?.total?.toLocaleString('en-IN') || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-400">Free</span>
            </div>
          </div>
          <div className="border-t border-surface-border pt-3">
            <div className="flex justify-between font-bold text-white text-lg">
              <span>Total</span>
              <span className="text-primary-400">₹{cart?.total?.toLocaleString('en-IN') || 0}</span>
            </div>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle size={16} /> Payment failed. Please try again.
            </div>
          )}

          <button
            onClick={handlePlaceAndPay}
            disabled={placingOrder || items.length === 0}
            className="btn-primary w-full"
          >
            <CreditCard size={18} />
            {placingOrder ? 'Processing…' : 'Place Order & Pay'}
          </button>
          <p className="text-xs text-gray-600 text-center">Secured by Razorpay</p>
        </div>
      </div>
    </div>
  );
}
