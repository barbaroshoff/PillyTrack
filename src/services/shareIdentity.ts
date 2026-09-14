import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const IDENTITY_KEY = '@pillytrack_share_identity';

// Без похожих друг на друга символов (0/O, 1/I/L), чтобы код было легко продиктовать и ввести вручную
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export interface ShareIdentity {
  code: string;
  ownerToken: string;
  lastSyncedAt: number | null;
}

function randomCode(): string {
  const bytes = Crypto.getRandomBytes(CODE_LENGTH);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

function randomToken(): string {
  const bytes = Crypto.getRandomBytes(32);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function save(identity: ShareIdentity): Promise<void> {
  await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export async function getShareIdentity(): Promise<ShareIdentity> {
  const raw = await AsyncStorage.getItem(IDENTITY_KEY);
  if (raw) return JSON.parse(raw) as ShareIdentity;
  const identity: ShareIdentity = { code: randomCode(), ownerToken: randomToken(), lastSyncedAt: null };
  await save(identity);
  return identity;
}

export async function regenerateShareIdentity(): Promise<ShareIdentity> {
  const identity: ShareIdentity = { code: randomCode(), ownerToken: randomToken(), lastSyncedAt: null };
  await save(identity);
  return identity;
}

export async function markSynced(updatedAt: number): Promise<ShareIdentity> {
  const identity = await getShareIdentity();
  const next = { ...identity, lastSyncedAt: updatedAt };
  await save(next);
  return next;
}
