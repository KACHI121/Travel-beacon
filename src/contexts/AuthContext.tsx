import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Spinner } from '@/components/ui/spinner';

// Define user type
export interface User {
  user_id: string;
  email: string;
  name: string;
}

// Extend the User type to map Supabase user properties
const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User => ({
  user_id: supabaseUser.id,
  email: supabaseUser.email || '',
  name: supabaseUser.user_metadata?.name || 'Anonymous',
});

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else if (session?.user) {
          setUser(mapSupabaseUserToUser(session.user));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUserToUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) setUser(mapSupabaseUserToUser(data.user));
  };

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new Error(error.message);
    if (data.user) {
      setUser(mapSupabaseUserToUser(data.user));      // Save user info in the 'users' table
      const { error: dbError } = await supabase.from('users').insert({
        user_id: data.user.id,
        email,
        name,
      });

      if (dbError) {
        console.error('Error saving user to database:', dbError);
      }
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spinner className="w-8 h-8 text-primary mb-4" />
        <p className="text-gray-600 text-sm">Initializing...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
