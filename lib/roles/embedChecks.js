/**
 * Permission checks for embeds / codeDocuments
 */

import { isAdmin, isStaff } from './checks';

/**
 * Permission to change the original code of an embed!
 *
 * @export
 * @param {any} embed
 * @param {any} user
 */
export function canEditEmbed(embed, user) {
  return embed._creatorId === user.id;
}

/**
 * Update attributes of an embed (e.g. embedType, language)
 *
 * @export
 * @param {any} embed
 * @param {any} user
 */
export function canUpdateEmbed(embed, user) {
  return embed._creatorId === user.id;
}

/**
 * Delete and embed
 *
 * @export
 * @param {any} embed
 * @param {any} user
 */
export function canDeleteEmbed(embed, user) {
  return embed._creatorId === user.id;
}

export function canViewStatistics(embed, user) {
  return embed._creatorId === user.id;
}

/**
 * Only logged in users can save an embed!
 *
 * @export
 * @param {any} embed
 * @param {any} user
 */
export function canSaveEmbed(embed, user) {
  return embed._creatorId === user.id;
}