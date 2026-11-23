import { useEffect, useState } from 'react';
import API from '../services/api';
import { useToast, errMsg } from '../components/Toast';

const FILTERS = [
  { value: '', label: 'All activity' },
  { value: 'attendance', label: 'Attendance changes' },
  { value: 'session', label: 'QR sessions' },
  { value: 'excuse', label: 'Excuse letters' },
  { value: 'user', label: 'Accounts & passwords' },
  { value: 'subject', label: 'Subjects' },
  { value: 'term', label: 'Terms' }
];

const fmt = (d) => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminAudit() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    API.get(`/auth/audit-logs${filter ? `?action=${filter}` : ''}`)
      .then((res) => { if (alive) setLogs(res.data.data || []); })
      .catch((err) => toast.error(errMsg(err, 'Failed to load the audit log.')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
          <p className="text-sm text-slate-600 mt-1">Who changed what, and when. Shows the latest 200 entries.</p>
        </div>
        <select aria-label="Filter activity" value={filter} onChange={(e) => { setLoading(true); setFilter(e.target.value); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 bg-white">
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 overflow-x-auto">
        {loading ? <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
          : logs.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">No activity recorded yet.</p>
            : (
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><th className="py-3 px-3">When</th><th className="py-3 px-3">Who</th><th className="py-3 px-3">What happened</th><th className="py-3 px-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((l) => (
                    <tr key={l._id}>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{fmt(l.createdAt)}</td>
                      <td className="py-3 px-3"><span className="font-semibold text-slate-800">{l.actorName || 'System'}</span>
                        {l.actorRole && <span className="block text-xs text-slate-500">{l.actorRole.toLowerCase()}</span>}</td>
                      <td className="py-3 px-3 text-slate-700">{l.summary}</td>
                      <td className="py-3 px-3"><code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{l.action}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}
