import { useEffect, useState } from 'react';
import API from '../services/api';
import { useToast, errMsg } from '../components/Toast';

const EMPTY = { name: '', startDate: '', endDate: '', isActive: true };
const input = 'w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white outline-none focus:border-blue-600';
const label = 'block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1';

export default function AdminTerms() {
  const toast = useToast();
  const [terms, setTerms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await API.get('/terms');
      setTerms(res.data.data || []);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to load terms.'));
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await API.put(`/terms/${editingId}`, form);
      else await API.post('/terms', form);
      toast.success(editingId ? 'Term updated.' : `Term "${form.name}" created.`);
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save term.'));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (t) => {
    try {
      await API.put(`/terms/${t._id}`, { isActive: true });
      toast.success(`${t.name} is now the current term.`);
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete term "${t.name}"? Attendance records are kept; only the term label is removed.`)) return;
    try {
      await API.delete(`/terms/${t._id}`);
      toast.success('Term deleted.');
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Academic Terms</h1>
      <p className="text-sm text-slate-600 mt-1 mb-6">
        Define semesters so attendance rates, reports and exports can be filtered per term. The current term shows in everyone's sidebar.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={save} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-800">{editingId ? 'Edit term' : 'New term'}</h2>
          <div><label className={label} htmlFor="t-name">Name</label>
            <input id="t-name" required className={input} placeholder="1st Semester, AY 2026–2027" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label} htmlFor="t-start">Starts</label>
              <input id="t-start" type="date" required className={input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className={label} htmlFor="t-end">Ends</label>
              <input id="t-end" type="date" required className={input} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="w-5 h-5" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Make this the current term
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create term'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {loading ? <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
            : terms.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">No terms yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first semester on the left, e.g. "1st Semester, AY 2026–2027".</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><th className="py-3 px-3">Term</th><th className="py-3 px-3">Dates</th><th className="py-3 px-3">Status</th><th className="py-3 px-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {terms.map((t) => (
                    <tr key={t._id}>
                      <td className="py-3 px-3 font-bold text-slate-800">{t.name}</td>
                      <td className="py-3 px-3 text-slate-600">{t.startDate} → {t.endDate}</td>
                      <td className="py-3 px-3">{t.isActive
                        ? <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">Current</span>
                        : <button onClick={() => setActive(t)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">Make current</button>}</td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button onClick={() => { setEditingId(t._id); setForm({ name: t.name, startDate: t.startDate, endDate: t.endDate, isActive: t.isActive }); }} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                        <button onClick={() => remove(t)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}
