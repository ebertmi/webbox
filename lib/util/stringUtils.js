export function escape (s) {
  return String(s).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getFileExtension (filename) {
  return filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2);
}