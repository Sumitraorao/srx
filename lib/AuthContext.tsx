import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  firebaseUser: User | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firebaseUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      if (fUser) {
        // Listen to user profile changes
        const userRef = doc(db, 'users', fUser.uid);
        
        // Initial fetch
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUser({ id: snap.id, ...snap.data() });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }

        // Real-time listener
        const unsubscribeSnap = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser({ id: snap.id, ...snap.data() });
          } else {
            setUser(null);
          }
        }, (error) => {
          console.error("User profile subscription error:", error);
        });

        setLoading(false);
        return () => unsubscribeSnap();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
};
