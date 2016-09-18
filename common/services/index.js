import { AdminAPI } from './admin';
import { EmbedAPI } from './embed';
import { DocumentAPI } from './document';
import { MediaAPI } from './media';
import { AutocompleteAPI } from './autocomplete';

/**
 * Just expose a single API object
 */
export const API = {
  admin: AdminAPI,
  embed: EmbedAPI,
  document: DocumentAPI,
  media: MediaAPI,
  autocomplete: AutocompleteAPI
};