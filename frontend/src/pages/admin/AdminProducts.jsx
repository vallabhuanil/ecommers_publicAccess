import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Package, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', categoryId: '' };

/* ───────────────────────────── Category Manager ───────────────────────────── */
function CategoryManager({ categories, onCategoriesChanged, forceOpen, onForceOpenConsumed }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      onForceOpenConsumed?.();
    }
  }, [forceOpen]);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await api.post('/categories', null, { params: { name } });
      toast.success(`Category "${name}" created`);
      setNewName('');
      onCategoriesChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will be unassigned.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success(`Category "${name}" deleted`);
      onCategoriesChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="card mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-primary-400" />
          <span className="font-semibold text-white">Category Manager</span>
          <span className="ml-2 text-xs bg-primary-600/30 text-primary-300 px-2 py-0.5 rounded-full">
            {categories.length} categories
          </span>
        </div>
        {open ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </button>

      {open && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4">
          {/* Add new category */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="New category name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <button type="submit" disabled={adding} className="btn-primary px-4 whitespace-nowrap">
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </form>

          {/* Existing categories */}
          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No categories yet — add one above to start assigning products.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-gray-200"
                >
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-1"
                    title="Delete category"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Product Modal ───────────────────────────── */
function ProductModal({ product, categories, onClose, onSaved, onNeedCategory }) {
  const [form, setForm] = useState(
    product
      ? { name: product.name, description: product.description, price: product.price,
          stock: product.stock, categoryId: String(product.categoryId || '') }
      : EMPTY_FORM
  );
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(product?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description || '');
      fd.append('price', form.price);
      fd.append('stock', form.stock);
      fd.append('categoryId', form.categoryId);
      if (image) fd.append('image', image);

      if (product) {
        await api.put(`/products/${product.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated');
      } else {
        await api.post('/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        const msgs = Object.values(data.data).join(', ');
        toast.error(msgs);
      } else {
        toast.error(data?.message || 'Failed to save product');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6 shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-surface-border rounded-2xl h-36 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors overflow-hidden relative"
          >
            {preview
              ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
              : <>
                  <Upload size={28} className="text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">Click to upload image</p>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Product Name *</label>
              <input required className="input" placeholder="Product name"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Price (₹) *</label>
              <input required type="number" min="0" step="0.01" className="input"
                placeholder="0.00" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock *</label>
              <input required type="number" min="0" className="input"
                placeholder="0" value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Category *</label>
              {categories.length === 0 ? (
                <div className="input flex items-center justify-between text-gray-500 cursor-default">
                  <span className="text-sm">No categories available</span>
                  <button
                    type="button"
                    onClick={onNeedCategory}
                    className="text-primary-400 text-xs hover:underline"
                  >
                    Create one ↗
                  </button>
                </div>
              ) : (
                <select required className="input" value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— Select a category —</option>
                  {categories.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea rows={3} className="input resize-none" placeholder="Product description…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || categories.length === 0} className="btn-primary flex-1">
              {saving ? 'Saving…' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────────── Main Page ───────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catError, setCatError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modal, setModal] = useState(null); // null | 'add' | product object
  const [catOpen, setCatOpen] = useState(false); // force-open category manager

  const fetchCategories = async () => {
    try {
      const r = await api.get('/categories');
      setCategories(r.data.data || []);
      setCatError(false);
    } catch {
      setCatError(true);
      toast.error('Could not load categories. Is the backend running?');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?page=${page}&size=10`);
      setProducts(res.data.data.content || []);
      setTotalPages(res.data.data.totalPages || 0);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page]);
  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Called from modal when there are no categories
  const handleNeedCategory = () => {
    setModal(null);
    setCatOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your product catalogue</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* ── Category Manager (always visible for admin) ── */}
      <CategoryManager
        categories={categories}
        onCategoriesChanged={fetchCategories}
        forceOpen={catOpen}
        onForceOpenConsumed={() => setCatOpen(false)}
      />

      {catError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          ⚠️ Failed to load categories. Make sure the backend is running, then{' '}
          <button onClick={fetchCategories} className="underline hover:text-red-300">retry</button>.
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-surface-border text-gray-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Category</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3 text-right font-medium hidden md:table-cell">Stock</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-5 py-4">
                        <div className="skeleton h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : products.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-gray-500">
                      <Package size={40} className="mx-auto mb-3 opacity-30" />
                      No products yet.
                    </td>
                  </tr>
                )
                : products.map(p => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors animate-fadeIn">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-gray-600" /></div>
                          }
                        </div>
                        <span className="text-gray-200 font-medium truncate max-w-[180px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                      {p.categoryName || '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-primary-400 font-semibold">
                      ₹{p.price?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right hidden md:table-cell">
                      <span className={p.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal(p)}
                          className="p-1.5 text-gray-500 hover:text-primary-400 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts(); }}
          onNeedCategory={handleNeedCategory}
        />
      )}
    </div>
  );
}
