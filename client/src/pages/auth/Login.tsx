import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      const user = JSON.parse(localStorage.getItem('edumanage_user') || '{}');
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'TEACHER') navigate('/teacher/dashboard');
      else navigate('/guardian/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          EduManage Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to access your role-based academic dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@edumanage.academy"
                  className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
              Sign In to EduManage
            </Button>
          </form>

          {/* Quick Demo Credentials for Assessment */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Demo Personas
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoRole('admin@edumanage.academy')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors text-center"
              >
                <ShieldCheck className="h-4 w-4 text-rose-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('sarah.jenkins@edumanage.academy')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors text-center"
              >
                <GraduationCap className="h-4 w-4 text-sky-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('john.smith.parent@example.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors text-center"
              >
                <UserCheck className="h-4 w-4 text-emerald-600 mb-1" />
                <span className="text-[11px] font-semibold text-slate-800">Guardian</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              All demo accounts use password: <code className="font-mono">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
