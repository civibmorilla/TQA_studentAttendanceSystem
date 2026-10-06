import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function StudentSubjects() {
  const [courses, setCourses] = useState([]);
  const [programInfo, setProgramInfo] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Key redemption state
  const [enrollmentKeyInput, setEnrollmentKeyInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMySubjects = async () => {
    try {
      const res = await API.get('/academic/my-enrolled-subjects');
      if (res.data.success) {
        setIsEnrolled(res.data.isEnrolled);
        setCourses(res.data.data || []);
        if (res.data.program) {
          setProgramInfo({
            program: res.data.program,
            section: res.data.section,
            yearLevel: res.data.yearLevel,
            enrollmentKey: res.data.enrollmentKey
          });
        }
      }
    } catch (err) {
      console.error('Failed to load enrolled subjects:', err);
      setError('Failed to load your enrolled subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubjects();
  }, []);

  const handleRedeemKey = async (e) => {
    e.preventDefault();
    if (!enrollmentKeyInput.trim()) return;

    setRedeeming(true);
    setKeyError('');
    setSuccessMsg('');

    try {
      const res = await API.post('/academic/enroll-with-key', {
        enrollmentKey: enrollmentKeyInput.trim()
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Successfully enrolled into your classes!');
        setEnrollmentKeyInput('');
        fetchMySubjects();
      }
    } catch (err) {
      setKeyError(err.response?.data?.message || 'Invalid or expired enrollment key. Please check with your administrator.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Enrolled Subjects</h1>
          <p className="text-xs text-slate-400 mt-1">
            {loading
              ? 'Loading course status...'
              : isEnrolled
              ? `Enrolled in ${courses.length} subjects under ${programInfo?.section || 'Current Term'}`
              : 'Action Required: Enrollment Key required to assign courses'}
          </p>
        </div>

        {programInfo && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
              {programInfo.program?.code} • {programInfo.section}
            </span>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-sm">
          <span>🎉 {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading enrolled subjects...</div>
      ) : !isEnrolled ? (
        /* Enrollment Key Redemption Card */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            🔑
          </div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Enrollment Key Required</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You are currently registered as a student, but your degree program and subjects have not yet been unlocked. 
              The School Administrator generates an <strong>Enrollment Key</strong> that assigns your academic program, section, and subjects.
            </p>
          </div>

          {keyError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 text-center">
              {keyError}
            </div>
          )}

          <form onSubmit={handleRedeemKey} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 text-center">
                Enter Your Enrollment Key
              </label>
              <input
                type="text"
                placeholder="e.g. ENR-BSCPE-XXXX"
                value={enrollmentKeyInput}
                onChange={(e) => setEnrollmentKeyInput(e.target.value.toUpperCase())}
                required
                className="w-full text-center tracking-widest font-mono text-base font-bold py-3 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={redeeming}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-600/20"
            >
              {redeeming ? 'Verifying & Unlocking Courses...' : 'Redeem Key & Unlock Subjects'}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            Don't have an enrollment key? Request one from your Department Head or School Administrator.
          </p>
        </div>
      ) : courses.length === 0 ? (
        /* Enrolled but no subjects attached */
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-3">📚</div>
          <h3 className="text-sm font-bold text-slate-800">You are enrolled in {programInfo?.program?.name || 'Program'}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Section: {programInfo?.section}. No specific subjects have been scheduled under your section yet.
          </p>
        </div>
      ) : (
        /* Enrolled Courses Grid */
        <div className="grid grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{course.code}</span>
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                    📖
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{course.title}</h3>
                <p className="text-[11px] text-slate-400 mb-4">
                  Section: <span className="font-semibold text-slate-600">{course.section}</span> • Year: <span className="font-semibold text-slate-600">{course.yearLevel}</span>
                </p>

                <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                  <p><strong className="text-slate-700 font-semibold">Instructor:</strong> {course.instructor?.fullName || 'TBA'}</p>
                  <p><strong className="text-slate-700 font-semibold">Schedule:</strong> {course.schedule}</p>
                  <p><strong className="text-slate-700 font-semibold">Room:</strong> {course.room}</p>
                </div>
              </div>

              <Link
                to={`/student/attendance?subjectId=${course._id}&title=${encodeURIComponent(course.title)}&section=${encodeURIComponent(course.section)}`}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl text-center shadow-md shadow-blue-600/20 transition block"
              >
                View Attendance Record
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}