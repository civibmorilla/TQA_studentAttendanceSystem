const crypto = require('crypto');

// How often the classroom QR code changes. A screenshot sent to a friend
// outside the room stops working after roughly two windows.
const WINDOW_MS = 15 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L confusion

const secret = () => process.env.QR_SECRET || process.env.JWT_SECRET || 'dev-only-secret';

const hmac = (value) => crypto.createHmac('sha256', secret()).update(value).digest();

const toCode = (buf, length) => {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
  return out;
};

const currentWindow = (now = Date.now()) => Math.floor(now / WINDOW_MS);

// 6-character rotating code for a session, e.g. "K7Q2MX"
const sessionCode = (sessionId, window = currentWindow()) =>
  toCode(hmac(`session:${sessionId}:${window}`), 6);

// Accept the current and the previous window so a scan right at the rollover still works.
const verifySessionCode = (sessionId, code, now = Date.now()) => {
  if (!code) return false;
  const clean = String(code).trim().toUpperCase();
  const w = currentWindow(now);
  return [w, w - 1].some((win) => {
    const expected = sessionCode(sessionId, win);
    return expected.length === clean.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean));
  });
};

const msUntilNextWindow = (now = Date.now()) => WINDOW_MS - (now % WINDOW_MS);

// QR text shown on the instructor's screen
const sessionPayload = (sessionId) => `CLASSPULSE:S:${sessionId}:${sessionCode(sessionId)}`;

// Permanent, signed student ID QR (can't be forged by guessing an ID)
const studentSignature = (userId) => toCode(hmac(`student:${userId}`), 10);
const studentPayload = (userId) => `CLASSPULSE:ID:${userId}:${studentSignature(userId)}`;

// Parse any scanned / typed text into { type, id, code }
const parsePayload = (text) => {
  const raw = String(text || '').trim();
  const parts = raw.split(':');
  if (parts.length === 4 && parts[0] === 'CLASSPULSE') {
    if (parts[1] === 'S') return { type: 'SESSION', id: parts[2], code: parts[3] };
    if (parts[1] === 'ID') return { type: 'STUDENT', id: parts[2], code: parts[3] };
  }
  // A bare 6-character code typed by hand
  if (/^[A-Za-z0-9]{6}$/.test(raw)) return { type: 'CODE', code: raw.toUpperCase() };
  return null;
};

const verifyStudentPayload = (parsed) => {
  if (!parsed || parsed.type !== 'STUDENT') return false;
  const expected = studentSignature(parsed.id);
  return expected.length === parsed.code.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.code));
};

// Today's date in the school's timezone (UTC dates are wrong before 8 AM in PH)
const todayLocal = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Manila',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);

module.exports = {
  WINDOW_MS,
  sessionCode,
  verifySessionCode,
  msUntilNextWindow,
  sessionPayload,
  studentPayload,
  parsePayload,
  verifyStudentPayload,
  todayLocal
};
