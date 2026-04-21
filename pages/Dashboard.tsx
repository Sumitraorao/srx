
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutGrid, Users, Settings, Bell, Search, LogOut, 
  Plus, ChevronRight, Star, Clock, Menu, X, ArrowRight
} from 'lucide-react';
import { FEATURED_APPS } from '../constants';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../lib/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, firebaseUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (!loading) {
        if (!firebaseUser) {
            navigate('/login');
        } else if (!user) {
            navigate('/complete-profile');
        }
    }
  }, [user, loading, firebaseUser, navigate]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        navigate('/login');
    } catch (err) {
        console.error("Logout error:", err);
    }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initialising workspace...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans selection:bg-slate-100 selection:text-slate-900">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-100 flex flex-col h-full transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
      `}>
        <div className="p-8 flex items-center justify-between h-24 shrink-0">
           <Link to="/" className="flex items-center group">
               <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-slate-200 transition-transform group-hover:scale-105">
                  S
               </div>
               <span className="ml-4 font-black text-2xl text-slate-900 tracking-tighter">SRXHUB</span>
           </Link>
           <button 
             onClick={() => setIsMobileMenuOpen(false)} 
             className="md:hidden text-slate-400 hover:text-slate-900 focus:outline-none p-2"
           >
               <X size={20} />
           </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-6 space-y-1.5 mt-4">
           <a href="#" className="flex items-center px-5 py-4 text-sm font-black rounded-2xl bg-slate-50 text-slate-900 transition-all border border-slate-100">
              <LayoutGrid size={20} className="mr-4" /> DASHBOARD
           </a>
           <a href="#" className="flex items-center px-5 py-4 text-sm font-bold rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Users size={20} className="mr-4" /> MY TEAMS
           </a>
           <a href="#" className="flex items-center px-5 py-4 text-sm font-bold rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Star size={20} className="mr-4" /> FAVORITES
           </a>
           <a href="#" className="flex items-center px-5 py-4 text-sm font-bold rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
              <Settings size={20} className="mr-4" /> SETTINGS
           </a>
        </nav>

        <div className="p-8 border-t border-slate-50 shrink-0">
           <button onClick={handleLogout} className="flex items-center w-full px-5 py-4 text-xs font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest">
              <LogOut size={18} className="mr-4" /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 w-full overflow-x-hidden bg-white">
        {/* Header */}
        <header className="h-24 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sm:px-10 lg:px-12 sticky top-0 z-10 shrink-0">
            <div className="flex items-center">
               <button 
                 onClick={() => setIsMobileMenuOpen(true)} 
                 className="mr-6 text-slate-900 md:hidden p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 focus:outline-none transition-colors shadow-sm"
               >
                   <Menu size={20} />
               </button>
               
               <div className="flex flex-col">
                   <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none">Workspace</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Dashboard</p>
               </div>
            </div>
            
            <div className="flex-1 max-w-lg mx-12 hidden lg:block">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all text-sm font-semibold outline-none shadow-inner"
                  />
               </div>
            </div>

            <div className="flex items-center space-x-6">
               <button className="p-3 text-slate-400 hover:text-slate-900 rounded-2xl bg-slate-50 hover:bg-slate-100 relative transition-all shadow-sm">
                  <Bell size={20} />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-brand-red rounded-full ring-4 ring-white"></span>
               </button>
               <div className="flex items-center space-x-4 pl-6 border-l border-slate-100">
                  <div className="text-right hidden sm:block">
                      <div className="text-sm font-black text-slate-900 tracking-tight">{user.first_name} {user.last_name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Member</div>
                  </div>
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-[18px] flex items-center justify-center font-black text-sm shadow-xl shadow-slate-200 ring-4 ring-slate-50">
                      {user.first_name?.[0]}
                  </div>
               </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 sm:p-10 lg:p-14 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
               <div className="mb-14">
                   <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tighter">Welcome back, {user.first_name}.</h1>
                   <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">Access all your SRXHUB services and managed workspace environments from one single point.</p>
               </div>

               {/* My Apps Grid */}
               <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Activated Services</h2>
                      <button onClick={() => navigate('/products')} className="text-xs text-slate-900 font-black hover:text-brand-red transition-all flex items-center uppercase tracking-widest group">
                          Marketplace <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {FEATURED_APPS.slice(0, 3).map((app, idx) => (
                          <div key={idx} onClick={() => navigate('/product/' + app.name.toLowerCase().replace(' ', ''))} className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_32px_64px_rgba(0,0,0,0.08)] transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full border-b-[6px]">
                               <div className={`w-14 h-14 ${app.color.replace('text-', 'bg-').replace('500', '100')} rounded-[22px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm`}>
                                   <app.icon className={app.color} size={28} />
                               </div>
                               <h3 className="font-black text-2xl text-slate-900 mb-3 tracking-tighter leading-tight">{app.name}</h3>
                               <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8 flex-grow">{app.description}</p>
                               <div className="flex items-center text-xs font-black text-slate-900 gap-2 uppercase tracking-widest mt-auto group-hover:text-brand-red transition-colors">
                                   Access Console <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                               </div>
                          </div>
                      ))}
                      <div onClick={() => navigate('/products')} className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-[32px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white hover:border-slate-900 transition-all group overflow-hidden relative">
                          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                              <Plus size={24} />
                          </div>
                          <span className="text-sm font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest mt-2">Deploy Service</span>
                      </div>
                  </div>
               </div>

               {/* Activity & Support */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white rounded-[32px] border border-slate-100 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                       <h3 className="font-black text-xs text-slate-400 mb-10 uppercase tracking-[0.2em] flex items-center">
                           <Clock size={16} className="mr-3" /> Recent Activity
                       </h3>
                       <div className="space-y-10">
                           {[1,2].map((_, i) => (
                               <div key={i} className="flex items-start">
                                   <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 mr-5 flex items-center justify-center text-xs font-black text-slate-900">
                                       SA
                                   </div>
                                   <div>
                                       <p className="text-sm font-bold text-slate-900 leading-relaxed">
                                           Workspace security audit completed by <span className="text-brand-red">Root Admin</span>.
                                       </p>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">March 21, 2026 • 2:45 PM</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="bg-slate-900 rounded-[32px] shadow-2xl p-12 text-white relative overflow-hidden flex flex-col justify-between group">
                       {/* Background decoration */}
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                       
                       <div>
                           <h3 className="font-black text-3xl mb-4 tracking-tighter leading-tight mt-4">Enterprise Scaling</h3>
                           <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">Need unrestricted access and bank-grade isolation? Elevate your SRXHUB instance.</p>
                       </div>
                       
                       <button onClick={() => navigate('/enterprise')} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center group/btn">
                           Upgrade Workspace <ChevronRight size={18} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                   </div>
               </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
