const PUBLIC_KEY = {
  kty: 'EC',
  x: 'Ut_0qYn3pmFh0I3H-TmtGti89MCLtnJPmbE1R4laOME',
  y: 'xFwv1YkRfknydAK4_kuwRhNaVSDfXXLGdOiOLf9b3MQ',
  crv: 'P-256',
};
const PASSWORD_SIGNATURE = 'XST5X_Yi5TtTJQdknnBgoIhjKc58ZWiBg5RvHwEs5T9VQvBxDPGXhAmClfDYYlvJwhWFSNTJwkxQtLUZhwF6wA';
const SIGNING_DOMAIN = 'endless-shift/admin/v1';
let keyPromise;

function signatureBytes() {
  const base64 = PASSWORD_SIGNATURE.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export async function verifyDeveloperPassword(password) {
  if (typeof password !== 'string' || !globalThis.crypto?.subtle) return false;
  try {
    keyPromise ||= crypto.subtle.importKey('jwk', PUBLIC_KEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const key = await keyPromise;
    const message = new TextEncoder().encode(`${SIGNING_DOMAIN}\n${password}`);
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signatureBytes(), message);
  } catch {
    return false;
  }
}
