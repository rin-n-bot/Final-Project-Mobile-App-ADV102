import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase';


// USER DATA STRUCTURE
interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}


// AUTHENTICATION CONTEXT VALUE TYPES
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}


// CONTEXT INITIALIZATION
const AuthContext = createContext<AuthContextType | undefined>(undefined);


// AUTHENTICATION PROVIDER
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  // FIRESTORE AUTH STATE LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);


  // USER LOGOUT AND SESSION CLEARING
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };


  // CONTEXT PROVIDER WRAPPER
  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


// CUSTOM AUTH CONTEXT CONSUMER
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}