
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebaseUtils';

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '', '']); 
  const [otpTimer, setOtpTimer] = useState(60);

  useEffect(() => {
    if (!loading) {
        if (!user) {
            navigate('/login');
        } else if (user.phone_number) {
            // Profile is already complete
            navigate('/dashboard', { replace: true });
        }
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showOtp && otpTimer > 0) {
        interval = setInterval(() => {
            setOtpTimer((prev) => prev - 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtp, otpTimer]);

  const handleCreateAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (!phoneNumber) return;
      setError('');
      setIsLoading(true);
      // Simulate OTP send
      setTimeout(() => {
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            setShowOtp(true);
          }, 500);
      }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
      if (value.length > 1) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 6) {
          const nextInput = document.getElementById(`otp-${index + 1}`);
          nextInput?.focus();
      }
  };

  const handleVerifyOtp = async () => {
      setIsLoading(true);
      setError('');
      
      try {
          const userRef = doc(db, 'users', auth.currentUser!.uid);
          await updateDoc(userRef, {
              phone_number: phoneNumber,
              updatedAt: serverTimestamp()
          });
          navigate('/dashboard');
      } catch (err: any) {
          console.error(err);
          try {
              handleFirestoreError(err, 'update', `users/${auth.currentUser?.uid}`, auth);
          } catch (formattedErr: any) {
              setError(formattedErr.message || "Failed to update profile");
          }
      } finally {
          setIsLoading(false);
      }
  };

  if (loading || !user) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-900">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
    </div>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900">
       
       {/* Soft Background Decorative Elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-slate-50 rounded-full blur-[80px]"></div>
       </div>

       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
         className="relative z-10 w-full max-w-lg px-6"
       >
           {!showOtp ? (
               <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
                   
                   {/* Profile Header */}
                   <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col items-center text-center">
                       <div className="relative mb-6">
                           {user.picture ? (
                               <img 
                                 src={user.picture} 
                                 alt="Profile" 
                                 className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl rotate-3 hover:rotate-0 transition-all duration-500" 
                                 referrerPolicy="no-referrer"
                               />
                           ) : (
                               <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-xl rotate-3">
                                   {user.first_name?.[0]}
                               </div>
                           )}
                           <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-2xl shadow-lg animate-pulse"></div>
                       </div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Verified Identity</h2>
                       <p className="text-slate-400 text-sm font-medium mt-2">Welcome, {user.first_name}. Let's secure your portal.</p>
                   </div>

                   <div className="p-10 sm:p-12">
                       <form onSubmit={handleCreateAccount} className="space-y-8">
                           {error && (
                               <div className="rounded-2xl bg-red-50 border border-red-100 p-5 flex items-center gap-4">
                                   <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
                                   <p className="text-sm font-bold text-red-800 leading-tight">{error}</p>
                               </div>
                           )}
                           
                           <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Mobile Access Key</label>
                               <div className="flex gap-3">
                                   <div className="flex-shrink-0 inline-flex items-center px-5 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl font-black text-sm">
                                       +91
                                   </div>
                                   <input 
                                      type="tel" 
                                      required
                                      value={phoneNumber}
                                      onChange={(e) => setPhoneNumber(e.target.value)}
                                      className="block w-full bg-slate-50 border border-transparent text-slate-900 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition-all placeholder-slate-300 font-bold text-lg tracking-widest shadow-inner" 
                                      placeholder="••••• •••••" 
                                   />
                               </div>
                               <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                                   <ShieldCheck size={14} className="mr-2 text-emerald-500" />
                                   Instant cryptographic verification sent via SMS.
                               </p>
                           </div>

                           <button 
                             type="submit" 
                             disabled={isLoading}
                             className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center uppercase tracking-[0.15em] text-sm"
                           >
                               {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Request Secure Access'}
                           </button>
                           
                           <div className="text-center pt-2">
                               <button type="button" onClick={() => navigate('/login')} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                                   Different user? <span className="text-slate-900 underline decoration-slate-200 underline-offset-4">Reset Session</span>
                               </button>
                           </div>
                       </form>
                   </div>
               </div>
           ) : (
               <div className="bg-white border border-slate-100 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden p-10 sm:p-14">
                   <div className="text-center mb-10">
                       <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">Enter Key</h2>
                       <p className="text-slate-400 text-sm font-medium">
                           Input the 7-digit secure code sent to <span className="text-slate-900 font-black tracking-tight">+91 {phoneNumber}</span>
                       </p>
                   </div>

                   <div className="flex justify-between gap-2 mb-10">
                       {otp.map((digit, idx) => (
                           <input
                             key={idx}
                             id={`otp-${idx}`}
                             type="text"
                             maxLength={1}
                             value={digit}
                             onChange={(e) => handleOtpChange(idx, e.target.value)}
                             className="w-10 h-14 text-center bg-slate-50 border border-transparent rounded-2xl text-slate-900 text-2xl font-black focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 outline-none transition-all shadow-inner"
                           />
                       ))}
                   </div>

                   <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                       {otpTimer > 0 ? (
                           <span>Auth expires in <span className="text-slate-900">{otpTimer}s</span></span>
                       ) : (
                           <button onClick={() => setOtpTimer(60)} className="text-red-500 hover:text-red-600 transition-colors">Request New Code</button>
                       )}
                   </div>

                   <div className="flex gap-4">
                       <button onClick={() => setShowOtp(false)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors border border-slate-100 shadow-sm">
                           Back
                       </button>
                       <button 
                         onClick={handleVerifyOtp}
                         disabled={isLoading || otp.join('').length < 7}
                         className="flex-[2] bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-2xl shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-[0.15em] text-xs"
                       >
                           {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Identity'}
                       </button>
                   </div>
               </div>
           )}
       </motion.div>
    </div>
  );
};

export default CompleteProfile;
