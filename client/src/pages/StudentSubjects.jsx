import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function StudentSubjects() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data.success) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
        setError('Failed to load enrolled subjects.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Enrolled Subjects</h1>
          <p className="text-xs text-slate-400 mt-1">
            {loading ? 'Loading academic subjects...' : `You have ${courses.length} academic subjects scheduled this term.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Term: <strong className="text-blue-600">Current Semester</strong>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading subjects from database...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="text-3xl mb-3">📚</div>
          <h3 className="text-sm font-bold text-slate-800">No Subjects Enrolled Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no subjects scheduled in your department or section.
          </p>
        </div>
      ) : (
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
                <p className="text-[11px] text-slate-400 mb-4">Section: <span className="font-semibold text-slate-600">{course.section}</span> • Year: <span className="font-semibold text-slate-600">{course.yearLevel}</span></p>

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