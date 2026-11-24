// Official student number format. Default: YYYY-NNNNN (e.g. 2026-00123).
// A school with a different format can set STUDENT_ID_PATTERN (a regular expression) in .env.
const DEFAULT_PATTERN = '^\\d{4}-\\d{5}$';

function pattern() {
  try {
    return new RegExp(process.env.STUDENT_ID_PATTERN || DEFAULT_PATTERN);
  } catch {
    return new RegExp(DEFAULT_PATTERN);
  }
}

exports.STUDENT_ID_EXAMPLE = process.env.STUDENT_ID_EXAMPLE || '2026-00123';

exports.isValidStudentId = (id) => pattern().test(String(id || '').trim());

exports.studentIdError = () =>
  `Student number must follow the school format, e.g. ${exports.STUDENT_ID_EXAMPLE} (year, dash, 5 digits).`;

// How self-registration works: 'approval' (default) = the public page sends a request
// the admin must approve; 'off' = no public sign-up, only admins create accounts.
exports.signupMode = () => (String(process.env.SIGNUP_MODE || 'approval').toLowerCase() === 'off' ? 'off' : 'approval');
