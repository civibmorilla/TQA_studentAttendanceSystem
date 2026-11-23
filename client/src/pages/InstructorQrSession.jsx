import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import API from '../services/api';
import { formatTime } from '../utils/date';

const POLL_MS = 3000;

export default function InstructorQrSession() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '');
  const [lateAfter, setLateAfter] = useState(15);
  const [duration, setDuration] = useState(90);
  const [sessionRaw, setSessionRaw] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [projector, setProjector] = useState(false);
  const [markAbsent, setMarkAbsent] = useState(true);
  const [closedMsg, setClosedMsg] = useState('');
  const [tick, setTick] = useState(() => Date.now());
  // Wraps setSession so we remember when the server's "refreshInMs" hint was received
  const session = sessionRaw;
  const setSession = useCallback((data) => setSessionRaw(data ? { ...data, fetchedAt: Date.now() } : null), []);

  const subject = subjects.find((s) => s._id === subjectId);

  // Load my subjects + resume any session that's still open (e.g. after a refresh)
  useEffect(() => {
    (async () => {
      try {
        const [subRes, activeRes] = await Promise.all([
          API.get('/academic/subjects'),
          API.get('/attendance/sessions/active')
        ]);
        setSubjects(subRes.data.data || []);
        const active = activeRes.data.data || [];
        const wanted = searchParams.get('subjectId');
        const resume = active.find((s) => (s.subjectId?._id || s.subjectId) === wanted) || (!wanted && active[0]);
        if (resume) {
          setSubjectId(resume.subjectId?._id || resume.subjectId);
          const live = await API.get(`/attendance/sessions/${resume._id}`);
          setSession(live.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your classes.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async (id) => {
    try {
      const res = await API.get(`/attendance/sessions/${id}`);
      setSession(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lost connection to the session.');
    }
  }, [setSession]);

  // Poll while the session is open
  useEffect(() => {
    if (!session || session.status !== 'OPEN') return undefined;
    const id = setInterval(() => refresh(session._id), POLL_MS);
    return () => clearInterval(id);
  }, [session?._id, session?.status, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth countdown bar
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const startSession = async () => {
    if (!subjectId) return;
    setBusy(true);
    setError('');
    setClosedMsg('');
    try {
      const res = await API.post('/attendance/sessions', {
        subjectId,
        lateAfterMinutes: Number(lateAfter),
        durationMinutes: Number(duration)
      });
      setSession(res.data.data);
      setSearchParams({ subjectId });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the session.');
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async () => {
    if (!session) return;
    const ok = window.confirm(
      markAbsent
        ? 'Close check-in? Students who have not checked in will be marked ABSENT.'
        : 'Close check-in? Students who have not checked in will be left unmarked.'
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await API.post(`/attendance/sessions/${session._id}/close`, { markAbsent });
      setClosedMsg(res.data.message);
      setProjector(false);
      await refresh(session._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not close the session.');
    } finally {
      setBusy(false);
    }
  };

  const checkIns = session?.checkIns || [];
  const scanned = checkIns.filter((c) => c.method !== 'AUTO_ABSENT');
  const presentCount = scanned.filter((c) => c.status === 'PRESENT').length;
  const lateCount = scanned.filter((c) => c.status === 'LATE').length;
  const rosterSize = session?.rosterSize ?? '—';
  const isOpen = session?.status === 'OPEN';
  const isLateNow = session && tick > new Date(session.lateAt).getTime();

  // Seconds until the code rotates, based on the server's hint
  const msLeft = session ? Math.max(0, session.refreshInMs - (tick - session.fetchedAt)) : 0;
  const pct = Math.min(100, (msLeft / 15000) * 100);

  // ---------- Projector / full-screen view
  if (projector && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8">
        <button
          onClick={() => setProjector(false)}
          className="absolute top-6 right-6 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          ✕ Exit projector mode
        </button>
        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{subject?.code} • {subject?.section}</p>
        <h1 className="text-3xl font-black text-slate-800 mb-6">{subject?.title}</h1>
        <div className="p-6 bg-white rounded-3xl shadow-2xl border border-slate-100">
          <QRCodeSVG value={session.qrPayload} size={Math.min(window.innerHeight * 0.55, 520)} level="M" marginSize={2} />
        </div>
        <div className="w-80 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-slate-500 text-sm mt-4">Open <strong>ClassPulse → Check-in</strong> and scan, or type code</p>
        <p className="text-6xl font-black tracking-[0.3em] text-slate-800 mt-2 font-mono">{session.code}</p>
        <p className="mt-6 text-lg font-bold text-slate-700">
          {scanned.length} / {rosterSize} checked in
          {isLateNow && <span className="ml-3 text-amber-600">• now counting as LATE</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">QR Check-in Session</h1>
          <p className="text-sm text-slate-500 mt-1">
            Project a rotating QR code. Students scan it from their phone to mark themselves present.
          </p>
        </div>
        {subjectId && (
          <button
            onClick={() => navigate(`/instructor/attendance?subjectId=${subjectId}`)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            📋 Open attendance sheet
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {closedMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
          ✅ {closedMsg}
        </div>
      )}

      {/* Setup */}
      {!isOpen && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Start a new check-in</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject / Class</label>
              <select
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setSession(null); setClosedMsg(''); }}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-700 bg-white outline-none focus:border-blue-500"
              >
                <option value="">Select a subject...</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.code} - {s.title} ({s.section})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Late after (minutes)</label>
              <input
                type="number" min="0" max="240" value={lateAfter}
                onChange={(e) => setLateAfter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Close after (minutes)</label>
              <input
                type="number" min="5" max="300" value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={startSession}
            disabled={!subjectId || busy}
            className="mt-5 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition"
          >
            {busy ? 'Starting…' : '▶ Start QR check-in'}
          </button>
        </div>
      )}

      {/* Live session */}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {isOpen ? '● LIVE' : 'CLOSED'}
              </span>
              <span className="text-xs text-slate-400">
                {session.date} • started {formatTime(session.startedAt)}
              </span>
            </div>

            {isOpen ? (
              <>
                <div className="p-3 bg-white rounded-2xl border border-slate-100">
                  <QRCodeSVG value={session.qrPayload} size={240} level="M" marginSize={2} />
                </div>
                <div className="w-60 h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">Code changes every 15 seconds</p>
                <p className="text-3xl font-black tracking-[0.25em] text-slate-800 font-mono mt-3">{session.code}</p>
                <p className={`text-xs font-semibold mt-2 ${isLateNow ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isLateNow
                    ? `Check-ins now count as LATE (since ${formatTime(session.lateAt)})`
                    : `On time until ${formatTime(session.lateAt)}`}
                </p>
                <p className="text-xs text-slate-400">Auto-closes at {formatTime(session.expiresAt)}</p>

                <div className="w-full grid grid-cols-2 gap-2 mt-6">
                  <button
                    onClick={() => setProjector(true)}
                    className="py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900"
                  >
                    🖥 Projector mode
                  </button>
                  <button
                    onClick={closeSession}
                    disabled={busy}
                    className="py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:bg-rose-300"
                  >
                    ■ Close check-in
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-3 text-xs text-slate-600 self-start">
                  <input type="checkbox" checked={markAbsent} onChange={(e) => setMarkAbsent(e.target.checked)} />
                  Mark students who didn't check in as ABSENT
                </label>
              </>
            ) : !session.closedAt ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-600 mb-4">
                  The check-in window timed out. Finalize it to mark students who never checked in.
                </p>
                <label className="flex items-center justify-center gap-2 mb-3 text-xs text-slate-600">
                  <input type="checkbox" checked={markAbsent} onChange={(e) => setMarkAbsent(e.target.checked)} />
                  Mark students who didn't check in as ABSENT
                </label>
                <button
                  onClick={closeSession}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:bg-rose-300"
                >
                  Finalize session
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">
                This session is closed. Start a new one above, or adjust individual students on the attendance sheet.
              </p>
            )}
          </div>

          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-4 rounded-xl bg-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase">Checked in</span>
                <div className="text-2xl font-bold text-slate-800">{scanned.length}<span className="text-sm text-slate-400"> / {rosterSize}</span></div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50">
                <span className="text-xs font-bold text-emerald-600 uppercase">On time</span>
                <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50">
                <span className="text-xs font-bold text-amber-600 uppercase">Late</span>
                <div className="text-2xl font-bold text-amber-700">{lateCount}</div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-3">Live check-ins</h3>
            {checkIns.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Waiting for students to scan…</p>
            ) : (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                {checkIns.map((c) => (
                  <div key={c._id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{c.student?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{c.student?.userCustomId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{formatTime(c.checkedInAt)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700'
                          : c.status === 'LATE' ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                      }`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
