import { create } from 'zustand';
import api from '../api/axiosClient';
import toast from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      set({ cart: res.data.data });
    } catch {
      set({ cart: null });
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const res = await api.post('/cart', { productId, quantity });
      set({ cart: res.data.data });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      const res = await api.put(`/cart/${productId}`, null, { params: { quantity } });
      set({ cart: res.data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await api.delete(`/cart/${productId}`);
      set({ cart: res.data.data });
      toast.success('Item removed');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  },

  clearLocalCart: () => set({ cart: null }),
  itemCount: () => get().cart?.itemCount || 0,
}));
