import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function StudentDashboard() {
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0, rate: 100.0, isBelowTarget: false });
  const [logs, setLogs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('userName') || 'Student';
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, subjectsRes] = await Promise.allSettled([
          API.get('/attendance/my-stats'),
          API.get('/academic/my-enrolled-subjects'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
          setStats(statsRes.value.data.stats);
          setLogs(statsRes.value.data.logs || []);
        }

        if (subjectsRes.status === 'fulfilled' && subjectsRes.value.data.success) {
          setIsEnrolled(subjectsRes.value.data.isEnrolled);
          setSubjects(subjectsRes.value.data.data || []);
          if (subjectsRes.value.data.program) {
            setProgramInfo({
              program: subjectsRes.value.data.program,
              section: subjectsRes.value.data.section,
              yearLevel: subjectsRes.value.data.yearLevel
            });
          }
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {userName}</h1>
          <p className="text-xs text-slate-500">Track your attendance and class schedules in real-time.</p>
        </div>
        <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg shadow-sm">
          {currentDate}
        </span>
      </div>

      {/* Pending Enrollment Banner */}
      {!loading && !isEnrolled && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔑</span>
            <div>
              <h4 className="text-xs font-bold">Enrollment Key Required</h4>
              <p className="text-[11px] text-amber-700">
                You have not yet unlocked your courses. Please enter the enrollment key issued by your administrator to assign your program and subjects.
              </p>
            </div>
          </div>
          <Link
            to="/student/subjects"
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition"
          >
            Enter Key Now →
          </Link>
        </div>
      )}

      {/* Target Alert Banner */}
      {!loading && stats.rate < 80.0 && stats.total > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-700 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-xs font-bold">Attendance Rate Notice</h4>
              <p className="text-[11px] text-rose-600">
                Your attendance rate is currently <strong>{stats.rate}%</strong>, below the 80.0% institutional threshold.
              </p>
            </div>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-1 rounded-full font-bold transition"
          >
            View Details
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Classes</span>
          <div className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? '—' : stats.total}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
          <div className="text-3xl font-bold text-emerald-600 mt-2">
            {loading ? '—' : stats.present}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
          <div className="text-3xl font-bold text-amber-500 mt-2">
            {loading ? '—' : stats.late}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
          <div className="text-3xl font-bold text-rose-500 mt-2">
            {loading ? '—' : stats.absent}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Attendance Records (2 cols) */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-800">Recent Attendance Records</h2>
            <Link to="/student/attendance" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading attendance records...</p>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No attendance records logged yet.</p>
              <p className="text-[11px] text-slate-300 mt-1">Records appear here once instructors submit daily class attendance.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {logs.slice(0, 5).map((item) => (
                  <tr key={item._id}>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.date}</td>
                    <td className="py-3.5 px-4 font-bold">{item.subjectId?.title || 'Subject'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'LATE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* My Enrolled Classes (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-800">My Classes</h2>
            <Link to="/student/subjects" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No enrolled subjects found.</p>
          ) : (
            <div className="space-y-3">
              {subjects.slice(0, 4).map((sub) => (
                <div key={sub._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{sub.code}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{sub.room}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">{sub.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sub.schedule}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}