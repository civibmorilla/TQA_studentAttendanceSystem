import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

// Public page: sends a password reset request to the school admin.
// The admin verifies the person and gives them a temporary password,
// which they must change at their next login.
export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { username: username.trim(), email: email.trim(), note: note.trim() });
      setSentMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <Link
          to="/login"
          aria-label="Close and go back to login"
          title="Back to login"
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </Link>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mx-auto mb-3 text-xl" aria-hidden="true">
            🔑
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-slate-500 mt-1">
            Send a reset request to the school administrator.
          </p>
        </div>

        {sentMessage ? (
          <div role="status" className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
              <p className="font-bold mb-1">Request sent</p>
              <p>{sentMessage}</p>
            </div>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
              <li>The administrator checks that the request is really from you.</li>
              <li>They give you a temporary password in person or through your school channel.</li>
              <li>Log in with it. You will be asked to choose a new password right away.</li>
            </ol>
            <Link
              to="/login"
              className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="fp-id" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">ID Number</label>
              <input
                id="fp-id"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. STU-001"
                autoComplete="username"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="fp-email" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Email on your account</label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="fp-note" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">
                Message for the admin <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                id="fp-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="e.g. Section DEMO-301, I can show my school ID at the registrar."
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{note.length}/300</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
            >
              {isLoading ? 'Sending…' : 'Send reset request'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Remembered it? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
