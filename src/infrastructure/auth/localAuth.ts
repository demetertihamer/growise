const LOCAL_ACCOUNT_KEY = 'growise.local-account.v1';
const PBKDF2_ITERATIONS = 210_000;

interface LocalAccountCredential {
  email: string;
  salt: string;
  verifier: string;
}

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (value: string): Uint8Array => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) {
    throw new Error('The saved local account is invalid.');
  }
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
};

const deriveVerifier = async (password: string, salt: Uint8Array) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password verification is unavailable in this browser.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: Uint8Array.from(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
};

const readAccount = (): LocalAccountCredential | null => {
  const stored = localStorage.getItem(LOCAL_ACCOUNT_KEY);
  if (!stored) return null;

  try {
    const account: unknown = JSON.parse(stored);
    if (
      typeof account === 'object' &&
      account !== null &&
      'email' in account &&
      typeof account.email === 'string' &&
      'salt' in account &&
      typeof account.salt === 'string' &&
      'verifier' in account &&
      typeof account.verifier === 'string'
    ) {
      return account as LocalAccountCredential;
    }
  } catch {
    throw new Error('The saved local account could not be read.');
  }

  throw new Error('The saved local account is invalid.');
};

export const createLocalAccount = async (email: string, password: string) => {
  if (readAccount()) {
    throw new Error('A local account already exists on this device. Sign in instead.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await deriveVerifier(password, salt);
  const account: LocalAccountCredential = {
    email: email.trim().toLowerCase(),
    salt: toHex(salt),
    verifier: toHex(verifier),
  };

  try {
    localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    throw new Error('Could not save this local account in browser storage.');
  }
};

export const verifyLocalAccount = async (email: string, password: string) => {
  const account = readAccount();
  if (!account) {
    throw new Error('No local account exists on this device. Create one first.');
  }
  if (account.email !== email.trim().toLowerCase()) return false;

  const expected = fromHex(account.verifier);
  const actual = await deriveVerifier(password, fromHex(account.salt));
  if (expected.length !== actual.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index] ^ actual[index];
  }
  return difference === 0;
};
