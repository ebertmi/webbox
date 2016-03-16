import * as types from '../constants/AdminActionTypes';

export function requestUsersPage(page = 1, limit = 15) {
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

export function changeUsersPage(page) {
  return {
    type: types.CHANGE_USERS_PAGE,
    page: page
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
export function requestCoursesPage(page = 1, limit = 15) {
  return {
    type: types.GET_COURSES_REQUEST,
    query: {
      page,
      limit
    }
  };
}

export function changeCoursesPage(page) {
  return {
    type: types.CHANGE_COURSES_PAGE,
    page: page
  };
}

/**
 * Admin/Embed
 */
export function requestEmbedsPage(page = 1, limit = 15) {
  return {
    type: types.GET_EMBEDS_REQUEST,
    query: {
      page,
      limit
    }
  };
}

export function changeEmbedsPage(page) {
  return {
    type: types.CHANGE_EMBEDS_PAGE,
    page: page
  };
}

/**
 * Admin/Log
 */
export function requestLogsPage(page = 1, limit = 15) {
  return {
    type: types.GET_LOGS_REQUEST,
    query: {
      page,
      limit
    }
  };
}

export function changeLogsPage(page) {
  return {
    type: types.CHANGE_LOGS_PAGE,
    page: page
  };
}

/**
 * Admin/Logingattempt
 */
export function requestAuthAttemptsPage(page = 1, limit = 15) {
  return {
    type: types.GET_AUTHATTEMPTS_REQUEST,
    query: {
      page,
      limit
    }
  };
}

export function changeAuthAttemptsPage(page) {
  return {
    type: types.CHANGE_AUTHATTEMPTS_PAGE,
    page: page
  };
}