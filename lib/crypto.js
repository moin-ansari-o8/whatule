// Lightweight placeholder. Replace with strong crypto (e.g., Web Crypto AES-GCM) for production.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encode(text) {
  const bytes = encoder.encode(text ?? "");
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(binary);
}

export function decode(encoded) {
  try {
    const binary = atob(encoded ?? "");
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}

// Backwards-compatible aliases; these are simple encoders, not secure encryption.
export const encrypt = encode;
export const decrypt = decode;
