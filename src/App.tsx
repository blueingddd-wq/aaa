/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Coffee, Settings, ChevronRight, X, Plus, Minus, Check, Lock, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { MenuItem, Order, OrderStatus, OrderItem, AdminSettings } from './types';
import { cn } from './lib/utils';
import { INITIAL_MENU, ICE_LEVELS, SUGAR_LEVELS } from './constants';

// --- Components ---

const Header = ({ onAdminClick, showAdminIcon = true }: { onAdminClick: () => void, showAdminIcon?: boolean }) => (
  <header className="flex items-center justify-between p-6 bg-white border-b border-gray-100 sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-amber-900 rounded-full flex items-center justify-center text-white">
        <Coffee size={20} />
      </div>
      <div>
        <h1 className="font-sans font-bold text-xl tracking-tight text-gray-900">KEBUKE</h1>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium leading-none">Tea Order System</p>
      </div>
    </div>
    {showAdminIcon && (
      <button 
        id="admin-btn"
        onClick={onAdminClick}
        className="p-2 text-gray-400 hover:text-amber-900 transition-colors"
      >
        <Settings size={20} />
      </button>
    )}
  </header>
);

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

const MenuItemCard = ({ item, onAdd }: MenuItemCardProps) => (
  <div 
    id={`item-${item.id}`}
    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center group hover:border-amber-900/20 transition-all cursor-pointer"
    onClick={() => onAdd(item)}
  >
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full font-medium">{item.category}</span>
        <h3 className="font-medium text-gray-900">{item.name}</h3>
      </div>
      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
      <div className="mt-2 flex gap-3">
        <span className="text-sm font-mono font-medium text-gray-900">M: ${item.priceM}</span>
        <span className="text-sm font-mono font-medium text-gray-900">L: ${item.priceL}</span>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-amber-900 group-hover:text-white transition-all">
      <Plus size={18} />
    </div>
  </div>
);

const SelectionModal = ({ item, onClose, onConfirm }: { item: MenuItem, onClose: () => void, onConfirm: (orderItem: OrderItem) => void }) => {
  const [size, setSize] = useState<'M' | 'L'>('M');
  const [ice, setIce] = useState(ICE_LEVELS[1]);
  const [sugar, setSugar] = useState(SUGAR_LEVELS[2]);
  const [quantity, setQuantity] = useState(1);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <button id="close-modal" onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
          </div>

          <div className="space-y-6">
            {/* Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">規格 Size</label>
              <div className="grid grid-cols-2 gap-3">
                {(['M', 'L'] as const).map(s => (
                  <button
                    key={s}
                    id={`size-${s}`}
                    onClick={() => setSize(s)}
                    className={cn(
                      "py-3 rounded-xl border-2 transition-all font-medium flex justify-between px-4 items-center",
                      size === s ? "border-amber-900 bg-amber-50 text-amber-900" : "border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    <span>{s === 'M' ? '中杯' : '大杯'} {s}</span>
                    <span className="font-mono">${s === 'M' ? item.priceM : item.priceL}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ice */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">冷熱 Ice</label>
              <div className="flex flex-wrap gap-2">
                {ICE_LEVELS.map(i => (
                  <button
                    key={i}
                    onClick={() => setIce(i)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm border-2 transition-all",
                      ice === i ? "border-amber-900 bg-amber-900 text-white" : "border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">甜度 Sugar</label>
              <div className="flex flex-wrap gap-2">
                {SUGAR_LEVELS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSugar(s)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm border-2 transition-all",
                      sugar === s ? "border-amber-900 bg-amber-900 text-white" : "border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 bg-gray-100 rounded-full px-4 py-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-500"><Minus size={18} /></button>
                <span className="font-mono font-bold w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-gray-500"><Plus size={18} /></button>
              </div>
              <button 
                id="add-to-cart"
                onClick={() => onConfirm({
                  menuItemId: item.id,
                  name: item.name,
                  size,
                  ice,
                  sugar,
                  price: size === 'M' ? item.priceM : item.priceL,
                  quantity
                })}
                className="bg-amber-900 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-amber-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                加入購物車 <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<'ordering' | 'admin' | 'admin-auth'>('ordering');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch Menu
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
    });
    return () => unsub();
  }, []);

  // Fetch Admin Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (snapshot) => {
      if (snapshot.exists()) {
        setAdminSettings(snapshot.data() as AdminSettings);
      } else {
        setAdminSettings({ isInitialized: false, adminPasswordHash: '' });
      }
    });
    return () => unsub();
  }, []);

  // Fetch Orders (Admin Only View)
  useEffect(() => {
    if (view === 'admin') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(items);
      });
      return () => unsub();
    }
  }, [view]);

  // Seed Data Macro
  const seedData = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      const menuSnap = await getDocs(collection(db, 'menu'));
      if (menuSnap.empty) {
        INITIAL_MENU.forEach(item => {
          const newDoc = doc(collection(db, 'menu'));
          batch.set(newDoc, item);
        });
        await batch.commit();
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'menu');
    }
    setIsSeeding(false);
  };

  const addToCart = (item: OrderItem) => {
    setCart([...cart, item]);
    setSelectedItem(null);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const submitOrder = async () => {
    if (!customerName || cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: Omit<Order, 'id'> = {
      items: cart,
      customerName,
      total,
      status: OrderStatus.PENDING,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'orders'), order);
      setCart([]);
      setCustomerName('');
      alert('訂單已送出！');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  };

  const handleAdminAuth = async () => {
    setIsAuthorizing(true);
    setAuthError('');
    
    if (!adminSettings?.isInitialized) {
      // Setup
      if (passwordInput.length < 4) {
        setAuthError('密碼至少 4 位數');
        setIsAuthorizing(false);
        return;
      }
      try {
        await setDoc(doc(db, 'settings', 'admin'), {
          adminPasswordHash: passwordInput,
          isInitialized: true
        });
        setView('admin');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'settings/admin');
        setAuthError('設定失敗');
      }
    } else {
      // Login
      if (passwordInput === adminSettings.adminPasswordHash) {
        setView('admin');
      } else {
        setAuthError('密碼錯誤');
      }
    }
    setIsAuthorizing(false);
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const clearOrders = async () => {
    if (!confirm('確定要清空所有訂單嗎？')) return;
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'orders');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AnimatePresence mode="wait">
        
        {/* --- Ordering View --- */}
        {view === 'ordering' && (
          <motion.div 
            key="ordering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row"
          >
            <div className="flex-1 pb-40 md:pb-6">
              <Header onAdminClick={() => setView('admin-auth')} />
              
              <div className="max-w-4xl mx-auto p-6">
                <div className="mb-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">MENU</h2>
                    <p className="text-sm text-gray-500 mt-1">請選擇您的美味飲品</p>
                  </div>
                  {menu.length === 0 && (
                    <button 
                      onClick={seedData} 
                      disabled={isSeeding}
                      className="text-xs bg-amber-900 text-white px-4 py-2 rounded-full disabled:opacity-50"
                    >
                      {isSeeding ? '載入中...' : '初始化菜單'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menu.map(item => (
                    <MenuItemCard key={item.id} item={item} onAdd={setSelectedItem} />
                  ))}
                  {menu.length === 0 && !isSeeding && (
                    <div className="col-span-full py-20 text-center text-gray-400">
                      <Coffee size={40} className="mx-auto mb-4 opacity-20" />
                      <p>目前尚無品項，請點擊上方按鈕初始化</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shopping Cart Bar / Panel */}
            <div className={cn(
              "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 transition-all duration-500",
              cart.length > 0 ? "translate-y-0" : "translate-y-full"
            )}>
              <div className="max-w-4xl mx-auto p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <ShoppingCart size={24} className="text-amber-900" />
                        <span className="absolute -top-2 -right-2 bg-amber-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>
                      </div>
                      <span className="font-bold text-gray-900">您的購物車</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">總計 Total</p>
                      <p className="text-xl font-mono font-black text-amber-900">${totalAmount}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label id="customer-name-label" className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">訂購人姓名 Name</label>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="請輸入您的稱呼"
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:border-amber-900/30 transition-all"
                      />
                    </div>
                    <button 
                      id="submit-order"
                      onClick={submitOrder}
                      disabled={!customerName || cart.length === 0}
                      className="bg-amber-900 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
                    >
                      送出訂單
                    </button>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex-shrink-0 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center gap-3">
                        <div className="text-xs">
                          <p className="font-bold text-gray-900">{item.name} <span className="text-[10px] text-amber-600">({item.size})</span></p>
                          <p className="text-gray-400 scale-90 origin-left">{item.ice} / {item.sugar}</p>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- Admin Auth View --- */}
        {view === 'admin-auth' && (
          <motion.div 
            key="admin-auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex items-center justify-center p-6 bg-amber-50/30"
          >
            <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl shadow-amber-900/5 border border-amber-900/10">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-amber-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-900/20 rotate-3">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">{adminSettings?.isInitialized ? '管理者登入' : '初始化後台'}</h2>
                <p className="text-sm text-gray-500 text-center mt-2">
                  {adminSettings?.isInitialized 
                    ? '請輸入管理者密碼以繼續' 
                    : '偵測到尚未建立管理者，請設定您的存取密碼'}
                </p>
              </div>

              <div className="space-y-4">
                <input 
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="輸入密碼..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-amber-900/30 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                />
                
                {authError && <p className="text-xs text-red-500 text-center font-medium">{authError}</p>}

                <button 
                  id="auth-submit"
                  onClick={handleAdminAuth}
                  disabled={isAuthorizing || !passwordInput}
                  className="w-full bg-amber-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-amber-900/10 hover:translate-y-[-2px] transition-all disabled:opacity-50"
                >
                  {isAuthorizing ? '驗證中...' : (adminSettings?.isInitialized ? '進入後台' : '建立密碼並登入')}
                </button>

                <button 
                  onClick={() => setView('ordering')}
                  className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} /> 返回點餐頁面
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- Admin Dashboard View --- */}
        {view === 'admin' && (
          <motion.div 
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <header className="bg-gray-900 text-white p-6 sticky top-0 z-50 border-b border-white/5">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h1 className="font-bold tracking-tight">後台管理系統</h1>
                    <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Admin Console</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={clearOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-medium transition-all"
                  >
                    <Trash2 size={16} /> 清空訂單
                  </button>
                  <button 
                    onClick={() => setView('ordering')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
                  >
                    登出並返回
                  </button>
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto w-full p-6 space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">今日訂單 Orders</p>
                  <p className="text-3xl font-black text-gray-900">{orders.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">待處理 Pending</p>
                  <p className="text-3xl font-black text-amber-600">{orders.filter(o => o.status === OrderStatus.PENDING).length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">總營收 Revenue</p>
                  <p className="text-3xl font-black text-green-600">${orders.filter(o => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + o.total, 0)}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-2 h-6 bg-amber-900 rounded-full" />
                  即時訂單列表
                </h2>
                
                <div className="space-y-4">
                  {orders.map(order => (
                    <motion.div 
                      key={order.id}
                      layout
                      id={`order-${order.id}`}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0 md:w-32">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">狀態 Status</p>
                          <div className={cn(
                            "inline-flex px-3 py-1 rounded-full text-xs font-bold",
                            order.status === OrderStatus.PENDING && "bg-amber-100 text-amber-700",
                            order.status === OrderStatus.PREPARING && "bg-blue-100 text-blue-700",
                            order.status === OrderStatus.COMPLETED && "bg-green-100 text-green-700",
                            order.status === OrderStatus.CANCELLED && "bg-gray-100 text-gray-700",
                          )}>
                            {order.status.toUpperCase()}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-4">{new Date(order.createdAt?.seconds * 1000).toLocaleTimeString()}</p>
                        </div>

                        <div className="flex-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{order.customerName} 的訂單</p>
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center font-mono text-[10px] font-bold">{item.quantity}</span>
                                  <span className="font-bold text-gray-800">{item.name}</span>
                                  <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 rounded">{item.size} / {item.ice} / {item.sugar}</span>
                                </div>
                                <span className="font-mono text-gray-400">${item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end justify-between gap-4">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">金額 Amount</p>
                            <p className="text-2xl font-black text-gray-900">${order.total}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateOrderStatus(order.id!, OrderStatus.PREPARING)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              開始製作
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id!, OrderStatus.COMPLETED)}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                            >
                              完成訂單
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id!, OrderStatus.CANCELLED)}
                              className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {orders.length === 0 && (
                    <div className="bg-white py-20 text-center rounded-2xl border border-dashed border-gray-200 text-gray-400">
                      尚未收到任何訂單
                    </div>
                  )}
                </div>
              </div>
            </main>
          </motion.div>
        )}

      </AnimatePresence>

      {/* --- Overlay Modal --- */}
      <AnimatePresence>
        {selectedItem && (
          <SelectionModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
            onConfirm={addToCart} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
