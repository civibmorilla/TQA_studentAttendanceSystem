// Round profile picture, or the person's initials when there is no picture.
const SIZES = {
  sm: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-28 h-28 text-3xl'
};

function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Avatar({ name = '', photo = '', size = 'sm', tone = 'solid' }) {
  const box = SIZES[size] || SIZES.sm;
  if (photo) {
    return <img src={photo} alt={`Profile picture of ${name}`} className={`${box} rounded-full object-cover border border-slate-200 bg-white shrink-0`} />;
  }
  const colors = tone === 'solid' ? 'bg-blue-600 text-white' : 'bg-blue-50 border border-blue-100 text-blue-600';
  return (
    <div className={`${box} ${colors} rounded-full font-bold flex items-center justify-center shrink-0`} aria-hidden="true">
      {initialsOf(name)}
    </div>
  );
}
