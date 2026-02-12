// Lightweight placeholder. Replace with strong crypto for production.
export function encrypt(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

export function decrypt(encoded) {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return "";
  }
}
