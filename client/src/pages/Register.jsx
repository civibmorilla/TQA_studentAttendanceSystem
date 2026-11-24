import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

// Students don't create their own accounts any more. Depending on the server's SIGNUP_MODE:
//  - 'approval': this page sends an account REQUEST that an admin approves.
//  - 'off':      this page only explains how to get an account from the school.
// On a brand-new installation (no admin yet) it sets up the first admin instead.
const STUDENT_ID_RE = /^\d{4}-\d{5}$/;

const input =
  'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm';

function Brand() {
  return (
    <div className="text-center mb-6">
      <img src="/logo-full.png" alt="ClassPulse, Student Attendance System" width="640" height="428" className="w-52 h-auto mx-auto" />
      <p className="text-xs font-bold text-blue-600 mt-2 uppercase tracking-wider">by XI Labs</p>
    </div>
  );
}

function PrivacyNotice({ consent, setConsent }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 space-y-2">
      <p className="font-bold text-slate-700">Privacy notice (Data Privacy Act of 2012, RA 10173)</p>
      <p>
        We collect your ID number, name, email, contact details, class enrollment and attendance records only to
        take and report class attendance. They are visible to you, your instructors and school administrators,
        are not shared outside the school, and are kept only as long as school record rules require. You can
        ask the school administrator to see, correct or delete your data.
      </p>
      <label className="flex items-start gap-2 text-sm text-slate-700 font-medium">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0" />
        <span>I have read the privacy notice and agree to the processing of my data for attendance purposes.</span>
      </label>
    </div>
  );
}

export default function Register() {
  const [config, setConfig] = useState(null); // { mode, needsFirstAdmin, studentIdExample }
  const [loadError, setLoadError] = useState('');
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({ userCustomId: '', fullName: '', email: '', password: '', confirm: '', enrollmentKey: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(''); // success message

  useEffect(() => {
    API.get('/auth/signup-mode')
      .then((res) => setConfig(res.data))
      .catch(() => setLoadError('Could not reach the server. Check your connection and refresh the page.'));
  }, []);

  const firstAdmin = Boolean(config?.needsFirstAdmin);
  const example = config?.studentIdExample || '2026-00123';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const id = formData.userCustomId.trim();
    if (!firstAdmin && !STUDENT_ID_RE.test(id)) {
      setError(`Enter your official student number, e.g. ${example} (year, dash, 5 digits).`);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await API.post('/auth/register', {
        userCustomId: id,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: firstAdmin ? 'ADMIN' : 'STUDENT',
        enrollmentKey: firstAdmin ? '' : formData.enrollmentKey,
        privacyConsent: consent
      });
      setDone(res.data.pending ? res.data.message : 'Administrator account created. You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  let body;
  if (loadError) {
    body = <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">{loadError}</p>;
  } else if (!config) {
    body = <p className="text-sm text-slate-400 text-center py-8">Loading…</p>;
  } else if (done) {
    body = (
      <div role="status" className="space-y-5">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          <p className="font-bold mb-1">{firstAdmin ? 'All set' : 'Request sent'}</p>
          <p>{done}</p>
        </div>
        {!firstAdmin && (
          <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
            <li>The administrator checks your student number and name against the official roster.</li>
            <li>Once approved, you can log in with your student number and the password you chose.</li>
            <li>If it's taking long, contact the registrar or your instructor.</li>
          </ol>
        )}
        <Link to="/login" className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm">
          Back to login
        </Link>
      </div>
    );
  } else if (config.mode === 'off' && !firstAdmin) {
    body = (
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-slate-800 text-center">Accounts are created by the school</h2>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-5">
          <li>The registrar adds every enrolled student using their official student number (e.g. {example}).</li>
          <li>You receive a temporary password from the school administrator.</li>
          <li>Log in with your student number and that password. You will choose your own password right away.</li>
        </ol>
        <p className="text-sm text-slate-500">Didn't get your login? Contact the registrar or your instructor.</p>
        <Link to="/login" className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition text-sm">
          Back to login
        </Link>
      </div>
    );
  } else {
    body = (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{firstAdmin ? 'Set up the first administrator' : 'Request a student account'}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {firstAdmin
              ? 'This system has no administrator yet. Create the first admin account; after that, only admins create accounts.'
              : 'The school administrator approves every request before you can log in.'}
          </p>
        </div>

        {error && <p role="alert" className="p-3 bg-rose-50 text-rose-700 text-sm font-bold rounded-lg border border-rose-200">{error}</p>}

        <div>
          <label htmlFor="rg-id" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">
            {firstAdmin ? 'Admin ID' : 'Official student number'}
          </label>
          <input
            id="rg-id"
            type="text"
            name="userCustomId"
            placeholder={firstAdmin ? 'e.g. ADMIN-01' : `e.g. ${example}`}
            value={formData.userCustomId}
            onChange={handleChange}
            className={`${input} font-mono`}
            autoComplete="username"
            required
          />
          {!firstAdmin && <p className="text-xs text-slate-500 mt-1">As printed on your registration form: year, dash, 5 digits.</p>}
        </div>

        <div>
          <label htmlFor="rg-name" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Full name</label>
          <input id="rg-name" type="text" name="fullName" placeholder="As registered with the school" value={formData.fullName} onChange={handleChange} className={input} autoComplete="name" required />
        </div>

        <div>
          <label htmlFor="rg-email" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Email</label>
          <input id="rg-email" type="email" name="email" placeholder="juan@school.edu.ph" value={formData.email} onChange={handleChange} className={input} autoComplete="email" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rg-pw" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Password</label>
            <input id="rg-pw" type="password" name="password" minLength={8} value={formData.password} onChange={handleChange} className={input} autoComplete="new-password" required />
          </div>
          <div>
            <label htmlFor="rg-pw2" className="block text-sm font-semibold text-slate-500 mb-1 uppercase">Confirm</label>
            <input id="rg-pw2" type="password" name="confirm" minLength={8} value={formData.confirm} onChange={handleChange} className={input} autoComplete="new-password" required />
          </div>
        </div>
        <p className="text-xs text-slate-500 -mt-2">At least 8 characters.</p>

        {!firstAdmin && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="rg-key" className="block text-sm font-semibold text-slate-500 uppercase">Enrollment key (optional)</label>
              <span className="text-xs text-slate-500">Issued by admin</span>
            </div>
            <input id="rg-key" type="text" name="enrollmentKey" placeholder="e.g. ENR-BSCPE-XXXX" value={formData.enrollmentKey} onChange={handleChange} className={`${input} font-mono uppercase`} />
          </div>
        )}

        <PrivacyNotice consent={consent} setConsent={setConsent} />

        <button
          type="submit"
          disabled={isLoading || !consent}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 text-sm"
        >
          {isLoading ? 'Sending…' : firstAdmin ? 'Create administrator' : 'Send request'}
        </button>
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <Brand />
        {body}
        {!done && (
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in here</Link>
          </p>
        )}
      </div>
    </div>
  );
}
