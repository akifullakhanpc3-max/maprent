import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { History, User, Clock, Activity, Search, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import '../../styles/views/Dashboards.css';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    (log.userId?.name.toLowerCase().includes(filter.toLowerCase()) || '')
  );

  if (loading) return (
    <div className="flex-center min-h-[400px]">
       <LoadingSpinner size="large" />
    </div>
  );

  return (
    <div className="flex-col gap-8 animate-fade-in">
      {/* HEADER */}
      <div className="console-card flex-between items-center !p-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex-center text-white shadow-xl shadow-indigo-100">
            <History size={28} />
          </div>
          <div className="flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">Platform Audit Trail</h1>
            <p className="page-subtitle">Historical record of system modifications and security events.</p>
          </div>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search operations or users..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-base pl-11"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper animate-slide-up">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Trace Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:!bg-slate-50/50">
                  <td>
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-[11px] font-bold tabular-nums uppercase">
                        {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • 
                        {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex-center bg-slate-50 text-slate-400 border border-slate-100">
                        <User size={14} />
                      </div>
                      <div className="flex-col gap-0.5">
                        <p className="text-xs font-bold text-slate-900 leading-none">{log.userId?.name || 'ROOT System'}</p>
                        <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">{log.userId?.role || 'Daemon'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${
                      log.action.includes('ERROR') || log.action.includes('DELETE') ? 'error' : 
                      log.action.includes('CREATE') || log.action.includes('UPDATE') ? 'success' :
                      'info'
                    } !px-3 !py-1 text-[10px] uppercase font-bold tracking-wider`}>
                      <Activity size={10} className="mr-1.5" />
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <code className="text-[9px] font-bold text-slate-500 font-mono bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 max-w-[300px] truncate block opacity-70 hover:opacity-100 transition-opacity cursor-default">
                      {JSON.stringify(log.metadata) || 'No meta trace'}
                    </code>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="!p-24 text-center">
                    <div className="flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex-center text-slate-200">
                        <ShieldCheck size={32} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Integrity verified • No records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
