import { useEffect, useState } from 'react';
import API from '../services/api';
import { useToast, errMsg } from '../components/Toast';
import { downloadCsv } from '../utils/date';

// Minimal CSV parser: handles quoted fields, commas and new lines inside quotes.
const parseCsv = (text) => {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
};

// Accept common header spellings
const HEADER_MAP = {
  userCustomId: ['userCustomId', 'student id', 'studentid', 'id', 'student no', 'student number'],
  fullName: ['fullName', 'full name', 'name', 'student name'],
  email: ['email', 'email address'],
  password: ['password'],
  contactNo: ['contactNo', 'contact', 'contact no', 'phone', 'mobile']
};
const norm = (s) => s.trim().toLowerCase().replace(/^\uFEFF/, '');

export default function AdminImport() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [fileName, setFileName] = useState('');
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enroll, setEnroll] = useState({ program: '', yearLevel: '1st Year', section: '', subjects: [] });
  const [results, setResults] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([API.get('/academic/programs'), API.get('/academic/subjects')])
      .then(([p, s]) => { setPrograms(p.data.data || []); setSubjects(s.data.data || []); })
      .catch((err) => toast.error(errMsg(err, 'Failed to load programs and subjects.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResults(null);
    setFileName(file.name);
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { toast.error('The file has no data rows.'); setStudents([]); return; }
    const headers = rows[0].map(norm);
    const index = {};
    Object.entries(HEADER_MAP).forEach(([key, names]) => {
      const i = headers.findIndex((h) => names.map((n) => n.toLowerCase()).includes(h));
      if (i >= 0) index[key] = i;
    });
    if (index.userCustomId === undefined || index.fullName === undefined || index.email === undefined) {
      toast.error('The first row must have columns: Student ID, Full Name, Email (Password and Contact are optional).');
      setStudents([]);
      return;
    }
    setStudents(rows.slice(1).map((r) => Object.fromEntries(Object.entries(index).map(([k, i]) => [k, (r[i] || '').trim()]))));
  };

  const sectionSubjects = subjects.filter((s) => enroll.section && s.section === enroll.section);
  const sections = [...new Set(subjects.map((s) => s.section))].sort();

  const doImport = async () => {
    setImporting(true);
    try {
      const body = { students };
      if (enroll.section) body.enrollment = enroll;
      const res = await API.post('/auth/users/bulk', body);
      setResults(res.data);
      toast.success(`${res.data.created} student account(s) created, ${res.data.skipped} skipped.`);
    } catch (err) {
      toast.error(errMsg(err, 'Import failed.'));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => downloadCsv('students_template.csv', [
    ['Student ID', 'Full Name', 'Email', 'Password', 'Contact'],
    ['2026-00001', 'Juan Dela Cruz', 'juan@example.edu.ph', '', '0917-000-0000']
  ]);

  const downloadPasswords = () => downloadCsv('imported_students_passwords.csv', [
    ['Row', 'Student ID', 'Full Name', 'Status', 'Temporary password', 'Reason'],
    ...results.results.map((r) => [r.row, r.userCustomId, r.fullName || '', r.status, r.temporaryPassword || '', r.reason || ''])
  ]);

  const input = 'w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white';
  const label = 'block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1';

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Import Students</h1>
      <p className="text-sm text-slate-600 mt-1 mb-6">Create many student accounts at once from a CSV file (Excel → Save As → CSV).</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">1. Choose the file</h2>
          <p className="text-sm text-slate-600">Columns: <strong>Student ID</strong> (official format <strong>YYYY-NNNNN</strong>, e.g. 2026-00123), <strong>Full Name, Email</strong>; optional <strong>Password</strong> (8+ characters) and <strong>Contact</strong>. Students without a password get a temporary one and must change it at first login.</p>
          <button onClick={downloadTemplate} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">⬇ Download template</button>
          <label className="block">
            <span className="sr-only">CSV file</span>
            <input type="file" accept=".csv,text/csv" onChange={onFile}
              className="block w-full text-sm text-slate-700 file:mr-3 file:px-4 file:py-2.5 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-bold" />
          </label>
          {fileName && <p className="text-sm text-slate-700">{fileName}: <strong>{students.length}</strong> student rows found</p>}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800">2. Enroll them (optional)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label} htmlFor="imp-prog">Program</label>
              <select id="imp-prog" className={input} value={enroll.program} onChange={(e) => setEnroll({ ...enroll, program: e.target.value })}>
                <option value="">—</option>
                {programs.map((p) => <option key={p._id} value={p._id}>{p.code}</option>)}
              </select></div>
            <div><label className={label} htmlFor="imp-year">Year level</label>
              <select id="imp-year" className={input} value={enroll.yearLevel} onChange={(e) => setEnroll({ ...enroll, yearLevel: e.target.value })}>
                {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'].map((y) => <option key={y}>{y}</option>)}
              </select></div>
          </div>
          <div><label className={label} htmlFor="imp-sec">Section</label>
            <select id="imp-sec" className={input} value={enroll.section}
              onChange={(e) => setEnroll({ ...enroll, section: e.target.value, subjects: subjects.filter((s) => s.section === e.target.value).map((s) => s._id) })}>
              <option value="">Don't enroll yet</option>
              {sections.map((s) => <option key={s}>{s}</option>)}
            </select></div>
          {sectionSubjects.length > 0 && (
            <fieldset>
              <legend className={label}>Subjects</legend>
              <div className="space-y-1.5">
                {sectionSubjects.map((s) => (
                  <label key={s._id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="w-5 h-5" checked={enroll.subjects.includes(s._id)}
                      onChange={(e) => setEnroll({ ...enroll, subjects: e.target.checked ? [...enroll.subjects, s._id] : enroll.subjects.filter((x) => x !== s._id) })} />
                    {s.code} – {s.title}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </div>

      {students.length > 0 && !results && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-800">3. Check and import</h2>
            <button onClick={doImport} disabled={importing} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300">
              {importing ? 'Importing…' : `Import ${students.length} students`}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm min-w-[520px]">
              <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><th className="py-2 px-3">Student ID</th><th className="py-2 px-3">Name</th><th className="py-2 px-3">Email</th><th className="py-2 px-3">Password</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {students.slice(0, 200).map((s, i) => (
                  <tr key={i}><td className="py-2 px-3">{s.userCustomId}</td><td className="py-2 px-3">{s.fullName}</td><td className="py-2 px-3">{s.email}</td>
                    <td className="py-2 px-3 text-slate-500">{s.password ? '••••••••' : 'auto'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
            <h2 className="text-base font-bold text-slate-800">Done: {results.created} created, {results.skipped} skipped</h2>
            <button onClick={downloadPasswords} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold">⬇ Download passwords (CSV)</button>
          </div>
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            Download the temporary passwords now: they are not shown again. Hand them out privately and delete the file afterwards.
          </p>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm min-w-[520px]">
              <thead><tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><th className="py-2 px-3">Row</th><th className="py-2 px-3">Student ID</th><th className="py-2 px-3">Result</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {results.results.map((r) => (
                  <tr key={r.row}><td className="py-2 px-3">{r.row}</td><td className="py-2 px-3">{r.userCustomId || '—'}</td>
                    <td className={`py-2 px-3 font-semibold ${r.status === 'CREATED' ? 'text-emerald-700' : 'text-amber-800'}`}>{r.status === 'CREATED' ? 'Created' : `Skipped: ${r.reason}`}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
