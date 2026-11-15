import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleReturn = () => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'TEACHER') navigate('/teacher/dashboard');
    else if (role === 'GUARDIAN') navigate('/guardian/dashboard');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied (403 Forbidden)</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          You do not have administrative or operational permissions to access this specific module.
          EduManage uses server-enforced role-based access control.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" icon={<ArrowLeft className="h-4 w-4" />} onClick={handleReturn}>
            Return to Authorized Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
