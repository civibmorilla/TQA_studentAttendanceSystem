import { useEffect, useRef, useState } from 'react';
import API from '../services/api';
import { useToast } from './Toast';
import Avatar from './Avatar';
import { resizeImageToDataUrl } from '../utils/image';

// Lets any logged-in user change their picture, email, contact number and address.
// Name, ID, role and class stay with the admin.
export default function EditProfileModal({ onClose, onSaved = () => {} }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null); // read-only details
  const [form, setForm] = useState({ email: '', contactNo: '', address: '', photo: '' });

  useEffect(() => {
    API.get('/auth/me')
      .then((res) => {
        const u = res.data.data;
        setInfo(u);
        setForm({ email: u.email || '', contactNo: u.contactNo || '', address: u.address || '', photo: u.photo || '' });
      })
      .catch(() => setError('Could not load your profile. Try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    try {
      setError('');
      const dataUrl = await resizeImageToDataUrl(file);
      setForm((f) => ({ ...f, photo: dataUrl }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await API.put('/auth/me', form);
      const u = res.data.data;
      try {
        if (u.photo) localStorage.setItem('userPhoto', u.photo);
        else localStorage.removeItem('userPhoto');
      } catch { /* storage full or blocked: the sidebar just shows initials */ }
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: u }));
      toast.success(res.data.message || 'Profile saved.');
      onSaved(u);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm';

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="ep-title">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 id="ep-title" className="text-lg font-bold text-slate-800">Edit profile</h2>

        {loading ? (
          <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
        ) : (
          <>
            {error && <p role="alert" className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">{error}</p>}

            {/* Picture */}
            <div className="flex items-center gap-5 mt-5 mb-6">
              <Avatar name={info?.fullName} photo={form.photo} size="xl" tone="soft" />
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="ep-photo" onChange={pickPhoto} />
                <label htmlFor="ep-photo" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer">
                  {form.photo ? 'Change picture' : 'Upload picture'}
                </label>
                {form.photo && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, photo: '' }))} className="block text-sm font-semibold text-rose-600 hover:underline">
                    Remove picture
                  </button>
                )}
                <p className="text-xs text-slate-500">JPG, PNG or WebP. It's cropped to a square.</p>
              </div>
            </div>

            {/* Read-only details */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm mb-5">
              <div><span className="block text-xs font-bold text-slate-500 uppercase">Name</span>{info?.fullName}</div>
              <div><span className="block text-xs font-bold text-slate-500 uppercase">ID</span><span className="font-mono">{info?.userCustomId}</span></div>
              <p className="col-span-2 text-xs text-slate-500">To change your name, ID or class, ask the school administrator.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="ep-email" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Email</label>
                <input id="ep-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} autoComplete="email" />
                <p className="text-xs text-slate-500 mt-1">Used to confirm who you are if you forget your password.</p>
              </div>
              <div>
                <label htmlFor="ep-phone" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Contact number</label>
                <input id="ep-phone" type="tel" value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} placeholder="0917-123-4567" className={input} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="ep-address" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Home address</label>
                <textarea id="ep-address" rows={2} maxLength={200} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Barangay, City, Province" className={input} autoComplete="street-address" />
              </div>
              <p className="text-xs text-slate-500">
                Your contact number and address are hidden on your profile page until you choose to show them (RA 10173).
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold">Cancel</button>
          <button type="submit" disabled={saving || loading} className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
