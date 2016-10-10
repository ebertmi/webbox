import * as types from '../constants/AdminActionTypes';

export function requestUsersPage(query) {

  return {
    type: types.GET_USERS_REQUEST,
    query: query
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

export function unblockUser(user) {
  return {
    type: types.UNBLOCK_USER_REQUEST,
    params: {
      id: user.id
    }
  };
}

export function resendUserConfirmationEmail(user) {
  return {
    type: types.RESEND_USER_CONFIRMATION_EMAIL_REQUEST,
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

export function changeUsersSearch(search) {
  return {
    type: types.CHANGE_USERS_SEARCH,
    q: search
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
export function requestCoursesPage(query) {
  return {
    type: types.GET_COURSES_REQUEST,
    query: query
  };
}

export function changeCoursesPage(page) {
  return {
    type: types.CHANGE_COURSES_PAGE,
    page: page
  };
}

export function updateCourse(course) {
  return {
    type: types.GET_COURSE_SUCCESS,
    course: course
  };
}

export function getCourse(id) {
  return {
    type: types.GET_COURSE_REQUEST,
    params: {
      id: id
    }
  };
}

export function updateCourseForm(update) {
  return {
    type: types.CHANGE_COURSE_FORMDATA,
    update: update
  };
}

export function saveCourse(course) {
  return {
    type: types.SAVE_COURSE_REQUEST,
    payload: {
      course: course
    },
    params: {
      id: course.id
    }
  };
}

export function deleteCourse(course) {
  return {
    type: types.DELETE_COURSE_REQUEST,
    params: {
      id: course.id
    }
  };
}

/**
 * Admin/Embed
 */
export function requestEmbedsPage(query) {
  return {
    type: types.GET_EMBEDS_REQUEST,
    query: query
  };
}

export function changeEmbedsPage(page) {
  return {
    type: types.CHANGE_EMBEDS_PAGE,
    page: page
  };
}


/**
 * Admin/Documents
 */
export function requestDocumentsPage(query) {
  return {
    type: types.GET_DOCUMENTS_REQUEST,
    query: query
  };
}

export function changeDocumentsPage(page) {
  return {
    type: types.CHANGE_DOCUMENTS_PAGE,
    page: page
  };
}

/**
 * Admin/Log
 */
export function requestLogsPage(query) {
  return {
    type: types.GET_LOGS_REQUEST,
    query: query
  };
}

export function changeLogsPage(page) {
  return {
    type: types.CHANGE_LOGS_PAGE,
    page: page
  };
}

export function changeLogsSearch(search) {
  return {
    type: types.CHANGE_LOGS_SEARCH,
    q: search
  };
}

/**
 * Admin/Loginattempt
 */
export function requestAuthAttemptsPage(query) {
  return {
    type: types.GET_AUTHATTEMPTS_REQUEST,
    query: query
  };
}

export function changeAuthAttemptsPage(page) {
  return {
    type: types.CHANGE_AUTHATTEMPTS_PAGE,
    page: page
  };
}

/**
 * Admin / recyclebin
 */
export function requestRecyclebinPage(query) {
  return {
    type: types.GET_RECYCLEBIN_REQUEST,
    query: query
  };
}

export function changeRecyclebinPage(page) {
  return {
    type: types.CHANGE_RECYCLEBIN_PAGE,
    page: page
  };
}

/**
 * General individual email send request.
 *
 * @export
 * @param {any} email - The email address of the person (only one!)
 * @param {any} subject
 * @param {any} message
 * @returns
 */
export function sendMail(email, subject, message) {
  return {
    type: types.SEND_MAIL_REQUEST,
    payload: {
      email: email,
      subject: subject,
      message: message
    }
  };
}

export function changeMailData(mail) {
  return {
    type: types.CHANGE_MAIL_DATA,
    mail
  };
}

export function confirmUser(user) {
  return {
    type: types.CONFIRM_USER_REQUEST,
    params: {
      id: user.id
    }
  };
}