import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';

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

  // Load available subjects for filter dropdown
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data.success) {
          setSubjects(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch attendance stats & logs whenever selectedSubject changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const endpoint = selectedSubject
          ? `/attendance/my-stats?subjectId=${selectedSubject}`
          : '/attendance/my-stats';
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

    fetchAttendanceData();
  }, [selectedSubject]);

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
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/student/subjects" className="text-xs font-semibold text-blue-600 hover:underline">
            ← Back to My Subjects
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {activeTitle} Attendance Record
          </h1>
          <p className="text-xs text-slate-400">
            Student: <strong className="text-slate-600">{studentName}</strong>
            {initialSection ? <> • Section: <strong className="text-slate-600">{initialSection}</strong></> : null}
          </p>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Filter Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.title} ({s.section})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Alert Banner (QA Issue: Minimum 80.0% Target) */}
      {!loading && stats.rate < 80.0 && stats.total > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-700 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold">Attendance Target Alert</h4>
              <p className="text-[11px] text-rose-600">
                Your current attendance rate is <strong>{stats.rate}%</strong>, which is below the institutional minimum threshold of <strong>80.0%</strong>.
              </p>
            </div>
          </div>
          <span className="text-xs bg-rose-100 text-rose-800 px-3 py-1 rounded-full font-bold">
            Action Required
          </span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.present}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
          <div className="text-3xl font-bold text-amber-500 mt-2">{stats.late}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
          <div className="text-3xl font-bold text-rose-500 mt-2">{stats.absent}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</span>
          <div className={`text-3xl font-bold mt-2 ${stats.rate >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats.rate}%
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Class Attendance History</h2>
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading attendance history...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No attendance records found for this selection.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Subject Code</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.date}</td>
                  <td className="py-3.5 px-4">{log.subjectId?.title || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-500">{log.subjectId?.code || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        log.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : log.status === 'LATE'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}