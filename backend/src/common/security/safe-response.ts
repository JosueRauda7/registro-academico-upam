const secrets = new Set(['passwordHash', 'password_hash', 'resetToken', 'reset_token',
  'resetTokenExpires', 'reset_token_expires']);

/** Defense in depth for nested ORM results, including entities returned after save. */
export function safeResponse(value: any): any {
  if (value === null || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (Array.isArray(value)) return value.map(safeResponse);
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !secrets.has(key)).map(([key, item]) => [key, safeResponse(item)]));
}
