import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import TermSelect from '../components/TermSelect';
import { useToast, errMsg } from '../components/Toast';
import { todayLocal } from '../utils/date';

const EXCUSE_BADGE = { PENDING: 'bg-amber-100 text-amber-900', APPROVED: 'bg-emerald-100 text-emerald-800', REJECTED: 'bg-rose-100 text-rose-800' };

export default function StudentAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId') || '';
  const initialTitle = searchParams.get('title') || 'Overall';
  const initialSection = searchParams.get('section') || '';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(subjectId);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0, rate: 100.0, isBelowTarget: false });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentName = localStorage.getItem('userName') || 'Student';

  const [isEnrolled, setIsEnrolled] = useState(true);
  const toast = useToast();
  const [termId, setTermId] = useState(undefined);
  const [excuses, setExcuses] = useState([]);
  const [excuseForm, setExcuseForm] = useState(null); // { subjectId, date, reason }
  const [sendingExcuse, setSendingExcuse] = useState(false);

  const loadExcuses = () => API.get('/excuses/mine').then((r) => setExcuses(r.data.data || [])).catch(() => {});
  useEffect(() => { loadExcuses(); }, []);

  const submitExcuse = async (e) => {
    e.preventDefault();
    setSendingExcuse(true);
    try {
      const res = await API.post('/excuses', excuseForm);
      toast.success(res.data.message);
      setExcuseForm(null);
      loadExcuses();
    } catch (err) {
      toast.error(errMsg(err, 'Could not send the excuse letter.'));
    } finally {
      setSendingExcuse(false);
    }
  };

  // Load available subjects for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/my-enrolled-subjects');
        if (res.data.success) {
          setIsEnrolled(res.data.isEnrolled);
          setSubjects(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load enrolled subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch attendance stats & logs whenever selectedSubject changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedSubject) params.set('subjectId', selectedSubject);
        if (termId) params.set('termId', termId);
        const endpoint = `/attendance/my-stats${params.toString() ? `?${params}` : ''}`;
        const res = await API.get(endpoint);
        if (res.data.success) {
          setStats(res.data.stats);
          setLogs(res.data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load attendance statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (termId === undefined) return; // wait until the term filter has loaded
    fetchAttendanceData();
  }, [selectedSubject, termId]);

  const handleSubjectChange = (newSubId) => {
    setSelectedSubject(newSubId);
    if (newSubId) {
      const match = subjects.find(s => s._id === newSubId);
      setSearchParams({
        subjectId: newSubId,
        title: match ? match.title : '',
        section: match ? match.section : ''
      });
    } else {
      setSearchParams({});
    }
  };

  const activeTitle = selectedSubject
    ? (subjects.find(s => s._id === selectedSubject)?.title || initialTitle)
    : 'All Subjects';

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <Link to="/student/subjects" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Back to My Subjects
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {activeTitle} Attendance Record
          </h1>
          <p className="text-sm text-slate-400">
            Student: <strong className="text-slate-600">{studentName}</strong>
            {initialSection ? <> • Section: <strong className="text-slate-600">{initialSection}</strong></> : null}
          </p>
        </div>

        {/* Filters + excuse action */}
        <div className="flex flex-wrap items-center justify-end gap-2 max-w-xl">
          <TermSelect value={termId} onChange={setTermId} />
          <select
            aria-label="Filter by subject"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 max-w-[260px]"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setExcuseForm({ subjectId: selectedSubject || subjects[0]?._id || '', date: todayLocal(), reason: '' })}
            disabled={!subjects.length}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 whitespace-nowrap"
          >
            ✉️ File excuse letter
          </button>
        </div>
      </div>

      {/* Target Alert Banner (QA Issue: Minimum 80.0% Target) */}
      {!loading && stats.rate < 80.0 && stats.total > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-700 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold">Attendance Target Alert</h4>
              <p className="text-xs text-rose-600">
                Your current attendance rate is <strong>{stats.rate}%</strong>, which is below the institutional minimum threshold of <strong>80.0%</strong>.
              </p>
            </div>
          </div>
          <span className="text-sm bg-rose-100 text-rose-800 px-3 py-1 rounded-full font-bold">
            Action Required
          </span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Present</span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.present}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Late</span>
          <div className="text-3xl font-bold text-amber-500 mt-2">{stats.late}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Absent</span>
          <div className="text-3xl font-bold text-rose-500 mt-2">{stats.absent}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Attendance Rate</span>
          <div className={`text-3xl font-bold mt-2 ${stats.rate >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.rate}%
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Class Attendance History</h2>
        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading attendance history...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No attendance records found for this selection.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.date}</td>
                  <td className="py-3.5 px-4">{log.subjectId?.title || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-500">{log.subjectId?.code || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : log.status === 'LATE'
                          ? 'bg-amber-100 text-amber-700'
                          : log.status === 'EXCUSED'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {log.status}
                    </span>
                    {(log.status === 'ABSENT' || log.status === 'LATE') && (
                      <button
                        onClick={() => setExcuseForm({ subjectId: log.subjectId?._id || '', date: log.date, reason: '' })}
                        className="ml-3 text-sm font-semibold text-blue-700 hover:underline"
                      >
                        File excuse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* My excuse letters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mt-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">My Excuse Letters</h2>
        {excuses.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No excuse letters yet. Use "File excuse" next to an absence or late mark.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {excuses.map((x) => (
              <li key={x._id} className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{x.subject?.code} – {x.subject?.title} · {x.date}</p>
                  <p className="text-slate-600 mt-0.5">{x.reason}</p>
                  {x.reviewNote && <p className="text-slate-500 mt-0.5 italic">Instructor: "{x.reviewNote}"</p>}
                </div>
                <span className={`h-fit px-3 py-1 rounded-full text-xs font-bold ${EXCUSE_BADGE[x.status]}`}>{x.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {excuseForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setExcuseForm(null)}>
          <form onSubmit={submitExcuse} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" aria-labelledby="ex-title">
            <h2 id="ex-title" className="text-lg font-bold text-slate-800">File an excuse letter</h2>
            <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">Subject
              <select required value={excuseForm.subjectId} onChange={(e) => setExcuseForm({ ...excuseForm, subjectId: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 bg-white">
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} – {s.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">Class date
              <input type="date" required value={excuseForm.date} onChange={(e) => setExcuseForm({ ...excuseForm, date: e.target.value })}
                className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-800" />
            </label>
            <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider">Reason
              <textarea required minLength={10} rows={4} value={excuseForm.reason} onChange={(e) => setExcuseForm({ ...excuseForm, reason: e.target.value })}
                placeholder="e.g. I was sick and have a medical certificate from the clinic."
                className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium normal-case tracking-normal text-slate-800" />
            </label>
            <p className="text-xs text-slate-500">Bring any supporting document (e.g. medical certificate) to your instructor.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setExcuseForm(null)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={sendingExcuse} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300">
                {sendingExcuse ? 'Sending…' : 'Send to instructor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}