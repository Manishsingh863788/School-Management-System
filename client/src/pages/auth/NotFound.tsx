import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 mx-auto mb-4">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Page Not Found (404)</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The requested route does not exist in EduManage or may have been relocated.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" icon={<Home className="h-4 w-4" />} onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
