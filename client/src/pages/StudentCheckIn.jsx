import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import API from '../services/api';
import QrScanner from '../components/QrScanner';
import { formatTime } from '../utils/date';

export default function StudentCheckIn() {
  const [tab, setTab] = useState('scan'); // 'scan' | 'id'
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, data }
  const [myQr, setMyQr] = useState(null);
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    if (tab !== 'id' || myQr) return;
    API.get('/attendance/my-qr')
      .then((res) => setMyQr(res.data.data))
      .catch((err) => setQrError(err.response?.data?.message || 'Could not load your QR ID.'));
  }, [tab, myQr]);

  const submit = async (payload) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await API.post('/attendance/check-in', { payload });
      setResult({ ok: true, ...res.data });
      if (navigator.vibrate) navigator.vibrate(120);
      setCode('');
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.message || 'Check-in failed. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const status = result?.data?.status;

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Class Check-in</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">Scan the QR code your instructor is showing, or show your QR ID.</p>

      <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-sm font-semibold max-w-md">
        <button
          onClick={() => setTab('scan')}
          className={`flex-1 py-2 rounded-lg transition ${tab === 'scan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          📷 Scan class QR
        </button>
        <button
          onClick={() => setTab('id')}
          className={`flex-1 py-2 rounded-lg transition ${tab === 'id' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
        >
          🪪 My QR ID
        </button>
      </div>

      {tab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <QrScanner onScan={submit} paused={submitting} />
            <p className="text-xs text-slate-400 mt-3 text-center">Point your camera at the QR code on the screen.</p>
          </div>

          <div className="space-y-6">
            {result && (
              <div className={`p-5 rounded-2xl border shadow-sm ${
                !result.ok ? 'bg-rose-50 border-rose-200'
                  : status === 'LATE' ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="text-3xl mb-2">{!result.ok ? '❌' : status === 'LATE' ? '⏰' : '✅'}</div>
                <p className={`text-sm font-bold ${!result.ok ? 'text-rose-700' : status === 'LATE' ? 'text-amber-800' : 'text-emerald-800'}`}>
                  {result.message}
                </p>
                {result.ok && result.data && (
                  <p className="text-sm text-slate-600 mt-1">
                    {result.data.subject?.code} – {result.data.subject?.title}
                    {result.data.checkedInAt && <> • {formatTime(result.data.checkedInAt)}</>}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Camera not working?</h2>
              <p className="text-xs text-slate-500 mb-3">Type the 6-character code shown under the QR.</p>
              <form
                onSubmit={(e) => { e.preventDefault(); if (code.trim().length === 6) submit(code.trim()); }}
                className="flex gap-2"
              >
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="e.g. K7Q2MX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2.5 text-lg font-mono tracking-[0.2em] text-slate-800 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={code.length !== 6 || submitting}
                  className="px-4 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-slate-300 whitespace-nowrap"
                >
                  {submitting ? '…' : 'Check in'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {tab === 'id' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-sm flex flex-col items-center text-center">
          {qrError && <p className="text-sm text-rose-600">{qrError}</p>}
          {!myQr && !qrError && <p className="text-sm text-slate-400 py-16">Loading…</p>}
          {myQr && (
            <>
              <QRCodeSVG value={myQr.payload} size={240} level="M" marginSize={2} />
              <p className="text-base font-bold text-slate-800 mt-4">{myQr.fullName}</p>
              <p className="text-sm text-slate-500">{myQr.userCustomId}</p>
              <p className="text-xs text-slate-400 mt-4">
                Show this to your instructor if they are scanning IDs. Turn your screen brightness up.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
