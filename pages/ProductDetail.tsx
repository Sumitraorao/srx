
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PRODUCT_CATEGORIES, FEATURED_APPS } from '../constants';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, Star, 
  BarChart2, Mail, Users, Headphones, BookOpen, 
  Zap, Shield, Globe, Play, Layers, ArrowRight,
  TrendingUp, Clock, CreditCard, Smile, Layout,
  Smartphone, Lock, Share2, Briefcase, DollarSign,
  Send, AlertCircle, Sparkles, Loader2, Cloud, FileText
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- RICH DATA CONFIGURATION ---
const PRODUCT_DETAILS: Record<string, any> = {
  crm: {
    tagline: "The heartbeat of your sales team.",
    heroTitle: "Convert leads into loyal customers.",
    heroImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000",
    gradient: "from-blue-600 to-indigo-700",
    accentColor: "text-blue-600",
    lightTheme: "bg-blue-50 text-blue-900",
    icon: Users,
    roleTitle: "I am your Intelligent Sales Engine",
    roleDesc: "I don't just store data; I actively help you sell. I track every customer touchpoint, automate your follow-ups, and visualize your sales pipeline so you never miss a revenue opportunity.",
    features: [
      { title: "Lead Management", desc: "Capture leads from social media, website, and email automatically.", icon: Users },
      { title: "Deal Pipelines", desc: "Visual Kanban boards to track the stage of every potential sale.", icon: BarChart2 },
      { title: "Workflow Automation", desc: "Trigger emails and tasks based on deal stage changes.", icon: Zap },
      { title: "Sales Forecasting", desc: "Predict revenue with AI-backed analytics.", icon: TrendingUp },
    ],
    process: [
      { step: "01", title: "Capture", desc: "Leads land in the system instantly via webforms or email." },
      { step: "02", title: "Nurture", desc: "Automated sequences warm them up until they are ready to buy." },
      { step: "03", title: "Close", desc: "Sign contracts digitally and convert them to happy customers." }
    ]
  },
  mail: {
    tagline: "Secure, ad-free business email.",
    heroTitle: "Communication that means business.",
    heroImage: "https://images.unsplash.com/photo-1557200130-b7220623052f?auto=format&fit=crop&q=80&w=2000",
    gradient: "from-yellow-500 to-orange-600",
    accentColor: "text-yellow-600",
    lightTheme: "bg-yellow-50 text-yellow-900",
    icon: Mail,
    roleTitle: "I am your Secure Digital Postman",
    roleDesc: "I protect your conversations from prying eyes. Unlike free services, I don't read your emails to show ads. I provide encryption, custom domains, and integrated calendars to keep your team synchronized.",
    features: [
      { title: "Custom Domain", desc: "Look professional with you@yourcompany.com.", icon: Globe },
      { title: "Encryption", desc: "S/MIME encryption to keep sensitive data safe.", icon: Shield },
      { title: "Control Panel", desc: "Manage aliases, groups, and policies easily.", icon: Layers },
      { title: "Offline Access", desc: "Read and draft emails without internet.", icon: Zap },
    ],
    process: [
      { step: "01", title: "Connect", desc: "Set up your custom domain and migrate existing emails." },
      { step: "02", title: "Organize", desc: "Use AI filters and folders to keep your inbox zero." },
      { step: "03", title: "Collaborate", desc: "Share folders, calendars, and tasks with your team." }
    ]
  },
  books: {
    tagline: "Accounting made automatic.",
    heroTitle: "Your finances, perfectly balanced.",
    heroImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=2000",
    gradient: "from-green-600 to-emerald-700",
    accentColor: "text-green-600",
    lightTheme: "bg-green-50 text-green-900",
    icon: BookOpen,
    roleTitle: "I am your Digital CFO",
    roleDesc: "I handle invoices, track expenses, reconcile bank accounts, and generate tax reports while you sleep. I ensure you get paid faster and stay compliant with local tax laws.",
    features: [
      { title: "Invoicing", desc: "Send professional invoices that get paid faster.", icon: FileText },
      { title: "Bank Feeds", desc: "Connect your bank for automatic transaction imports.", icon: CreditCard },
      { title: "Inventory", desc: "Track stock levels and reorder points automatically.", icon: Layers },
      { title: "GST/Tax", desc: "Generate tax reports compliant with local regulations.", icon: DollarSign },
    ],
    process: [
      { step: "01", title: "Record", desc: "Snap photos of receipts and auto-log expenses." },
      { step: "02", title: "Invoice", desc: "Send estimates and convert them to invoices instantly." },
      { step: "03", title: "Report", desc: "Get real-time P&L and Balance Sheet reports." }
    ]
  }
};

const GENERIC_PRODUCT = {
  gradient: "from-gray-700 to-gray-900",
  accentColor: "text-gray-700",
  lightTheme: "bg-gray-50 text-gray-900",
  roleTitle: "I am your Productivity Partner",
  roleDesc: "I am designed to streamline your operations and boost efficiency. With powerful features and seamless integration, I help your business grow.",
  features: [
    { title: "Secure Cloud", desc: "Your data is safe and accessible anywhere.", icon: Cloud },
    { title: "Mobile Ready", desc: "Work on the go with native mobile apps.", icon: Smartphone },
    { title: "Integration", desc: "Works seamlessly with other SRXHUB apps.", icon: Layers },
    { title: "24/7 Support", desc: "We are always here to help you succeed.", icon: Headphones },
  ],
  process: [
    { step: "01", title: "Sign Up", desc: "Create your free account in seconds." },
    { step: "02", title: "Configure", desc: "Customize settings to match your workflow." },
    { step: "03", title: "Launch", desc: "Invite your team and start working." }
  ]
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, firebaseUser, loading } = useAuth();
    const [product, setProduct] = useState<any>(null);
    const [richData, setRichData] = useState<any>(null);
    const [formState, setFormState] = useState({ requirements: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const scrollRef = useRef(null);
    const formRef = useRef<HTMLDivElement>(null);
  
    const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start start", "end start"] });
    const translateY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const elementOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
    const scrollToForm = () => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  
    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!firebaseUser) {
          navigate('/login');
          return;
      }
      if (!formState.requirements.trim()) return;
  
      setIsSubmitting(true);
      setSubmitError('');
  
      try {
          await addDoc(collection(db, 'service_requests'), {
              userId: firebaseUser.uid,
              userName: `${user?.first_name} ${user?.last_name}`,
              userEmail: firebaseUser.email,
              serviceId: id,
              serviceName: product?.name || id,
              requirements: formState.requirements,
              status: 'pending',
              createdAt: serverTimestamp()
          });
          setSubmitSuccess(true);
          setFormState({ requirements: '' });
      } catch (err: any) {
          console.error("Error submitting request:", err);
          setSubmitError("Failed to submit request: " + (err.message || "Unknown error"));
      } finally {
          setIsSubmitting(false);
      }
    };
  
    useEffect(() => {
      let foundProduct = null;
      // Search in main categories
      for (const cat of PRODUCT_CATEGORIES) {
          const p = cat.products.find(item => item.id === id);
          if (p) {
              foundProduct = p;
              break;
          }
      }
      
      // Fallback search in featured apps if not found in categories
      if (!foundProduct) {
          foundProduct = FEATURED_APPS.find(app => app.id === id);
      }
      
      setProduct(foundProduct);
  
      const specificData = PRODUCT_DETAILS[id as string];
      if (specificData) {
          setRichData(specificData);
      } else {
          setRichData({
              ...GENERIC_PRODUCT,
              tagline: foundProduct?.description || "Empowering your business.",
              heroTitle: foundProduct?.name || "Product Overview",
              heroImage: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000",
              icon: foundProduct?.icon || Layers
          });
      }
      
      window.scrollTo(0,0);
    }, [id]);
  
    if (!product || !richData) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-brand-blue" />
        </div>
    );
  
    return (
      <div className="bg-white min-h-screen font-sans overflow-x-hidden selection:bg-brand-red/10 selection:text-brand-red">
        
        {/* HERO SECTION */}
        <section ref={scrollRef} className={`relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-gradient-to-br ${richData.gradient} text-white`}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <Link to={firebaseUser ? "/dashboard" : "/products"} className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {firebaseUser ? "Back to Dashboard" : "Back to Products"}
                </Link>
  
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div 
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                {product?.icon ? <product.icon size={32} /> : <richData.icon size={32} />}
                            </div>
                            <h1 className="text-xl font-bold tracking-widest uppercase opacity-90">{product?.name || "SRXHUB App"}</h1>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">{richData.heroTitle}</h2>
                        <p className="text-xl md:text-2xl text-blue-100 mb-8 font-light max-w-lg">{richData.tagline}</p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            {firebaseUser ? (
                                <button onClick={scrollToForm} className="bg-white text-gray-900 font-bold py-4 px-10 rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all flex items-center justify-center group">
                                  Connect Service <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <Link to="/register" className="bg-white text-gray-900 font-bold py-4 px-10 rounded-full shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all flex items-center justify-center">
                                  Start Free Trial <ChevronRight size={20} className="ml-2" />
                                </Link>
                            )}
                            <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="border-2 border-white/30 hover:bg-white/10 text-white font-bold py-4 px-10 rounded-full transition-all">How it Works</button>
                        </div>
                    </motion.div>
  
                    <motion.div 
                      style={{ y: translateY, opacity: elementOpacity }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1 }}
                      className="relative perspective-1000 hidden lg:block"
                    >
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                            <img src={richData.heroImage} alt="Dashboard Preview" className="w-full h-auto object-cover" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/20 blur-[100px] -z-10"></div>
                    </motion.div>
                </div>
            </div>
        </section>
  
        {/* REQUIREMENT FORM SECTION */}
        {firebaseUser && (
            <section ref={formRef} className="py-24 bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-gray-50 rounded-[40px] p-8 md:p-12 border border-blue-50 shadow-xl shadow-blue-900/5">
                        <div className="flex flex-col md:flex-row gap-12 text-left items-start">
                            <div className="md:w-1/2 text-left">
                                <div className={`w-14 h-14 rounded-2xl ${richData.lightTheme} flex items-center justify-center mb-6`}>
                                    <Sparkles className={richData.accentColor} size={28} />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Submit Your Requirements</h2>
                                <p className="text-gray-500 mb-6 font-medium">Configure <span className="font-bold text-gray-900 uppercase tracking-tighter">{product?.name}</span> specifically for your business workflow.</p>
                                <ul className="space-y-4">
                                    {['Personalized Setup', '24/7 Priority Support', 'Free Data Migration'].map((item, i) => (
                                        <li key={i} className="flex items-center text-sm font-bold text-gray-600">
                                            <CheckCircle2 size={18} className="text-green-500 mr-2" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="md:w-1/2 w-full">
                                <AnimatePresence mode='wait'>
                                    {submitSuccess ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 rounded-3xl p-8 text-center flex flex-col items-center border border-green-100 h-full justify-center">
                                            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} /></div>
                                            <h3 className="text-xl font-bold text-green-900 mb-2">Requirement Saved!</h3>
                                            <p className="text-green-700 text-sm">We've received your requirements for {product?.name}. Our team will reachable to you soon.</p>
                                            <button onClick={() => setSubmitSuccess(false)} className="mt-6 text-green-600 font-bold text-sm hover:underline">Edit Requirements</button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                                            {submitError && (
                                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm font-bold gap-3"><AlertCircle size={18} /> {submitError}</div>
                                            )}
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Detail your requirements</label>
                                                <textarea required rows={5} className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all font-medium text-gray-700 resize-none shadow-inner" placeholder="E.g., I need a CRM setup for a real estate team..." value={formState.requirements} onChange={(e) => setFormState({ requirements: e.target.value })} />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Send size={20} /> SAVE REQUIREMENTS</>}
                                            </button>
                                        </form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )}
  
        {/* ROLE SECTION */}
        <section className="py-24 bg-white relative">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="md:w-1/3 flex justify-center">
                        <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center ${richData.lightTheme} shadow-2xl relative`}>
                            {product?.icon ? <product.icon size={80} /> : <richData.icon size={80} />}
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} className="md:w-2/3">
                        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${richData.accentColor}`}>What do I do?</h3>
                        <h2 className="text-4xl font-bold text-gray-900 mb-6">{richData.roleTitle}</h2>
                        <p className="text-xl text-gray-600 leading-relaxed">"{richData.roleDesc}"</p>
                    </motion.div>
                </div>
            </div>
        </section>
  
        {/* HOW IT WORKS */}
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
                    <p className="text-gray-500 mt-4">Three simple steps to mastery.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {richData.process.map((step: any, idx: number) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className={`w-12 h-12 rounded-full ${richData.lightTheme} flex items-center justify-center font-bold text-lg mb-6 shadow-md`}>{step.step}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                            <p className="text-gray-600">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
  
        {/* FEATURES GRID */}
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
                        <p className="text-gray-600 max-w-xl">Packed with powerful features designed to help you scale.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {richData.features.map((feat: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 group">
                            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform ${richData.accentColor}`}><feat.icon size={24} /></div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
  
        {/* CTA SECTION */}
        <section className="py-20 pb-32">
            <div className="max-w-5xl mx-auto px-4">
                <div className={`rounded-3xl p-12 text-center text-white bg-gradient-to-r ${richData.gradient} shadow-2xl relative overflow-hidden`}>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to dominate your workflow?</h2>
                        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">Join thousands of businesses who trust {product?.name || "SRXHUB"}.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            {firebaseUser ? (
                                <button onClick={scrollToForm} className="bg-white text-gray-900 font-bold py-4 px-10 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Configure Now</button>
                            ) : (
                                <Link to="/register" className="bg-white text-gray-900 font-bold py-4 px-10 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Get Started Free</Link>
                            )}
                            <Link to="/contact" className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-lg hover:bg-white/10 transition-colors">Contact Sales</Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    );
  };
  
  export default ProductDetail;
