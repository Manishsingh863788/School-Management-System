import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserProfile } from '../services/auth.service';

interface ChildStudent {
  id: string;
  admissionNumber: string;
  fullName: string;
  class: { id: string; name: string };
  section: { id: string; name: string };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: 'ADMIN' | 'TEACHER' | 'GUARDIAN' | null;
  isLoading: boolean;
  activeChild: ChildStudent | null;
  linkedChildren: ChildStudent[];
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchActiveChild: (childId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('edumanage_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('edumanage_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeChild, setActiveChild] = useState<ChildStudent | null>(null);
  const [linkedChildren, setLinkedChildren] = useState<ChildStudent[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('edumanage_token');
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('edumanage_user', JSON.stringify(profile));

          // If Guardian, extract linked children
          if (profile.role === 'GUARDIAN' && profile.profile?.studentLinks) {
            const childrenList = profile.profile.studentLinks.map((l: any) => l.student);
            setLinkedChildren(childrenList);

            const savedChildId = localStorage.getItem('edumanage_active_child');
            const foundChild = childrenList.find((c: any) => c.id === savedChildId) || childrenList[0] || null;
            setActiveChild(foundChild);
            if (foundChild) {
              localStorage.setItem('edumanage_active_child', foundChild.id);
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          setUser(null);
          setToken(null);
          localStorage.removeItem('edumanage_token');
          localStorage.removeItem('edumanage_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authService.login(credentials);
    setUser(res.user);
    setToken(res.token);

    if (res.user.role === 'GUARDIAN' && res.user.profile?.studentLinks) {
      const childrenList = res.user.profile.studentLinks.map((l: any) => l.student);
      setLinkedChildren(childrenList);
      if (childrenList.length > 0) {
        setActiveChild(childrenList[0]);
        localStorage.setItem('edumanage_active_child', childrenList[0].id);
      }
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setActiveChild(null);
    setLinkedChildren([]);
  };

  const switchActiveChild = (childId: string) => {
    const target = linkedChildren.find((c) => c.id === childId);
    if (target) {
      setActiveChild(target);
      localStorage.setItem('edumanage_active_child', target.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        activeChild,
        linkedChildren,
        login,
        logout,
        switchActiveChild,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
