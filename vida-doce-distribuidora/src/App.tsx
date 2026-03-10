import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  LogIn, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Candy,
  Package,
  X,
  Save,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, AuthState } from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: localStorage.getItem('adminToken') !== null,
    token: localStorage.getItem('adminToken')
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    code: '',
    price: 0,
    category_id: 1,
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData);
      setCategories(catData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setAuth({ isLoggedIn: true, token: data.token });
        localStorage.setItem('adminToken', data.token);
        setShowLoginModal(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erro ao fazer login');
    }
  };

  const handleLogout = () => {
    setAuth({ isLoggedIn: false, token: null });
    localStorage.removeItem('adminToken');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        fetchData();
        setShowProductModal(false);
        setEditingProduct(null);
        setProductForm({ name: '', code: '', price: 0, category_id: 1, image_url: '' });
      }
    } catch (error) {
      alert('Erro ao salvar produto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      alert('Erro ao excluir produto');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 candy-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                <Candy size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900 leading-none">VIDA DOCE</h1>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Distribuidora</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`text-sm font-medium transition-colors ${!selectedCategory ? 'text-primary' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'text-primary' : 'text-stone-500 hover:text-stone-900'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {auth.isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', code: '', price: 0, category_id: 1, image_url: '' });
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-md"
                  >
                    <Plus size={16} /> Novo Produto
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-stone-500 hover:text-red-500 transition-colors"
                    title="Sair"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 text-stone-600 hover:text-primary transition-colors font-medium text-sm"
                >
                  <LogIn size={18} /> Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Search */}
      <section className="bg-stone-100 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif italic text-stone-900"
          >
            O sabor da felicidade em cada detalhe.
          </motion.h2>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Mobile Categories */}
      <div className="md:hidden flex overflow-x-auto py-4 px-4 gap-2 no-scrollbar border-b border-stone-100">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${!selectedCategory ? 'bg-primary text-white shadow-md' : 'bg-stone-200 text-stone-600'}`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-stone-200 text-stone-600'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold text-stone-900">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Todos os Produtos'}
            </h3>
            <p className="text-stone-500 text-sm">{filteredProducts.length} itens encontrados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-stone-50 relative">
                  <img 
                    src={product.image_url || 'https://picsum.photos/seed/candy/400/400'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-stone-500 uppercase tracking-tight shadow-sm border border-stone-100">
                      Cód: {product.code}
                    </span>
                  </div>
                  {auth.isLoggedIn && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm(product);
                          setShowProductModal(true);
                        }}
                        className="p-2 bg-white/90 backdrop-blur rounded-full text-stone-600 hover:text-primary shadow-sm border border-stone-100 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 bg-white/90 backdrop-blur rounded-full text-stone-600 hover:text-red-500 shadow-sm border border-stone-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{product.category_name}</p>
                  <h4 className="text-lg font-semibold text-stone-900 mb-4 line-clamp-2 min-h-[3.5rem] leading-tight">
                    {product.name}
                  </h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">Preço Unitário</p>
                      <p className="text-2xl font-bold text-stone-900">
                        <span className="text-sm font-medium mr-1">R$</span>
                        {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 candy-gradient rounded-lg flex items-center justify-center text-white">
                <Candy size={18} />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">VIDA DOCE</h1>
            </div>
            <p className="text-sm leading-relaxed">
              Sua distribuidora de confiança para balas, doces e bomboniere. 
              Qualidade e preço justo para o seu negócio.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Categorias</h5>
            <ul className="space-y-2 text-sm">
              {categories.map(cat => (
                <li key={cat.id}>
                  <button onClick={() => setSelectedCategory(cat.id)} className="hover:text-white transition-colors">
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Contato</h5>
            <p className="text-sm">Atendimento exclusivo para revendedores e lojistas.</p>
            <p className="text-sm mt-2 font-bold text-white">vidadocedistribuidora@email.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-stone-800 text-center text-[10px] uppercase tracking-[0.2em]">
          © 2024 Vida Doce Distribuidora • Todos os direitos reservados
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
              >
                <X size={24} />
              </button>
              <div className="text-center mb-8">
                <div className="w-16 h-16 candy-gradient rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                  <LogIn size={32} />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">Acesso Restrito</h3>
                <p className="text-stone-500 text-sm">Entre com suas credenciais de administrador</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">E-mail</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Senha</label>
                  <input 
                    type="password" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all shadow-lg"
                >
                  Entrar no Sistema
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal (Add/Edit) */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProductModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowProductModal(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
              >
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Nome do Produto</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Código</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      value={productForm.code}
                      onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Preço (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Categoria</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({...productForm, category_id: parseInt(e.target.value)})}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">URL da Imagem</label>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Save size={20} /> Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
