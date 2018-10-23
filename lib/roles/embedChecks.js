/**
 * Permission checks for embeds / codeDocuments
 */

import { isAdmin, isStaff } from './checks';
import includes from 'lodash/includes';
import flatMap from 'lodash/flatMap';

/**
 * Permission to change the original code of an embed!
 *
 * @export
 * @param {CodeEmbed} embed - embed
 * @param {User} user - user
 * @returns {boolean} true if user has permission
 */
export function canEditEmbed(embed, user) {
  if (embed._creatorId === user.id) {
    return true;
  }

  // check the other co-creators
  if (includes(flatMap(embed.creators, e => e.id), user.id)) {
    return true;
  }

  return false;
}

/**
 * Update attributes of an embed (e.g. name, embedType, language, creators, etc..)
 *
 * @export
 * @param {CodeEmbed} embed - embed
 * @param {User} user - user
 * @returns {boolean} true if user has permission
 */
export function canUpdateEmbed(embed, user) {
  if (embed._creatorId === user.id) {
    return true;
  }

  // check the other co-creators
  if (includes(flatMap(embed.creators, e => e.id), user.id)) {
    return true;
  }

  // explicit check for admin group
  if (isAdmin(user)) {
    return true;
  }

  return false;
}

/**
 * Delete and embed
 *
 * @export
 * @param {CodeEmbed} embed - embed
 * @param {User} user - user
 * @returns {boolean} true if user has permission
 */
export function canDeleteEmbed(embed, user) {
  return embed._creatorId === user.id;
}

export function canViewStatistics(embed, user) {
  if (embed._creatorId === user.id) {
    return true;
  }

  // check the other co-creators
  if (includes(flatMap(embed.creators, e => e.id), user.id)) {
    return true;
  }

  // explicit check for admin group
  if (isAdmin(user)) {
    return true;
  }

  return false;
}

/**
 * Only logged in users can save an embed!
 *
 * @export
 * @param {CodeEmbed} embed - embed
 * @param {User} user - user
 * @returns {boolean} true if user has permission
 */
export function canSaveEmbed(embed, user) {
  if (embed._creatorId === user.id) {
    return true;
  }

  // check the other co-creators
  if (includes(flatMap(embed.creators, e => e.id), user.id)) {
    return true;
  }

  return false;
}