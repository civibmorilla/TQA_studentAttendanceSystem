import { useState } from 'react';
import API from '../services/api';
import { useToast, errMsg } from './Toast';

// Used from the sidebar, and forced (no Cancel) after an admin resets a password.
export default function ChangePasswordModal({ onClose, forced = false }) {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (form.newPassword !== form.confirm) return setError('The new passwords do not match.');
    setSaving(true);
    try {
      await API.put('/auth/me/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      localStorage.removeItem('mustChangePassword');
      toast.success('Password updated.');
      onClose();
    } catch (err) {
      setError(errMsg(err, 'Could not change password.'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-800 outline-none focus:border-blue-600';
  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" aria-labelledby="cp-title">
        <h2 id="cp-title" className="text-lg font-bold text-slate-800">{forced ? 'Set a new password' : 'Change password'}</h2>
        {forced && (
          <p className="text-sm text-slate-600">Your password was reset by an administrator. Choose your own password to continue.</p>
        )}
        {error && <p className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold">⚠️ {error}</p>}
        <label className="block text-sm font-semibold text-slate-700">
          {forced ? 'Temporary password' : 'Current password'}
          <input type="password" required autoComplete="current-password" className={`${input} mt-1`}
            value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          New password (8+ characters)
          <input type="password" required minLength={8} autoComplete="new-password" className={`${input} mt-1`}
            value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm new password
          <input type="password" required autoComplete="new-password" className={`${input} mt-1`}
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          {!forced && (
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          )}
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
