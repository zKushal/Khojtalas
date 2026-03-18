declare const api: any;

export const TOKEN_STORAGE_KEY: string;
export const USER_STORAGE_KEY: string;
export function getApiErrorMessage(error: any, fallback?: string): string;
export function buildMediaUrl(mediaUrl: string): string;
export default api;
