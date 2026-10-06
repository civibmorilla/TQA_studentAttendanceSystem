import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await API.get('/academic/programs');
        if (res.data.success) {
          setPrograms(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load programs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Program Management</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Academic Programs</h3>
            <p className="text-xs text-slate-500 mt-1">Configure academic course streams and year mappings</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading programs...</p>
          ) : programs.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No programs created yet.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Year Levels</th>
                  <th className="py-3 px-4">Sections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {programs.map((prog) => (
                  <tr key={prog._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-blue-600">{prog.code}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{prog.name}</td>
                    <td className="py-4 px-4">{prog.yearLevels}</td>
                    <td className="py-4 px-4">{prog.sectionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}