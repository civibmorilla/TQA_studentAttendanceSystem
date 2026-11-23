import React, { useEffect, useState } from 'react';
import API from '../services/api';

const EMPTY = {
  code: '', title: '', program: '', yearLevel: '1st Year', section: '',
  instructor: '', schedule: '', room: ''
};

const inputCls = 'w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-700 bg-white outline-none focus:border-blue-500';
const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const [s, p, u] = await Promise.all([
        API.get('/academic/subjects'),
        API.get('/academic/programs'),
        API.get('/auth/users')
      ]);
      setSubjects(s.data.data || []);
      setPrograms(p.data.data || []);
      setInstructors((u.data.data || []).filter((x) => x.role === 'INSTRUCTOR' && x.isActive !== false));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    const prog = programs[0];
    setForm({ ...EMPTY, program: prog?._id || '', section: prog ? `${prog.code}-101` : '', instructor: instructors[0]?._id || '' });
    setEditingId(null);
    setError('');
    setOpen(true);
  };

  const openEdit = (s) => {
    setForm({
      code: s.code, title: s.title, program: s.program?._id || s.program, yearLevel: s.yearLevel,
      section: s.section, instructor: s.instructor?._id || s.instructor, schedule: s.schedule, room: s.room
    });
    setEditingId(s._id);
    setError('');
    setOpen(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'program' && !editingId) {
        const prog = programs.find((p) => p._id === value);
        if (prog) next.section = `${prog.code}-101`;
      }
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await API.put(`/academic/subjects/${editingId}`, form);
      else await API.post('/academic/subjects', form);
      setNotice(editingId ? 'Subject updated.' : `Subject ${form.code} created.`);
      setTimeout(() => setNotice(''), 4000);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save subject.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.code} – ${s.title} (${s.section})? Students will be unenrolled from it. Existing attendance records are kept.`)) return;
    try {
      await API.delete(`/academic/subjects/${s._id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete subject.');
    }
  };

  const shown = subjects.filter((s) =>
    !filter || `${s.code} ${s.title} ${s.section} ${s.instructor?.fullName || ''}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects & Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Create class offerings and assign them to instructors, sections and rooms.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!programs.length || !instructors.length}
          title={!programs.length ? 'Create a program first' : !instructors.length ? 'Create an instructor account first' : ''}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm disabled:bg-slate-300"
        >
          + New Subject
        </button>
      </div>

      {notice && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">✅ {notice}</div>}
      {error && !open && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">⚠️ {error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by code, title, section or instructor…"
          className={`${inputCls} mb-4 max-w-sm`}
        />
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No subjects yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Program / Section</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Schedule / Room</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {shown.map((s) => (
                <tr key={s._id}>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{s.title}</div>
                    <div className="text-xs text-blue-600 font-bold">{s.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{s.program?.code || '—'} • {s.section}<div className="text-xs text-slate-400">{s.yearLevel}</div></td>
                  <td className="py-3.5 px-4 text-slate-600">{s.instructor?.fullName || <span className="text-rose-500">Unassigned</span>}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.schedule}<div className="text-xs text-slate-400">{s.room}</div></td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50">Edit</button>
                    <button onClick={() => remove(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{editingId ? 'Edit Subject' : 'New Subject'}</h3>
            {error && <div className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">⚠️ {error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Code</label><input required name="code" value={form.code} onChange={onChange} placeholder="TQA-301" className={inputCls} /></div>
              <div><label className={labelCls}>Title</label><input required name="title" value={form.title} onChange={onChange} placeholder="Test and Quality Assurance" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Program</label>
                <select required name="program" value={form.program} onChange={onChange} className={inputCls}>
                  {programs.map((p) => <option key={p._id} value={p._id}>{p.code} – {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Year Level</label>
                <select name="yearLevel" value={form.yearLevel} onChange={onChange} className={inputCls}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Section</label><input required name="section" value={form.section} onChange={onChange} placeholder="BSCpE-301" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Instructor</label>
                <select required name="instructor" value={form.instructor} onChange={onChange} className={inputCls}>
                  {instructors.map((i) => <option key={i._id} value={i._id}>{i.fullName} ({i.userCustomId})</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Schedule</label><input required name="schedule" value={form.schedule} onChange={onChange} placeholder="Mon/Wed 8:30 AM - 10:00 AM" className={inputCls} /></div>
              <div><label className={labelCls}>Room</label><input required name="room" value={form.room} onChange={onChange} placeholder="Room 204" className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300">
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create subject'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
