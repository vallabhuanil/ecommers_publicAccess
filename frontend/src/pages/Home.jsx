import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axiosClient';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeletons';
import Pagination from '../components/Pagination';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      if (categoryId) params.categoryId = categoryId;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/products', { params });
      setProducts(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Discover <span className="text-primary-500">Premium</span> Products
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Shop the latest collection with seamless checkout and fast delivery.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input pl-9"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-500" />
          <select
            className="input w-auto min-w-[160px]"
            value={categoryId}
            onChange={e => { setCategoryId(e.target.value); setPage(0); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
            ? products.map(p => <ProductCard key={p.id} product={p} />)
            : (
              <div className="col-span-full text-center py-20 text-gray-500">
                <Search size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">No products found.</p>
              </div>
            )
        }
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
