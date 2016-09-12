import { Roles } from './constants';

/**
 * Get the roles/scope of the user. We have a check for compatibility.
 *
 * @param {any} user
 * @returns either {Array} of strings or throw exception
 */
function getRoles(user) {
  if (user.roles) {
    return user.roles;
  }

  if (user.scope) {
    return user.scope;
  }

  throw new Error('User/credentials object does not have "roles" or "scope" attribute.');
}

/**
 * Returns true if the user has the Admin role.
 *
 * @export
 * @param {any} user
 * @returns true or false
 */
export function isAdmin(user) {
  let roles = getRoles(user);
  if (roles == null) {
    return false;
  }

  return roles.includes(Roles.Admin);
}

/**
 * Returns true if the user has the Staff role.
 *
 * @export
 * @param {any} user
 * @returns true of false
 */
export function isStaff(user) {
  let roles = getRoles(user);
  if (roles == null) {
    return false;
  }

  return roles.includes(Roles.Staff);
}