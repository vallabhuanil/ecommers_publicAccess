import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';

export function StarRating({ rating, max = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();
  const { token, role } = useAuthStore();

  return (
    <div className="card group overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-900/20 animate-fadeIn">
      <Link to={`/products/${product.id}`}>
        <div className="relative overflow-hidden h-48 bg-surface">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <ShoppingCart size={40} />
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Out of Stock</span>
            </div>
          )}
          {product.categoryName && (
            <span className="absolute top-2 left-2 badge bg-primary-600/80 text-white text-[10px]">
              {product.categoryName}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-100 truncate hover:text-primary-400 transition-colors">{product.name}</h3>
        </Link>

        {product.averageRating != null && (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={product.averageRating} />
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary-400">₹{product.price?.toLocaleString('en-IN')}</span>
          {token && role === 'USER' && product.stock > 0 && (
            <button
              onClick={() => addToCart(product.id)}
              className="p-2 bg-primary-600/20 hover:bg-primary-600 border border-primary-500/30 hover:border-primary-600 rounded-xl transition-all duration-200 text-primary-400 hover:text-white"
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
