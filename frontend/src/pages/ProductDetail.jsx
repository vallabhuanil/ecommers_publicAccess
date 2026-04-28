import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Package, ChevronLeft, Send } from 'lucide-react';
import api from '../api/axiosClient';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { StarRating } from '../components/ProductCard';
import { DetailSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { token, role } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`),
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data.data);
      // reviews response is Page<ReviewResponse> → extract .content
      setReviews(rRes.data.data?.content || rRes.data.data || []);
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!token) { navigate('/login'); return; }
    await addToCart(product.id, qty);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // POST /reviews with productId in body
      const res = await api.post('/reviews', { productId: Number(id), ...review });
      setReviews(prev => [res.data.data, ...prev]);
      setReview({ rating: 5, comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
        <ChevronLeft size={16} /> Back
      </button>

      {/* Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <div className="rounded-2xl overflow-hidden bg-surface-card border border-surface-border h-[420px]">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-600"><Package size={80} /></div>
          }
        </div>

        <div className="flex flex-col justify-center space-y-5">
          {product.categoryName && (
            <span className="badge bg-primary-600/20 text-primary-400 border border-primary-500/30 w-fit">
              {product.categoryName}
            </span>
          )}
          <h1 className="text-3xl font-bold text-white">{product.name}</h1>

          {product.averageRating != null && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.averageRating} size={18} />
              <span className="text-gray-400 text-sm">({product.reviewCount} reviews)</span>
            </div>
          )}

          <p className="text-gray-400 leading-relaxed">{product.description}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary-400">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
          </div>

          <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>

          {product.stock > 0 && role !== 'ADMIN' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-surface-border rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-400 hover:text-white hover:bg-surface-border transition-colors">−</button>
                <span className="px-4 py-2 text-white font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-gray-400 hover:text-white hover:bg-surface-border transition-colors">+</button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-surface-border pb-3">
          Customer Reviews
        </h2>

        {token && role === 'USER' && (
          <form onSubmit={handleReview} className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-200">Write a Review</h3>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))}>
                  <Star size={22}
                    className={n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
                  />
                </button>
              ))}
            </div>
            <textarea
              required rows={3} className="input resize-none"
              placeholder="Share your experience…"
              value={review.comment}
              onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
            />
            <button type="submit" disabled={submitting} className="btn-primary w-fit">
              <Send size={15} /> {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0
          ? <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
          : reviews.map(r => (
            <div key={r.id} className="card p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                    {r.userName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-300 font-medium text-sm">{r.userName}</span>
                </div>
                <StarRating rating={r.rating} size={13} />
              </div>
              <p className="text-gray-400 text-sm">{r.comment}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}
