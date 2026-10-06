import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';

export default function InstructorAttendance() {
  const [searchParams] = useSearchParams();
  const subjectIdFromUrl = searchParams.get('subjectId') || '';
  const sectionFromUrl = searchParams.get('section') || '';

  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectIdFromUrl);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch subjects and programs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, programsRes] = await Promise.all([
          API.get('/academic/subjects'),
          API.get('/academic/programs'),
        ]);
        if (subjectsRes.data.success) setSubjects(subjectsRes.data.data);
        if (programsRes.data.success) setPrograms(programsRes.data.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get the selected subject details
  const selectedSubject = subjects.find(s => s._id === selectedSubjectId);

  // When subject or date changes, fetch the roster
  useEffect(() => {
    if (!selectedSubjectId || !selectedDate) return;

    const fetchRoster = async () => {
      try {
        // Fetch students
        const studentsRes = await API.get(`/attendance/students?section=${selectedSubject?.section || sectionFromUrl}`);
        const allStudents = studentsRes.data.success ? studentsRes.data.data : [];

        // Fetch existing attendance records
        const attendanceRes = await API.get(`/attendance/class?subjectId=${selectedSubjectId}&date=${selectedDate}`);
        const existingRecords = attendanceRes.data.success ? attendanceRes.data.data : [];

        // Merge: set status from existing records, default to PRESENT
        const mergedRoster = allStudents.map(student => {
          const existing = existingRecords.find(r => 
            (r.studentId?._id || r.studentId) === student._id
          );
          return {
            studentId: student._id,
            name: student.fullName,
            userCustomId: student.userCustomId,
            status: existing ? existing.status : 'PRESENT',
          };
        });

        setStudents(allStudents);
        setRoster(mergedRoster);
      } catch (err) {
        console.error('Failed to load roster:', err);
      }
    };
    fetchRoster();
  }, [selectedSubjectId, selectedDate]);

  const handleToggle = (studentId, newStatus) => {
    setRoster(prev => prev.map(item => 
      item.studentId === studentId ? { ...item, status: newStatus } : item
    ));
  };

  const handleSave = async () => {
    if (!selectedSubjectId || roster.length === 0) return;
    setSaving(true);
    try {
      await API.post('/attendance/class', {
        subjectId: selectedSubjectId,
        date: selectedDate,
        roster: roster.map(r => ({ studentId: r.studentId, status: r.status })),
      });
      alert('Attendance sheet saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Daily Attendance Sheet</h1>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm">
            📷 Scan Student Barcode / QR ID
          </button>
        </div>
      </div>

      {/* Cohort Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Select Class Cohort Details</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject / Class</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-500"
            >
              <option value="">Select a subject...</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>
                  {sub.code} - {sub.title} ({sub.section})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-blue-500 rounded-lg p-2 text-xs font-medium text-blue-700 bg-blue-50/30 outline-none"
            />
          </div>
          {selectedSubject && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Details</label>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Section:</strong> {selectedSubject.section} &bull; <strong>Room:</strong> {selectedSubject.room}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-800">Student Roster Attendance Entry</h2>
          {selectedSubject && (
            <span className="text-xs text-slate-500">
              Class Cohort: <strong className="text-slate-700">{selectedSubject.section} / {selectedSubject.title}</strong>
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading...</p>
        ) : !selectedSubjectId ? (
          <p className="text-xs text-slate-400 py-8 text-center">Select a subject above to view the roster.</p>
        ) : roster.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No students found for this section.</p>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4 rounded-l-lg">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4 text-center rounded-r-lg">Attendance Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {roster.map((row, idx) => (
                  <tr key={row.studentId}>
                    <td className="py-4 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{row.name}</td>
                    <td className="py-4 px-4 text-slate-500">{row.userCustomId}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-1.5 mx-auto">
                        {[
                          { key: 'PRESENT', label: 'P', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' },
                          { key: 'LATE', label: 'L', activeClass: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' },
                          { key: 'ABSENT', label: 'A', activeClass: 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' }
                        ].map(btn => {
                          const isActive = row.status === btn.key;
                          return (
                            <button
                              key={btn.key}
                              onClick={() => handleToggle(row.studentId, btn.key)}
                              className={`w-9 h-8 rounded-lg font-bold text-xs border transition-all ${
                                isActive 
                                  ? btn.activeClass 
                                  : 'bg-white border-slate-100 text-slate-300 hover:text-slate-500 hover:border-slate-300'
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
                className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {saving ? 'Saving...' : 'Save Attendance Sheet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}