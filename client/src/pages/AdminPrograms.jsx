import React from 'react';

export default function AdminPrograms() {
  const programs = [
    { code: 'BSCpE', name: 'Computer Engineering', years: 4, sections: 12 },
    { code: 'BSIT', name: 'Information Technology', years: 4, sections: 16 },
    { code: 'BSCS', name: 'Computer Science', years: 4, sections: 10 },
    { code: 'BSHM', name: 'Hospitality Management', years: 4, sections: 8 },
  ];

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
          <button className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition flex items-center gap-2">
            <span className="text-lg leading-none">+</span> Add Program
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Program Name</th>
                <th className="py-3 px-4">Year Levels</th>
                <th className="py-3 px-4">Sections</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {programs.map((prog, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4 font-bold text-blue-600">{prog.code}</td>
                  <td className="py-4 px-4 font-semibold text-slate-800">{prog.name}</td>
                  <td className="py-4 px-4">{prog.years}</td>
                  <td className="py-4 px-4">{prog.sections}</td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition shadow-sm font-semibold">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}