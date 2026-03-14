/**
 * Server Constants
 * Server configuration
 */

export const PORT = process.env.PORT || 3001;
export const HOST = process.env.HOST || '0.0.0.0';
export const DISPLAY_HOST = HOST === '0.0.0.0' ? 'localhost' : HOST;
