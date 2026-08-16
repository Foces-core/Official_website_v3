export const DRAFT_STORAGE_KEY = 'foces_contact_draft_v1';

const DEFAULT_DRAFT = {
  name: '',
  email: '',
  subject: '',
  message: '',
  website: '',
};

function getStorage(customStorage) {
  if (customStorage !== undefined) return customStorage;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

/**
 * Loads the saved contact form draft from session storage.
 * Returns default empty values if storage is unavailable, empty, or corrupted.
 *
 * @param {Storage | null} [customStorage]
 * @returns {{ name: string, email: string, subject: string, message: string, website: string }}
 */
export function loadContactDraft(customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return { ...DEFAULT_DRAFT };

  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DRAFT };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_DRAFT };

    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      message: typeof parsed.message === 'string' ? parsed.message : '',
      website: '', // Honeypot is never restored from storage
    };
  } catch {
    return { ...DEFAULT_DRAFT };
  }
}

/**
 * Persists non-empty contact form values to session storage.
 * If all fields are empty, the key is cleaned up.
 *
 * @param {{ name?: string, email?: string, subject?: string, message?: string }} values
 * @param {Storage | null} [customStorage]
 */
export function saveContactDraft(values, customStorage) {
  const storage = getStorage(customStorage);
  if (!storage || !values) return;

  const { name = '', email = '', subject = '', message = '' } = values;
  const hasContent = Boolean(name.trim() || email.trim() || subject.trim() || message.trim());

  try {
    if (hasContent) {
      storage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          name: String(name),
          email: String(email),
          subject: String(subject),
          message: String(message),
        }),
      );
    } else {
      storage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or disabled storage errors
  }
}

/**
 * Clears the contact form draft from session storage.
 *
 * @param {Storage | null} [customStorage]
 */
export function clearContactDraft(customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return;

  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
