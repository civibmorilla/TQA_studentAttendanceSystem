import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import QrScanner from '../components/QrScanner';
import { todayLocal, downloadCsv, formatTime } from '../utils/date';

const STATUS_BUTTONS = [
  { key: 'PRESENT', label: 'P', title: 'Present', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' },
  { key: 'LATE', label: 'L', title: 'Late', activeClass: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' },
  { key: 'ABSENT', label: 'A', title: 'Absent', activeClass: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' },
  { key: 'EXCUSED', label: 'E', title: 'Excused', activeClass: 'bg-sky-100 text-sky-700 border-sky-200 shadow-sm' }
];

const METHOD_LABEL = { QR_SESSION: 'Scanned class QR', QR_ID: 'ID scanned', AUTO_ABSENT: 'Auto (no check-in)' };

export default function InstructorAttendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get('subjectId') || '');
  // BUGFIX: use the local date, not the UTC date
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'ok' | 'err', text }

  const [scanOpen, setScanOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState('PRESENT');
  const [scanLog, setScanLog] = useState([]);
  const [scanBusy, setScanBusy] = useState(false);

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);

  const flash = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data.success) setSubjects(res.data.data);
      } catch (err) {
        flash('err', err.response?.data?.message || 'Failed to load your subjects.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchRoster = useCallback(async () => {
    if (!selectedSubjectId || !selectedDate) return;
    setRosterLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        API.get(`/attendance/students?subjectId=${selectedSubjectId}`),
        API.get(`/attendance/class?subjectId=${selectedSubjectId}&date=${selectedDate}`)
      ]);
      const allStudents = studentsRes.data.data || [];
      const existingRecords = attendanceRes.data.data || [];

      setRoster(allStudents.map((student) => {
        const existing = existingRecords.find((r) => (r.studentId?._id || r.studentId) === student._id);
        return {
          studentId: student._id,
          name: student.fullName,
          userCustomId: student.userCustomId,
          status: existing ? existing.status : 'PRESENT',
          saved: Boolean(existing),
          method: existing?.method,
          checkedInAt: existing?.checkedInAt
        };
      }));
      setDirty(false);
    } catch (err) {
      flash('err', err.response?.data?.message || 'Failed to load roster.');
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  }, [selectedSubjectId, selectedDate]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  const handleToggle = (studentId, newStatus) => {
    setRoster((prev) => prev.map((item) => (item.studentId === studentId ? { ...item, status: newStatus } : item)));
    setDirty(true);
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedSubjectId || roster.length === 0) return;
    setSaving(true);
    try {
      await API.post('/attendance/class', {
        subjectId: selectedSubjectId,
        date: selectedDate,
        roster: roster.map((r) => ({ studentId: r.studentId, status: r.status }))
      });
      flash('ok', 'Attendance sheet saved.');
      await fetchRoster();
    } catch (err) {
      flash('err', err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Instructor scans a student's ID QR → saved immediately on the server
  const handleScan = async (payload) => {
    if (scanBusy) return;
    setScanBusy(true);
    try {
      const res = await API.post('/attendance/scan-student', {
        subjectId: selectedSubjectId,
        date: selectedDate,
        payload,
        status: scanStatus
      });
      const d = res.data.data;
      setScanLog((prev) => [{ ok: true, text: res.data.message, at: new Date() }, ...prev].slice(0, 8));
      setRoster((prev) => prev.map((r) => (r.studentId === d.studentId
        ? { ...r, status: d.status, saved: true, method: 'QR_ID', checkedInAt: new Date().toISOString() }
        : r)));
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (err) {
      setScanLog((prev) => [{ ok: false, text: err.response?.data?.message || 'Scan failed', at: new Date() }, ...prev].slice(0, 8));
    } finally {
      setScanBusy(false);
    }
  };

  const exportCsv = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await API.get(`/attendance/report?subjectId=${selectedSubjectId}`);
      const { subject, dates, rows } = res.data.data;
      const header = ['Student ID', 'Full Name', ...dates, 'Present', 'Late', 'Absent', 'Excused', 'Rate %'];
      const lines = rows.map((r) => [
        r.userCustomId,
        r.fullName,
        ...dates.map((d) => (r.statusByDate[d] ? r.statusByDate[d][0] : '')),
        r.stats.present, r.stats.late, r.stats.absent, r.stats.excused, r.stats.rate
      ]);
      downloadCsv(`${subject.code}_${subject.section}_attendance.csv`, [header, ...lines]);
    } catch (err) {
      flash('err', err.response?.data?.message || 'Export failed.');
    }
  };

  const counts = STATUS_BUTTONS.reduce((acc, b) => ({ ...acc, [b.key]: roster.filter((r) => r.status === b.key).length }), {});

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Sheet</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/instructor/qr-session${selectedSubjectId ? `?subjectId=${selectedSubjectId}` : ''}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            🔳 Start QR check-in
          </button>
          <button
            onClick={() => { setScanLog([]); setScanOpen(true); }}
            disabled={!selectedSubjectId}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm disabled:opacity-50"
            title={selectedSubjectId ? '' : 'Select a subject first'}
          >
            📷 Scan Student QR ID
          </button>
          <button
            onClick={exportCsv}
            disabled={!selectedSubjectId}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {notice && (
        <div className={`mb-4 p-3 rounded-xl border text-sm font-semibold ${notice.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {notice.type === 'ok' ? '✅' : '⚠️'} {notice.text}
        </div>
      )}

      {/* Cohort Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Select Class Cohort Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject / Class</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-700 bg-white outline-none focus:border-blue-500"
            >
              <option value="">Select a subject...</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.code} - {sub.title} ({sub.section})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              max={todayLocal()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-blue-500 rounded-lg p-2 text-sm font-medium text-blue-700 bg-blue-50/30 outline-none"
            />
          </div>
          {selectedSubject && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Details</label>
              <p className="text-sm text-slate-600 mt-1">
                <strong>Section:</strong> {selectedSubject.section} &bull; <strong>Room:</strong> {selectedSubject.room}
                <br /><strong>Schedule:</strong> {selectedSubject.schedule}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Student Roster Attendance Entry</h2>
            {roster.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {roster.length} students • <span className="text-emerald-600 font-semibold">{counts.PRESENT} P</span> •{' '}
                <span className="text-amber-600 font-semibold">{counts.LATE} L</span> •{' '}
                <span className="text-rose-600 font-semibold">{counts.ABSENT} A</span> •{' '}
                <span className="text-sky-600 font-semibold">{counts.EXCUSED} E</span>
                {dirty && <span className="ml-2 text-amber-600 font-bold">• unsaved changes</span>}
              </p>
            )}
          </div>
          {roster.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => markAll('PRESENT')} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">All present</button>
              <button onClick={() => markAll('ABSENT')} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">All absent</button>
            </div>
          )}
        </div>

        {loading || rosterLoading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Loading...</p>
        ) : !selectedSubjectId ? (
          <p className="text-sm text-slate-400 py-8 text-center">Select a subject above to view the roster.</p>
        ) : roster.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No students are enrolled in this class yet. Enroll them with an enrollment key or from Admin → Enrollment Keys.
          </p>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4 rounded-l-lg">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Attendance Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {roster.map((row, idx) => (
                  <tr key={row.studentId}>
                    <td className="py-4 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{row.name}</td>
                    <td className="py-4 px-4 text-slate-500">{row.userCustomId}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {!row.saved ? <span className="text-slate-300">not saved</span>
                        : METHOD_LABEL[row.method]
                          ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                              {METHOD_LABEL[row.method]}{row.checkedInAt && row.method !== 'AUTO_ABSENT' ? ` • ${formatTime(row.checkedInAt)}` : ''}
                            </span>
                          : 'Manual'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-1.5 mx-auto">
                        {STATUS_BUTTONS.map((btn) => {
                          const isActive = row.status === btn.key;
                          return (
                            <button
                              key={btn.key}
                              title={btn.title}
                              onClick={() => handleToggle(row.studentId, btn.key)}
                              className={`w-9 h-8 rounded-lg font-bold text-sm border transition-all ${
                                isActive ? btn.activeClass : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-8 border-t border-slate-100 pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {saving ? 'Saving...' : 'Save Attendance Sheet'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Scan student ID modal */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setScanOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Scan Student QR IDs</h3>
                <p className="text-xs text-slate-500">{selectedSubject?.code} • {selectedDate} • saves instantly</p>
              </div>
              <button onClick={() => setScanOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="flex gap-1.5 mb-4">
              {STATUS_BUTTONS.slice(0, 2).map((b) => (
                <button
                  key={b.key}
                  onClick={() => setScanStatus(b.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border ${scanStatus === b.key ? b.activeClass : 'border-slate-200 text-slate-400'}`}
                >
                  Mark as {b.title}
                </button>
              ))}
            </div>

            <QrScanner onScan={handleScan} paused={scanBusy} />

            <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
              {scanLog.length === 0 && <p className="text-xs text-slate-400 text-center">Hold a student's QR ID up to the camera.</p>}
              {scanLog.map((l, i) => (
                <div key={i} className={`text-xs font-semibold px-3 py-2 rounded-lg ${l.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {l.ok ? '✅' : '❌'} {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
