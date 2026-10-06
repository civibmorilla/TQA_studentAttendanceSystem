import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Instructor';
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data.success) {
          setSubjects(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Instructor Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Welcome back, {userName}. Here are your assigned classes.</p>
        </div>
      </div>

      <h2 className="text-sm font-bold text-slate-800 mb-4">My Schedule & Classes</h2>

      {loading ? (
        <p className="text-xs text-slate-400">Loading classes...</p>
      ) : subjects.length === 0 ? (
        <p className="text-xs text-slate-400">No classes assigned yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {subjects.map((cls) => (
            <div key={cls._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{cls.code}</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">{cls.section}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{cls.title}</h3>
                <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                  <p><strong className="text-slate-700 font-semibold">Schedule:</strong> {cls.schedule}</p>
                  <p><strong className="text-slate-700 font-semibold">Room:</strong> {cls.room}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/instructor/attendance?subjectId=${cls._id}&section=${cls.section}`)}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold text-xs rounded-xl text-center transition block border border-blue-100 hover:border-blue-600"
              >
                Open Attendance Sheet
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}