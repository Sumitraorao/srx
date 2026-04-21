
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firebaseUtils';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        let userDoc;
        try {
            userDoc = await getDoc(userDocRef);
        } catch (fsErr) {
            handleFirestoreError(fsErr, 'get', `users/${user.uid}`, auth);
        }
        
        if (!userDoc.exists()) {
            const userData = {
                email: user.email,
                first_name: user.displayName?.split(' ')[0] || 'User',
                last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
                role: 'user',
                picture: user.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            try {
                await setDoc(userDocRef, userData);
            } catch (fsErr) {
                handleFirestoreError(fsErr, 'create', `users/${user.uid}`, auth);
            }
        } else {
            try {
                await updateDoc(userDocRef, { updatedAt: serverTimestamp() });
            } catch (fsErr) {
                handleFirestoreError(fsErr, 'update', `users/${user.uid}`, auth);
            }
        }

        navigate('/dashboard');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/network-request-failed') {
            setError('Network error: Please check your internet connection.');
        } else {
            setError(err.message || 'Google login failed');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, { updatedAt: serverTimestamp() });
        } catch (fsErr) {
            // If user exists but update fails, might be permissions or missing doc
            console.warn("Could not update updatedAt", fsErr);
        }
        
        navigate('/dashboard');
    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/network-request-failed') {
            setError('Network error: Firebase servers are unreachable. Please disable your AdBlocker or check your firewall.');
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
            setError('The email or password you entered is incorrect.');
        } else if (err.code === 'auth/user-disabled' || err.message?.includes('user-disabled')) {
            setError('This account has been disabled. Please contact support.');
        } else if (err.code === 'auth/too-many-requests' || err.message?.includes('too-many-requests')) {
            setError('Too many failed attempts. Please try again later or reset your password.');
        } else {
            // Clean up the Firebase error message for the UI
            const userFriendlyMessage = err.message?.replace(/^Firebase:\s+Error\s+\(auth\//, '').replace(/\)\.$/, '').replace(/-/g, ' ') || 'Login failed';
            setError(userFriendlyMessage.charAt(0).toUpperCase() + userFriendlyMessage.slice(1));
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Very Soft Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
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
                  <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">Sign in</h2>
                  <p className="text-slate-400 text-sm font-medium tracking-tight">Access your SRXHUB ecosystem account.</p>
              </div>
              
              <form className="space-y-8" onSubmit={handleSubmit}>
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
                              type="email"
                              required
                              className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                              placeholder="Email address"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
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
                              required
                              className="peer w-full bg-slate-50 border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-transparent font-semibold shadow-inner"
                              placeholder="Password"
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                          />
                          <label 
                            htmlFor="password"
                            className="absolute left-6 top-5 text-slate-400 font-bold transition-all pointer-events-none peer-focus:text-[10px] peer-focus:top-2 peer-focus:text-brand-red peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:top-2"
                          >
                            Password
                          </label>
                      </div>
                  </div>
 
                  <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center text-slate-500 cursor-pointer hover:text-slate-900 transition-colors group">
                          <div className="relative flex items-center">
                              <input type="checkbox" className="peer appearance-none w-6 h-6 rounded-lg border-2 border-slate-100 bg-slate-50 checked:bg-slate-900 checked:border-slate-900 transition-all" />
                              <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none flex items-center justify-center w-6 h-6">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
                              </div>
                          </div>
                          <span className="ml-3 font-bold">Stay connected</span>
                      </label>
                      <a href="#" className="text-slate-900 hover:text-brand-red font-black transition-colors underline decoration-slate-200 underline-offset-4">Forgot?</a>
                  </div>
 
                  <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[0.15em] text-sm"
                  >
                      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                          <>Sign In To Dashboard <ArrowRight size={18} className="ml-2" /></>
                      )}
                  </button>
              </form>
 
              <div className="mt-12">
                  <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-50" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em] font-black text-slate-300">
                          <span className="px-4 bg-white">SSO Integration</span>
                      </div>
                  </div>
 
                  <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="mt-8 w-full flex justify-center items-center py-4 px-4 border-2 border-slate-50 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all font-black text-xs shadow-sm hover:shadow-md active:scale-95"
                  >
                      <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                      Continue with Google
                  </button>
              </div>
 
              <div className="mt-12 text-center text-xs font-bold text-slate-400">
                  New here?{' '}
                  <Link to="/register" className="text-slate-900 hover:text-brand-red transition-all underline decoration-brand-red/30 underline-offset-4">
                      Create a free account
                  </Link>
              </div>
          </div>
      </motion.div>
    </div>
  );
};

export default Login;
