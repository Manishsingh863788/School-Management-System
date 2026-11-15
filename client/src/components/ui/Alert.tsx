import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
  }[type];

  const icons = {
    info: <Info className="h-5 w-5 text-sky-600 flex-shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    danger: <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
  }[type];

  return (
    <div className={`p-4 rounded-xl border flex gap-3 text-sm ${styles} ${className}`}>
      {icons}
      <div>
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
