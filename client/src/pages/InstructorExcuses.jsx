import { useEffect, useState } from 'react';
import API from '../services/api';
import { useToast, errMsg } from '../components/Toast';

const BADGE = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800'
};

export default function InstructorExcuses() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = async (s = status) => {
    try {
      const res = await API.get(`/excuses/review${s ? `?status=${s}` : ''}`);
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to load excuse letters.'));
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(status); }, [status]);

  const review = async (item, decision) => {
    setBusyId(item._id);
    try {
      await API.patch(`/excuses/${item._id}`, { status: decision, note: notes[item._id] || '' });
      toast.success(decision === 'APPROVED'
        ? `Approved. ${item.student?.fullName} is marked EXCUSED for ${item.date}.`
        : 'Excuse rejected.');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Excuse Letters</h1>
          <p className="text-sm text-slate-600 mt-1">Approving marks that class day as EXCUSED, which does not lower the student's rate.</p>
        </div>
        <div className="flex bg-slate-200/60 p-1 rounded-xl text-sm font-semibold" role="tablist">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
            <button key={s || 'ALL'} role="tab" aria-selected={status === s} onClick={() => { setLoading(true); setStatus(s); }}
              className={`px-4 py-2 rounded-lg ${status === s ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600'}`}>
              {s ? s[0] + s.slice(1).toLowerCase() : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
        : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Nothing here</p>
            <p className="text-sm text-slate-500 mt-1">Students file excuse letters from their Attendance page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{item.student?.fullName} <span className="text-sm font-normal text-slate-500">· {item.student?.userCustomId}</span></p>
                    <p className="text-sm text-slate-600">{item.subject?.code} – {item.subject?.title} ({item.subject?.section}) · class on <strong>{item.date}</strong></p>
                  </div>
                  <span className={`h-fit px-3 py-1 rounded-full text-xs font-bold ${BADGE[item.status]}`}>{item.status}</span>
                </div>
                <p className="mt-3 p-3 rounded-lg bg-slate-50 text-sm text-slate-700 whitespace-pre-wrap">{item.reason}</p>
                {item.status === 'PENDING' ? (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <input aria-label="Note to student (optional)" placeholder="Note to student (optional)" value={notes[item._id] || ''}
                      onChange={(e) => setNotes({ ...notes, [item._id]: e.target.value })}
                      className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <button disabled={busyId === item._id} onClick={() => review(item, 'APPROVED')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                    <button disabled={busyId === item._id} onClick={() => review(item, 'REJECTED')} className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 text-sm font-bold hover:bg-rose-50 disabled:opacity-50">Reject</button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    {item.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {item.reviewedBy?.fullName || '—'}
                    {item.reviewNote ? ` · "${item.reviewNote}"` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
