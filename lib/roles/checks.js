import { Roles } from './constants';

/**
 * Get the roles/scope of the user. We have a check for compatibility.
 *
 * @param {object} user - user to checck
 * @returns {Array<string>} array of strings listing the roles
 * @throws {Error}
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
 * @param {object} user user to check
 * @returns {boolean} - true if user has admin scope/role
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
 * @param {object} user user to check
 * @returns {boolean} - true if user has staff scope/role
 */
export function isStaff(user) {
  let roles = getRoles(user);
  if (roles == null) {
    return false;
  }

  return roles.includes(Roles.Staff);
}