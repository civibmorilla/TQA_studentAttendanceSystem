import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function AdminEnrollmentKeys() {
  const [keys, setKeys] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    programId: '',
    yearLevel: '1st Year',
    section: '',
    subjects: [],
    assignedStudentId: '',
    maxUses: 1,
    customKey: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      const [keysRes, progsRes, subsRes, usersRes] = await Promise.allSettled([
        API.get('/academic/enrollment-keys'),
        API.get('/academic/programs'),
        API.get('/academic/subjects'),
        API.get('/auth/users'),
      ]);

      if (keysRes.status === 'fulfilled' && keysRes.value.data.success) {
        setKeys(keysRes.value.data.data);
      }
      if (progsRes.status === 'fulfilled' && progsRes.value.data.success) {
        setPrograms(progsRes.value.data.data);
        if (progsRes.value.data.data.length > 0 && !formData.programId) {
          setFormData(prev => ({ ...prev, programId: progsRes.value.data.data[0]._id }));
        }
      }
      if (subsRes.status === 'fulfilled' && subsRes.value.data.success) {
        setSubjects(subsRes.value.data.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        setStudents(usersRes.value.data.data.filter(u => u.role === 'STUDENT'));
      }
    } catch (err) {
      console.error('Failed to load enrollment key data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleCopyKey = (keyString) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKey(keyString);
    showNotification(`Enrollment key "${keyString}" copied to clipboard! Give this to the student.`);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleOpenModal = () => {
    const defaultProg = programs[0];
    setFormData({
      programId: defaultProg ? defaultProg._id : '',
      yearLevel: '1st Year',
      section: defaultProg ? `${defaultProg.code}-101` : 'BSCpE-101',
      subjects: [],
      assignedStudentId: '',
      maxUses: 1,
      customKey: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleProgramChange = (e) => {
    const progId = e.target.value;
    const prog = programs.find(p => p._id === progId);
    setFormData(prev => ({
      ...prev,
      programId: progId,
      section: prog ? `${prog.code}-101` : prev.section,
      subjects: [] // Reset selected subjects
    }));
  };

  const handleSubjectToggle = (subId) => {
    setFormData(prev => {
      const exists = prev.subjects.includes(subId);
      return {
        ...prev,
        subjects: exists ? prev.subjects.filter(id => id !== subId) : [...prev.subjects, subId]
      };
    });
  };

  const handleSelectAllSubjects = () => {
    const matchingSubjects = subjects.filter(s => !formData.programId || s.program?._id === formData.programId || s.program === formData.programId);
    const allIds = matchingSubjects.map(s => s._id);
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.length === allIds.length ? [] : allIds
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    if (!formData.programId) {
      setModalError('Please select a target academic program.');
      setModalLoading(false);
      return;
    }

    try {
      const res = await API.post('/academic/enrollment-keys', formData);
      if (res.data.success) {
        showNotification(`Enrollment key "${res.data.data.key}" created successfully!`);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create enrollment key.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteKey = async (keyItem) => {
    if (!window.confirm(`Are you sure you want to delete enrollment key "${keyItem.key}"?`)) {
      return;
    }

    try {
      const res = await API.delete(`/academic/enrollment-keys/${keyItem._id}`);
      if (res.data.success) {
        setKeys(prev => prev.filter(k => k._id !== keyItem._id));
        showNotification(`Enrollment key "${keyItem.key}" was deleted.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete enrollment key.');
    }
  };

  // Filter subjects that belong to the selected program (or all if none specified)
  const currentProgramSubjects = subjects.filter(s =>
    !formData.programId || s.program?._id === formData.programId || s.program === formData.programId
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Enrollment Keys</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and manage access keys to assign degree programs, sections, and subjects to students.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
        >
          <span>🔑+</span>
          <span>Generate Enrollment Key</span>
        </button>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-sm">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Active & Issued Keys</h3>
            <p className="text-xs text-slate-500 mt-1">
              Students redeem these keys to automatically enroll in their assigned courses and schedule.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading enrollment keys...</p>
          ) : keys.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">🔑</div>
              <p className="text-sm font-bold text-slate-700">No enrollment keys issued yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Generate Enrollment Key" above to assign courses and issue keys to incoming students.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-3 px-4">Key Code</th>
                  <th className="py-3 px-4">Program & Section</th>
                  <th className="py-3 px-4">Assigned Subjects</th>
                  <th className="py-3 px-4">Assigned Student</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {keys.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">
                      <div className="flex items-center gap-2">
                        <span>{item.key}</span>
                        <button
                          onClick={() => handleCopyKey(item.key)}
                          className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-sans font-bold"
                          title="Copy to clipboard"
                        >
                          {copiedKey === item.key ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{item.program?.code || '—'}</div>
                      <div className="text-[11px] text-slate-400">{item.section} • {item.yearLevel}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-700">
                        {item.subjects?.length || 0} Subjects
                      </span>
                      {item.subjects?.length > 0 && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {item.subjects.map(s => s.code || s.title).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {item.assignedStudentId ? (
                        <div>
                          <p className="font-bold text-slate-800">{item.assignedStudentId.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.assignedStudentId.userCustomId}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Open (Any Student)</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-600">
                      {item.useCount} / {item.maxUses}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleCopyKey(item.key)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => handleDeleteKey(item)}
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

      {/* Generate Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Generate Student Enrollment Key
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

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Degree Program
                  </label>
                  <select
                    name="programId"
                    value={formData.programId}
                    onChange={handleProgramChange}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Program...</option>
                    {programs.map(p => (
                      <option key={p._id} value={p._id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Year Level
                  </label>
                  <select
                    name="yearLevel"
                    value={formData.yearLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearLevel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Section Code
                  </label>
                  <input
                    type="text"
                    name="section"
                    placeholder="e.g. BSCpE-101"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Assign To Specific Student (Optional)
                  </label>
                  <select
                    name="assignedStudentId"
                    value={formData.assignedStudentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedStudentId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Any Student (Open Redemption)</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.fullName} ({s.userCustomId}) {s.isEnrolled ? '✓ Enrolled' : '⚠️ Pending'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject Selection Checkboxes */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Assigned Subjects ({formData.subjects.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllSubjects}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {formData.subjects.length === currentProgramSubjects.length && currentProgramSubjects.length > 0 ? 'Deselect All' : 'Select All Subjects'}
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50">
                  {currentProgramSubjects.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">
                      No subjects configured for this program. You can assign subjects later or create them under academic subjects.
                    </p>
                  ) : (
                    currentProgramSubjects.map(sub => {
                      const isChecked = formData.subjects.includes(sub._id);
                      return (
                        <label
                          key={sub._id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                            isChecked ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSubjectToggle(sub._id)}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <div>
                              <span className="font-bold text-slate-800">{sub.code}</span>
                              <span className="text-slate-600 ml-2">{sub.title}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{sub.schedule}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Custom Key Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="customKey"
                    placeholder="Leave blank to auto-generate"
                    value={formData.customKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, customKey: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 font-mono font-semibold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Max Redemptions / Uses
                  </label>
                  <input
                    type="number"
                    name="maxUses"
                    min="1"
                    max="100"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
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
                  {modalLoading ? 'Generating...' : 'Issue Enrollment Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
