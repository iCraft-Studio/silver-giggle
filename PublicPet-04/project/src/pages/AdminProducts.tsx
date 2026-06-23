import React, { useState, useEffect } from 'react';
import { Package, Search, Trash2, ShieldAlert, Eye, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AdminProduct = {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  views: number;
  created_at: string;
  seller_id: string;
  seller?: { full_name: string };
};

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, category, image_url, is_available, views, created_at, seller_id,
          seller:users!products_seller_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map(d => ({
          ...d,
          seller: Array.isArray(d.seller) ? d.seller[0] : d.seller,
        }));
        setProducts(formatted as AdminProduct[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    setDeletingId(id);
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert("Failed to delete product.");
    }
    setDeletingId(null);
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.seller?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Platform Products</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Manage global inventory and enforce marketplace rules.</p>
        </div>
        
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by title or seller..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-white border border-gray-200 focus:border-indigo-600 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-5">Product Details</th>
                <th className="p-5">Seller Info</th>
                <th className="p-5">Metrics</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-gray-400 m-auto mt-3" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.title}</p>
                        <p className="text-xs font-bold text-indigo-600 mt-0.5">${product.price.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-sm font-semibold text-gray-900">{product.seller?.full_name}</p>
                      <p className="font-mono text-[10px] text-gray-400 mt-1">{product.seller_id.split('-')[0]}...</p>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-500">
                        <Eye size={14} /> <span>{product.views || 0}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(product.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        product.is_available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {product.is_available ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove Listing"
                      >
                        {deletingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};