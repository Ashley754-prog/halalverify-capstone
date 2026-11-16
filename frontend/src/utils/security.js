/**
 * Security utilities: safe URL resolution and client-side upload validation.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

/**
 * Escapes arbitrary strings before interpolating into HTML template sinks (e.g. Leaflet divIcon/tooltip).
 *
 * @param {unknown} rawText
 * @returns {string}
 */
export function escapeHtml(rawText) {
  if (rawText === null || rawText === undefined) return '';
  return String(rawText).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Builds a user-scoped Supabase Storage key with sanitized extension and collision-resistant suffix.
 *
 * @param {string|null|undefined} userId
 * @param {string} folder
 * @param {string} filename
 * @returns {string}
 */
export function buildScopedUploadPath(userId, folder, filename = 'upload.jpg') {
  const safeUser = (userId ? String(userId) : 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFolder = String(folder || 'files').replace(/[^a-zA-Z0-9_-]/g, '');
  const rawExt = String(filename).split('.').pop() || 'jpg';
  const safeExt = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${safeFolder}/${safeUser}/${Date.now()}_${rand}.${safeExt}`;
}

/**
 * Validates a dynamic external link and returns a safe URL.
 * Disallows javascript:, data:, vbscript: and malformed URIs to prevent link-injection XSS.
 *
 * @param {string} rawUrl
 * @returns {string|null} Safe URL string or null if unsafe/invalid
 */
export function getSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    // If it is a protocol-relative link (//evil.com), block it
    if (trimmed.startsWith('//')) return null;

    const parsed = new URL(trimmed, window.location.origin);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
    return null;
  } catch {
    // If relative path starts with /, allow it safely
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return null;
  }
}

/**
 * Standard upload validator for images and verification documents.
 * Enforces size limits and MIME types before sending payloads to Supabase storage.
 *
 * @param {File} file
 * @param {Object} options
 * @param {number} options.maxSizeMB (default 10)
 * @param {string[]} options.allowedTypes
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUploadFile(file, options = {}) {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB} MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller file.`,
    };
  }

  const isAllowedType = allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const baseType = type.replace('/*', '');
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });

  if (!isAllowedType) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPEG, PNG, WEBP image or PDF document.',
    };
  }

  return { valid: true };
}
