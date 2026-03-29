import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Trash2, Edit2, Save, LogOut, LogIn, 
  LayoutDashboard, FileText, Play, BarChart3, MessageSquare,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { 
  auth, db, googleProvider, 
  Initiative, MediaItem, ImpactStat, ContactMessage, UserProfile,
  OperationType, handleFirestoreError
} from '../firebase';
import { 
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, orderBy, onSnapshot, serverTimestamp, Timestamp, addDoc
} from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils';

const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'initiatives' | 'media' | 'stats' | 'messages'>('initiatives');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else if (user.email === 'upsociall.hub@gmail.com') {
            // Bootstrap first admin
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'admin'
            });
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            toast.error('Access denied. Admin privileges required.');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time data listeners
  useEffect(() => {
    if (!isAdmin) return;

    const unsubInitiatives = onSnapshot(collection(db, 'initiatives'), (snapshot) => {
      setInitiatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Initiative)));
    });

    const unsubMedia = onSnapshot(query(collection(db, 'media'), orderBy('date', 'desc')), (snapshot) => {
      setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem)));
    });

    const unsubStats = onSnapshot(collection(db, 'impact_stats'), (snapshot) => {
      setStats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ImpactStat)));
    });

    const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage)));
    });

    return () => {
      unsubInitiatives();
      unsubMedia();
      unsubStats();
      unsubMessages();
    };
  }, [isAdmin]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSave = async (collectionName: string) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, collectionName, editingId), formData);
        toast.success('Updated successfully');
      } else {
        await addDoc(collection(db, collectionName), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('Added successfully');
      }
      setEditingId(null);
      setFormData({});
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, collectionName);
      toast.error('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success('Deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-navy rounded-3xl flex items-center justify-center text-white font-bold text-3xl mb-8">JP</div>
        <h2 className="text-3xl font-bold text-navy mb-4">Admin Access</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Please sign in with an authorized admin account to manage the website content.
        </p>
        <button 
          onClick={handleLogin}
          className="bg-navy text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-navy-light transition-all"
        >
          <LogIn className="w-5 h-5" /> Sign in with Google
        </button>
        <button onClick={onClose} className="mt-6 text-gray-400 font-bold hover:text-navy transition-colors">Back to Website</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white font-bold text-xl">JP</div>
          <div>
            <h1 className="font-bold text-navy leading-none">Admin Dashboard</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Content Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy">{user.displayName}</p>
            <p className="text-[10px] text-gray-400 font-bold">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-3 bg-navy text-white rounded-xl hover:bg-navy-light transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col gap-2 shrink-0">
          {[
            { id: 'initiatives', label: 'Initiatives', icon: FileText },
            { id: 'media', label: 'Media Center', icon: Play },
            { id: 'stats', label: 'Impact Stats', icon: BarChart3 },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id ? "bg-navy text-white shadow-lg shadow-navy/20" : "text-gray-400 hover:bg-gray-50 hover:text-navy"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-navy capitalize">{activeTab}</h2>
              {activeTab !== 'messages' && (
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({});
                  }}
                  className="bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-navy-light transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="space-y-6">
              {activeTab === 'initiatives' && (
                <div className="grid grid-cols-1 gap-4">
                  {initiatives.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", item.color)}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-navy">{item.title}</h3>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(item.id!); setFormData(item); }} className="p-2 text-gray-400 hover:text-navy transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('initiatives', item.id!)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 gap-4">
                  {media.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img src={item.thumbnail} className="w-20 h-12 object-cover rounded-lg" alt="" />
                        <div>
                          <h3 className="font-bold text-navy">{item.title}</h3>
                          <p className="text-xs text-gray-400">{item.type} • {item.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(item.id!); setFormData(item); }} className="p-2 text-gray-400 hover:text-navy transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('media', item.id!)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 gap-4">
                  {stats.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-navy">{item.label}</h3>
                        <p className="text-2xl font-bold text-saffron">{item.value}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(item.id!); setFormData(item); }} className="p-2 text-gray-400 hover:text-navy transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete('impact_stats', item.id!)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="grid grid-cols-1 gap-4">
                  {messages.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-navy">{item.name}</h3>
                          <p className="text-xs text-gray-400">{item.email} • {item.userType}</p>
                        </div>
                        <span className="text-[10px] text-gray-300 font-bold uppercase">
                          {item.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.message}</p>
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => handleDelete('messages', item.id!)} className="text-xs text-red-400 font-bold hover:text-red-600 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Delete Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {(editingId !== null || Object.keys(formData).length > 0) && activeTab !== 'messages' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setEditingId(null); setFormData({}); }}
              className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">{editingId ? 'Edit' : 'Add New'} {activeTab}</h3>
                <button onClick={() => { setEditingId(null); setFormData({}); }}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-6">
                {activeTab === 'initiatives' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Title</label>
                      <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Category</label>
                      <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                      <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Icon</label>
                        <input type="text" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" placeholder="Cpu, Globe..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Color Class</label>
                        <input type="text" value={formData.color || ''} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" placeholder="bg-navy..." />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'media' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Title</label>
                      <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Type</label>
                        <select value={formData.type || 'Video'} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy">
                          <option value="Video">Video</option>
                          <option value="Speech">Speech</option>
                          <option value="Press">Press</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Date</label>
                        <input type="text" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" placeholder="Mar 15, 2024" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Thumbnail URL</label>
                      <input type="text" value={formData.thumbnail || ''} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                  </>
                )}

                {activeTab === 'stats' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Label</label>
                      <input type="text" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Value</label>
                      <input type="text" value={formData.value || ''} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Description</label>
                      <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-navy" />
                    </div>
                  </>
                )}

                <button 
                  disabled={submitting}
                  onClick={() => handleSave(activeTab === 'stats' ? 'impact_stats' : activeTab)}
                  className="w-full bg-navy text-white py-4 rounded-2xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
