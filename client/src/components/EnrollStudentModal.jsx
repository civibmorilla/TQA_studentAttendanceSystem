import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import { useToast } from './Toast';

// Group subjects by program + section, e.g. "BSCPE-DEMO · DEMO-301"
function groupClasses(subjects) {
  const map = new Map();
  subjects.forEach((s) => {
    const key = `${s.program?._id || ''}|${s.section}`;
    if (!map.has(key)) {
      map.set(key, { key, programId: s.program?._id, programCode: s.program?.code || '', section: s.section, yearLevel: s.yearLevel, subjects: [] });
    }
    map.get(key).subjects.push(s);
  });
  return [...map.values()].sort((a, b) => a.section.localeCompare(b.section));
}

// Admin: enroll a student in a class (section) without an enrollment key.
// Classes are built from the existing subjects: every subject belongs to a section.
export default function EnrollStudentModal({ student, onClose, onDone }) {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionKey, setSectionKey] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/academic/subjects')
      .then((res) => {
        const list = res.data.data || [];
        setSubjects(list);
        // Preselect the student's current class, if they already have one
        const mine = groupClasses(list).find((c) => c.section === student.section);
        if (mine) {
          setSectionKey(mine.key);
          const enrolled = (student.enrolledSubjects || []).map(String);
          const inClass = mine.subjects.filter((s) => enrolled.includes(String(s._id))).map((s) => s._id);
          setSelected(inClass.length ? inClass : mine.subjects.map((s) => s._id));
        }
      })
      .catch(() => setError('Could not load the classes. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [student]);

  const classes = useMemo(() => groupClasses(subjects), [subjects]);

  const current = classes.find((c) => c.key === sectionKey);

  const chooseClass = (key) => {
    setSectionKey(key);
    const c = classes.find((x) => x.key === key);
    setSelected(c ? c.subjects.map((s) => s._id) : []); // all subjects of the class by default
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current) return setError('Choose a class first.');
    if (!selected.length) return setError('Select at least one subject.');
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/academic/assign-student', {
        studentId: student._id,
        programId: current.programId,
        yearLevel: current.yearLevel,
        section: current.section,
        subjects: selected
      });
      toast.success(res.data.message);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not enroll the student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="enroll-title">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 id="enroll-title" className="text-lg font-bold text-slate-800">
          {student.isEnrolled ? 'Change class' : 'Enroll student'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          {student.fullName} <span className="font-mono">({student.userCustomId})</span>
        </p>

        {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading classes…</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-slate-600 py-4">
            There are no classes yet. Create subjects first in <strong>Subjects &amp; Classes</strong>; each subject belongs to a section.
          </p>
        ) : (
          <>
            <label htmlFor="enroll-class" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Class (section)</label>
            <select
              id="enroll-class"
              value={sectionKey}
              onChange={(e) => chooseClass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm mb-5"
              required
            >
              <option value="">Choose a class…</option>
              {classes.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.section} · {c.programCode} · {c.yearLevel} ({c.subjects.length} subject{c.subjects.length === 1 ? '' : 's'})
                </option>
              ))}
            </select>

            {current && (
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-500 mb-2 uppercase">Subjects</legend>
                <ul className="space-y-2">
                  {current.subjects.map((s) => (
                    <li key={s._id}>
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" className="mt-1 w-4 h-4" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} />
                        <span className="text-sm">
                          <strong className="text-slate-800">{s.code}</strong> · {s.title}
                          <span className="block text-slate-500">{s.schedule} · {s.instructor?.fullName || 'No instructor yet'}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold">Cancel</button>
          <button
            type="submit"
            disabled={saving || !current}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold"
          >
            {saving ? 'Saving…' : student.isEnrolled ? 'Save class' : 'Enroll'}
          </button>
        </div>
      </form>
    </div>
  );
}
