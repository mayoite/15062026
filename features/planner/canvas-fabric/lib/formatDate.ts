export function formatDate(date: Date, pattern: string, _locale: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return pattern
    .replace('yyyy', String(yyyy))
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('hh', hh)
    .replace('mm', mm)
    .replace('ss', ss);
}