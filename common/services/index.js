import { AdminAPI } from './admin';
import { EmbedAPI } from './embed';

/**
 * Just expose a single API object
 */
export const API = {
  admin: AdminAPI,
  embed: EmbedAPI
};