import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, UserRole, ROLE_LABELS } from '@/types';
import { authApi } from '@/api/auth.api';

interface TeacherSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  student: Student | null;
  teacher: TeacherSummary | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  roleLabel: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<TeacherSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('upam_token');
    const savedUser = localStorage.getItem('upam_user');
    const savedStudent = localStorage.getItem('upam_student');
    const savedTeacher = localStorage.getItem('upam_teacher');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedStudent) {
        setStudent(JSON.parse(savedStudent));
      }
      if (savedTeacher) {
        setTeacher(JSON.parse(savedTeacher));
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
    if (response.teacher) {
      localStorage.setItem('upam_teacher', JSON.stringify(response.teacher));
      setTeacher(response.teacher);
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
    if (response.teacher) {
      localStorage.setItem('upam_teacher', JSON.stringify(response.teacher));
      setTeacher(response.teacher);
    }
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('upam_token');
    localStorage.removeItem('upam_user');
    localStorage.removeItem('upam_student');
    localStorage.removeItem('upam_teacher');
    setUser(null);
    setStudent(null);
    setTeacher(null);
  };

  const hasRole = (...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const roleLabel = user ? ROLE_LABELS[user.role] : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        teacher,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasRole,
        roleLabel,
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
