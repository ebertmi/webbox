export function escape (s) {
  return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}