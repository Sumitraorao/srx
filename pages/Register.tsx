
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firebaseUtils';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    terms: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.terms) {
        setError("Please agree to the Terms of Service.");
        return;
    }

    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }

    setIsLoading(true);
    
    try {
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = result.user;
        
        await updateProfile(user, { displayName: formData.name });

        const nameParts = formData.name.split(' ');
        const userData = {
            email: formData.email,
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ') || '',
            role: 'user',
            phone_number: formData.phone,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            await setDoc(doc(db, 'users', user.uid), userData);
        } catch (fsErr) {
            handleFirestoreError(fsErr, 'create', `users/${user.uid}`, auth);
        }

        navigate('/dashboard');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/network-request-failed') {
            setError('Network error: Firebase servers are unreachable. Please disable your AdBlocker or check your firewall.');
        } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
            setError('This email already has an account. Would you like to sign in instead?');
        } else if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
            setError('Please enter a valid email address.');
        } else if (err.code === 'auth/weak-password' || err.message?.includes('weak-password')) {
            setError('Your password is too simple. Please use at least 6 characters.');
        } else {
            // Strip the "Firebase: " prefix if present to make the error more user-friendly
            const userFriendlyMessage = err.message?.replace(/^Firebase:\s+Error\s+\(auth\//, '').replace(/\)\.$/, '').replace(/-/g, ' ') || 'Registration failed';
            setError(userFriendlyMessage.charAt(0).toUpperCase() + userFriendlyMessage.slice(1));
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-white font-sans selection:bg-purple-100 selection:text-purple-900">
       
       {/* Very Soft Background Decorative Elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
       </div>

       {/* Small Home Indicator */}
       <Link to="/" className="absolute top-10 left-10 z-20 flex items-center gap-3 transition-transform hover:-translate-x-1 group">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-brand-red transition-colors">
             <span className="font-bold text-xl text-white">S</span>
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900">Return home</span>
       </Link>

       <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-md px-6 py-12"
       >
          <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden p-10 sm:p-14">
             <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Join us</h2>
                <p className="text-slate-400 text-sm font-medium tracking-tight">Create your SRXHUB workspace identity.</p>
             </div>

             <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl bg-red-50 border border-red-100 p-5 flex items-center gap-4"
                    >
                        <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                        <p className="text-sm font-bold text-red-800 leading-tight">{error}</p>
                    </motion.div>
                )}
                
                <div className="space-y-5">
                    <div className="relative">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <label 
                            htmlFor="name"
                            className="absolute left-6 top-5 text-slate-400 font-bold transition-all pointer-events-none peer-focus:text-[10px] peer-focus:top-2 peer-focus:text-brand-red peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:top-2"
                        >
                            Full Name
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <label 
                            htmlFor="email"
                            className="absolute left-6 top-5 text-slate-400 font-bold transition-all pointer-events-none peer-focus:text-[10px] peer-focus:top-2 peer-focus:text-brand-red peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:top-2"
                        >
                            Email Address
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <label 
                            htmlFor="password"
                            className="absolute left-6 top-5 text-slate-400 font-bold transition-all pointer-events-none peer-focus:text-[10px] peer-focus:top-2 peer-focus:text-brand-red peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:top-2"
                        >
                            Password
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            required
                            className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                            placeholder="Mobile Number"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                         <label 
                            htmlFor="phone"
                            className="absolute left-6 top-5 text-slate-400 font-bold transition-all pointer-events-none peer-focus:text-[10px] peer-focus:top-2 peer-focus:text-brand-red peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:top-2"
                        >
                            Mobile Number
                        </label>
                    </div>
                </div>

                <div className="flex items-start pt-2">
                    <label className="flex items-center text-slate-500 cursor-pointer hover:text-slate-900 transition-colors group">
                        <div className="relative flex items-center shrink-0">
                            <input 
                                type="checkbox" 
                                id="terms"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                className="peer appearance-none w-6 h-6 rounded-lg border-2 border-slate-100 bg-slate-50 checked:bg-slate-900 checked:border-slate-900 transition-all" 
                            />
                            <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none flex items-center justify-center w-6 h-6">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                        </div>
                        <span className="ml-3 text-xs font-bold leading-tight">
                            I accept the <Link to="/policies" className="text-slate-900 underline decoration-slate-200 underline-offset-4">Terms</Link> and <Link to="/policies" className="text-slate-900 underline decoration-slate-200 underline-offset-4">Privacy Policy</Link>.
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[0.15em] text-sm mt-6"
                >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                        <>Create Workspace <ArrowRight size={18} className="ml-2" /></>
                    )}
                </button>
             </form>

             <div className="mt-12 text-center text-xs font-bold text-slate-400">
                 Already registered?{' '}
                 <Link to="/login" className="text-slate-900 hover:text-brand-red transition-all underline decoration-brand-red/30 underline-offset-4">
                     Sign in to your account
                 </Link>
             </div>
          </div>
       </motion.div>
    </div>
  );
};

export default Register;
