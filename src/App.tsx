import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  List as ListIcon,
  Upload,
  Image as ImageIcon
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProductForm(prev => ({ ...prev, image_url: data.url }));
      }
    } catch (error) {
      alert('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Blobs */}
      <div className="blob-bg">
        <div className="blob w-[500px] h-[500px] bg-sweet-pink/30 -top-20 -left-20 animate-pulse" />
        <div className="blob w-[400px] h-[400px] bg-sweet-yellow/20 top-1/2 -right-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="blob w-[300px] h-[300px] bg-accent/20 bottom-0 left-1/4 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
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
                className={`text-sm font-bold uppercase tracking-wider transition-all ${!selectedCategory ? 'text-primary border-b-2 border-primary pb-1' : 'text-stone-500 hover:text-stone-900'}`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-sm font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.id ? 'text-primary border-b-2 border-primary pb-1' : 'text-stone-500 hover:text-stone-900'}`}
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
                  className="flex items-center gap-2 text-stone-600 hover:text-primary transition-colors font-medium text-sm bg-white/50 px-4 py-2 rounded-full border border-white/20 shadow-sm"
                >
                  <LogIn size={18} /> Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Search */}
      <section className="py-16 px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-sweet-pink/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4"
          >
            Qualidade & Tradição
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif italic text-stone-900 leading-tight"
          >
            O sabor da felicidade <br />
            <span className="text-primary">em cada detalhe.</span>
          </motion.h2>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
            <input 
              type="text" 
              placeholder="O que você está procurando hoje?"
              className="w-full pl-16 pr-6 py-6 bg-white/80 backdrop-blur-md rounded-3xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-xl text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Mobile Categories */}
      <div className="md:hidden flex overflow-x-auto py-4 px-4 gap-2 no-scrollbar border-b border-stone-100 bg-white/30 backdrop-blur-sm">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${!selectedCategory ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white/50 text-stone-600 border border-white/20'}`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white/50 text-stone-600 border border-white/20'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h3 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Catálogo Completo'}
              <span className="text-sm font-normal text-stone-400 bg-stone-100 px-3 py-1 rounded-full">{filteredProducts.length}</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white/60 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-white/40 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="aspect-square overflow-hidden bg-stone-50 relative">
                  <img 
                    src={product.image_url || 'https://picsum.photos/seed/candy/400/400'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-stone-600 uppercase tracking-widest shadow-sm border border-white/20">
                      #{product.code}
                    </span>
                  </div>
                  {auth.isLoggedIn && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm(product);
                          setShowProductModal(true);
                        }}
                        className="p-3 bg-white/90 backdrop-blur rounded-2xl text-stone-600 hover:text-primary shadow-lg border border-white/20 transition-all hover:scale-110"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-3 bg-white/90 backdrop-blur rounded-2xl text-stone-600 hover:text-red-500 shadow-lg border border-white/20 transition-all hover:scale-110"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{product.category_name}</p>
                  </div>
                  <h4 className="text-xl font-bold text-stone-900 mb-6 line-clamp-2 min-h-[3.5rem] leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex justify-between items-center bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-0.5">Valor Unitário</p>
                      <p className="text-2xl font-black text-stone-900">
                        <span className="text-sm font-bold mr-1 text-primary">R$</span>
                        {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-stone-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:rotate-12">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-20 px-4 mt-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 candy-gradient" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
          <div className="space-y-6 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 candy-gradient rounded-2xl flex items-center justify-center text-white shadow-xl">
                <Candy size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">VIDA DOCE</h1>
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Distribuidora</p>
              </div>
            </div>
            <p className="text-base leading-relaxed max-w-md">
              Transformando momentos simples em experiências inesquecíveis. 
              Somos a maior distribuidora de bomboniere da região, levando doçura 
              para o seu negócio com qualidade e compromisso.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">Navegação</h5>
            <ul className="space-y-4 text-sm">
              <li>
                <button onClick={() => setSelectedCategory(null)} className="hover:text-primary transition-colors flex items-center gap-2">
                  <ChevronRight size={14} /> Todos os Produtos
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <button onClick={() => setSelectedCategory(cat.id)} className="hover:text-primary transition-colors flex items-center gap-2">
                    <ChevronRight size={14} /> {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">Contato Direto</h5>
            <div className="space-y-4">
              <p className="text-sm">Fale com nosso time comercial:</p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-1">E-mail</p>
                <p className="text-sm font-bold text-white">vidadocedistribuidora@email.com</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-stone-500 uppercase font-bold tracking-widest mb-1">Localização</p>
                <p className="text-sm font-bold text-white">Atendimento em toda a região</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 text-center text-[10px] uppercase tracking-[0.4em] font-bold">
          © 2024 Vida Doce Distribuidora • Criado com Amor & Açúcar
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
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 candy-gradient" />
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={28} />
              </button>
              <div className="text-center mb-10">
                <div className="w-20 h-20 candy-gradient rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl rotate-3">
                  <LogIn size={40} />
                </div>
                <h3 className="text-3xl font-black text-stone-900 mb-2">Painel Admin</h3>
                <p className="text-stone-500 text-sm font-medium">Área restrita para gerenciamento</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">E-mail Corporativo</label>
                  <input 
                    type="email" 
                    required
                    placeholder="admin@vidadoce.com.br"
                    className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Senha de Acesso</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-lg hover:bg-stone-800 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]"
                >
                  Acessar Sistema
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
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[3rem] p-10 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-2 candy-gradient" />
              <button 
                onClick={() => setShowProductModal(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={28} />
              </button>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900">
                  {editingProduct ? <Edit2 size={28} /> : <Plus size={28} />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-stone-900">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <p className="text-stone-500 text-sm font-medium">Preencha os detalhes do item abaixo</p>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Nome do Produto</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Bala de Goma 500g"
                      className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Código</label>
                      <input 
                        type="text" 
                        required
                        placeholder="00.000"
                        className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50"
                        value={productForm.code}
                        onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Preço (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0,00"
                        className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Categoria</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl border border-stone-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-stone-50 appearance-none"
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({...productForm, category_id: parseInt(e.target.value)})}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 ml-1">Imagem do Produto</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative aspect-video rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                    >
                      {productForm.image_url ? (
                        <>
                          <img 
                            src={productForm.image_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2">
                            <Upload size={20} /> Alterar Foto
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2 p-6">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-stone-400 mx-auto group-hover:text-primary transition-colors">
                            <Upload size={24} />
                          </div>
                          <p className="text-sm font-bold text-stone-500 group-hover:text-primary">Clique para fazer upload</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest">PNG, JPG ou WEBP</p>
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={24} /> {editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}
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
