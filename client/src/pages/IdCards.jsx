import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import API from '../services/api';
import { useToast, errMsg } from '../components/Toast';

// Printable QR ID cards (8 per A4 page). The QR is the same signed ID shown in
// each student's portal, so an instructor can scan the printed card instead.
export default function IdCards() {
  const toast = useToast();
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [section, setSection] = useState('');
  const [cards, setCards] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/academic/subjects')
      .then((res) => setSubjects(res.data.data || []))
      .catch((err) => toast.error(errMsg(err, 'Failed to load classes.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (query) => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance/id-cards?${query}`);
      setCards(res.data.data || []);
      setTitle(res.data.title || '');
      if (!res.data.data?.length) toast.info('No students found for that selection.');
    } catch (err) {
      toast.error(errMsg(err, 'Could not load ID cards.'));
    } finally {
      setLoading(false);
    }
  };

  const sections = [...new Set(subjects.map((s) => s.section))].sort();

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen print-area">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-800">QR ID Cards</h1>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Print ID cards for students without a phone. Instructors scan them on the Attendance Sheet with "Scan Student QR ID".
        </p>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
          <div className="min-w-[260px]">
            <label htmlFor="idc-subject" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Class</label>
            <select id="idc-subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSection(''); if (e.target.value) load(`subjectId=${e.target.value}`); }}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
              <option value="">Select a class…</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} – {s.title} ({s.section})</option>)}
            </select>
          </div>
          {isAdmin && (
            <div className="min-w-[200px]">
              <label htmlFor="idc-section" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">…or a whole section</label>
              <select id="idc-section" value={section} onChange={(e) => { setSection(e.target.value); setSubjectId(''); if (e.target.value) load(`section=${encodeURIComponent(e.target.value)}`); }}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                <option value="">Select a section…</option>
                {sections.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <button onClick={() => window.print()} disabled={!cards.length}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300">
            🖨 Print {cards.length ? `${cards.length} cards` : ''}
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-500 py-8 text-center">Loading…</p> : cards.length > 0 && (
        <>
          <p className="text-sm font-semibold text-slate-600 mb-3 no-print">{title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c._id} className="id-card bg-white border-2 border-slate-300 rounded-2xl p-4 flex gap-4 items-center">
                <QRCodeSVG value={c.payload} size={120} level="M" marginSize={1} />
                <div className="min-w-0">
                  <p className="text-xs font-black text-blue-700 uppercase tracking-wider">ClassPulse Student ID</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{c.fullName}</p>
                  <p className="text-sm text-slate-700">{c.userCustomId}</p>
                  <p className="text-sm text-slate-500">{[c.program, c.section].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
