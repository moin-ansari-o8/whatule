// Lightweight placeholder. Replace with strong crypto (e.g., Web Crypto AES-GCM) for production.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encode64(text) {
  const bytes = encoder.encode(text ?? "");
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(binary);
}

export function decode64(encoded) {
  try {
    const binary = atob(encoded ?? "");
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return decoder.decode(bytes);
  } catch {
    return "";
  }
}

// These helpers only Base64-encode data; they are not cryptographically secure.
