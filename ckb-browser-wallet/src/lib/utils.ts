export function randomId() {
  return crypto.randomUUID();
}

export function shortHex(value: string, left = 10, right = 8) {
  if (!value) return "";
  if (value.length <= left + right) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

export function shannonsFromCkb(ckb: string): bigint {
  const [whole, frac = ""] = ckb.trim().split(".");
  const padded = (frac + "00000000").slice(0, 8);
  return BigInt((whole || "0") + padded);
}

export function ckbFromShannons(value: bigint | string): string {
  const raw = typeof value === "string" ? BigInt(value) : value;
  const whole = raw / 100000000n;
  const frac = raw % 100000000n;
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : `${whole}`;
}

export function prettyJson(input: unknown) {
  return JSON.stringify(input, null, 2);
}

export function ensureHexPrefix(s: string) {
  return s.startsWith("0x") ? s : `0x${s}`;
}