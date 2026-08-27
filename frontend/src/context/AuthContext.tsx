import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, UserRole } from '@/types';
import { authApi } from '@/api/auth.api';

interface AuthContextType {
  user: User | null;
  student: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('upam_token');
    const savedUser = localStorage.getItem('upam_user');
    const savedStudent = localStorage.getItem('upam_student');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedStudent) {
        setStudent(JSON.parse(savedStudent));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('upam_token', response.token);
    localStorage.setItem('upam_user', JSON.stringify(response.user));
    if (response.student) {
      localStorage.setItem('upam_student', JSON.stringify(response.student));
      setStudent(response.student);
    }
    setUser(response.user);
  };

  const register = async (data: any) => {
    const response = await authApi.register(data);
    localStorage.setItem('upam_token', response.token);
    localStorage.setItem('upam_user', JSON.stringify(response.user));
    if (response.student) {
      localStorage.setItem('upam_student', JSON.stringify(response.student));
      setStudent(response.student);
    }
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('upam_token');
    localStorage.removeItem('upam_user');
    localStorage.removeItem('upam_student');
    setUser(null);
    setStudent(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
