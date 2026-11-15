import React from 'react';
import { BarChart3, Download, FileSpreadsheet, Users, CalendarCheck, CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { reportService } from '../../services/report.service';

export const ReportsView: React.FC = () => {
  const handleExport = (type: 'students' | 'fees' | 'attendance') => {
    window.open(reportService.exportCsvUrl(type), '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Export institutional datasets in CSV format for analysis, compliance, and archiving.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report 1: Student Enrollment */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-3 w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Student Enrollment Report</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Complete active student roll, including admission numbers, date of birth, gender, class cohort,
            and enrollment status.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<Download className="h-4 w-4" />}
              onClick={() => handleExport('students')}
            >
              Export CSV Spreadsheet
            </Button>
          </div>
        </Card>

        {/* Report 2: Attendance Ledger */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-3 w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Daily Attendance Ledger</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Audit trail of roll call submissions by instructional staff, session records (Morning/Afternoon),
            and status breakdown.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<Download className="h-4 w-4" />}
              onClick={() => handleExport('attendance')}
            >
              Export CSV Spreadsheet
            </Button>
          </div>
        </Card>

        {/* Report 3: Fee Collection & Dues */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-3 w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-4">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Fee Collection & Dues</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Reconciliation report with invoice totals, paid amounts, outstanding balances, and settlement
            statuses.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              icon={<Download className="h-4 w-4" />}
              onClick={() => handleExport('fees')}
            >
              Export CSV Spreadsheet
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
