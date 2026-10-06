import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    yearLevels: 4,
    sectionsCount: 10
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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

  useEffect(() => {
    fetchPrograms();
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedProgramId(null);
    setFormData({
      code: '',
      name: '',
      yearLevels: 4,
      sectionsCount: 10
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prog) => {
    setModalMode('edit');
    setSelectedProgramId(prog._id);
    setFormData({
      code: prog.code,
      name: prog.name,
      yearLevels: prog.yearLevels || 4,
      sectionsCount: prog.sectionsCount || 10
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearLevels' || name === 'sectionsCount' ? Number(value) : value
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      if (modalMode === 'create') {
        const res = await API.post('/academic/programs', formData);
        if (res.data.success) {
          showNotification(`Program "${formData.code}" created successfully!`);
          setIsModalOpen(false);
          fetchPrograms();
        }
      } else {
        const res = await API.put(`/academic/programs/${selectedProgramId}`, formData);
        if (res.data.success) {
          showNotification(`Program "${formData.code}" updated successfully!`);
          setIsModalOpen(false);
          fetchPrograms();
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || `Failed to ${modalMode} program.`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProgram = async (prog) => {
    if (!window.confirm(`Are you sure you want to delete academic program "${prog.name}" (${prog.code})?`)) {
      return;
    }

    try {
      const res = await API.delete(`/academic/programs/${prog._id}`);
      if (res.data.success) {
        setPrograms(prev => prev.filter(p => p._id !== prog._id));
        showNotification(`Program "${prog.code}" was deleted.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete program.');
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Program Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure academic course streams, curricula, and year mappings.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
        >
          <span>📚+</span>
          <span>Create New Program</span>
        </button>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Main Table Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Academic Programs List</h3>
            <p className="text-xs text-slate-500 mt-1">Total {programs.length} degree programs recognized in the institution.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading programs from database...</p>
          ) : programs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-bold text-slate-700">No academic programs found.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Create New Program" above to register degree offerings.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Program Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Year Levels</th>
                  <th className="py-3 px-4">Sections Limit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {programs.map((prog) => (
                  <tr key={prog._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-blue-600 font-mono">{prog.code}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{prog.name}</td>
                    <td className="py-4 px-4">{prog.yearLevels} Years</td>
                    <td className="py-4 px-4">{prog.sectionsCount} Sections</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(prog)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(prog)}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Program Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {modalMode === 'create' ? 'Create Academic Program' : `Edit Program (${formData.code})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Program Code
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. BSCpE, BSIT, BSCS"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Full Program Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Bachelor of Science in Computer Engineering"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Year Levels
                  </label>
                  <input
                    type="number"
                    name="yearLevels"
                    min="1"
                    max="6"
                    value={formData.yearLevels}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Sections Count Limit
                  </label>
                  <input
                    type="number"
                    name="sectionsCount"
                    min="1"
                    max="50"
                    value={formData.sectionsCount}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition"
                >
                  {modalLoading ? 'Saving...' : modalMode === 'create' ? 'Create Program' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}