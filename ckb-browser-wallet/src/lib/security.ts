const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Cast salt to Uint8Array to avoid SharedArrayBuffer type issue
  const saltBuffer = salt.buffer instanceof SharedArrayBuffer ? 
    new Uint8Array(new ArrayBuffer(salt.length)) : 
    salt;
    
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 250_000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bytesToB64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function b64ToBytes(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function encryptText(plain: string, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plain)
  );

  return JSON.stringify({
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    data: bytesToB64(new Uint8Array(cipher))
  });
}

export async function decryptText(payload: string, password: string) {
  const parsed = JSON.parse(payload) as { salt: string; iv: string; data: string };
  const salt = b64ToBytes(parsed.salt);
  const iv = b64ToBytes(parsed.iv);
  const data = b64ToBytes(parsed.data);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return dec.decode(plain);
}