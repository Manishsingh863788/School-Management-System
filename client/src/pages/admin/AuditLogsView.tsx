import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditService } from '../../services/audit.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditService.listLogs({ page, limit: 15 });
      setLogs(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalLogs(res.meta.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            Non-repudiation audit trail recording all material data mutations ({totalLogs} events).
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={fetchLogs}
        >
          Refresh
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Entity</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Metadata Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No audit records on file.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {log.entityType} {log.entityId ? `(#${log.entityId.slice(0, 8)}...)` : ''}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {log.user?.email || 'System / Automated'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft className="h-3.5 w-3.5" />}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
