import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

export default function Cart() {
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="card p-4 flex gap-4">
            <div className="skeleton w-20 h-20 rounded-xl" />
            <div className="flex-1 space-y-2 py-1">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <ShoppingBag size={24} className="text-primary-400" /> Shopping Cart
        {items.length > 0 && (
          <span className="text-base font-normal text-gray-400">({items.length} item{items.length > 1 ? 's' : ''})</span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <Package size={60} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg mb-2">Your cart is empty</p>
          <p className="text-gray-600 text-sm mb-6">Add some products to get started</p>
          <Link to="/" className="btn-primary w-fit mx-auto">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 animate-fadeIn">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-600"><Package size={28} /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-100 font-medium truncate">{item.productName}</h3>
                  <p className="text-primary-400 font-bold mt-0.5">₹{item.price?.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-surface-border rounded-lg overflow-hidden text-sm">
                      <button
                        onClick={() => item.quantity > 1 ? updateItem(item.productId, item.quantity - 1) : removeItem(item.productId)}
                        className="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-surface-border transition-colors">
                        −
                      </button>
                      <span className="px-3 py-1 text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.productId, item.quantity + 1)}
                        className="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-surface-border transition-colors">
                        +
                      </button>
                    </div>
                    <span className="text-gray-500 text-sm">
                      = ₹{item.subtotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.productId)}
                  className="text-gray-600 hover:text-red-400 transition-colors self-start p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card p-5 h-fit space-y-4 sticky top-24">
            <h2 className="font-semibold text-gray-200 text-lg">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-gray-400">
                  <span className="truncate pr-2">{item.productName} ×{item.quantity}</span>
                  <span className="flex-shrink-0">₹{item.subtotal?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border pt-3">
              <div className="flex justify-between font-bold text-white text-lg">
                <span>Total</span>
                <span className="text-primary-400">₹{cart?.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full">
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
