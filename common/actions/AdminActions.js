import * as types from '../constants/AdminActionTypes';

export function requestUsers(page = 1, limit = 15) {
  return {
    type: types.GET_USERS_REQUEST,
    query: {
      page,
      limit
    }
  };
}

export function updateUser(user) {
  return {
    type: types.GET_USER_SUCCESS,
    user: user
  };
}

export function getUser(id) {
  return {
    type: types.GET_USER_REQUEST,
    params: {
      id: id
    }
  };
}

export function updateUserForm(update) {
  return {
    type: types.CHANGE_USER_FORMDATA,
    update: update
  };
}

export function saveUser(user) {
  return {
    type: types.SAVE_USER_REQUEST,
    payload: {
      user: user
    },
    params: {
      id: user.id
    }
  };
}

export function deleteUser(user) {
  return {
    type: types.DELETE_USER_REQUEST,
    params: {
      id: user.id
    }
  };
}

export function resetMessage() {
  return {
    type: types.RESET_MESSAGE
  };
}

/**
 * Admin/Course
 */
export function requestCourses(page = 1, limit = 15) {
  return {
    type: types.GET_COURSES_REQUEST,
    query: {
      page,
      limit
    }
  };
}

/**
 * Admin/Embed
 */
export function requestEmbeds(page = 1, limit = 15) {
  return {
    type: types.GET_EMBEDS_REQUEST,
    query: {
      page,
      limit
    }
  };
}