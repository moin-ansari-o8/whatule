// Lightweight placeholder. Replace with strong crypto for production.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encrypt(text) {
  const bytes = encoder.encode(text ?? "");
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(binary);
}

export function decrypt(encoded) {
  try {
    const binary = atob(encoded ?? "");
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}
