/**
 * redux-saga is a library that aims to make side effects (i.e. asynchronous things like data fetching and impure things like accessing the
 * browser cache) in React/Redux applications easier and better. (https://github.com/yelouafi/redux-saga)
 *
 * The functions here are called by the saga middleware when the actions are triggered by the action dispatcher.
 */
import { takeLatest } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects';
import * as adminTypes from '../constants/AdminActionTypes';
import { API } from '../services';

// worker Saga : will be fired on GET_USERS_REQUEST actions
function* fetchUsers (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getUsers, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_USERS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_USERS_SUCCESS, users: data.users, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_USERS_FAILURE, message: e.message});
  }
}

// worker Saga : will be fired on GET_USERS_REQUEST actions
function* fetchUser (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getUser, action.params);

    if (data.error) {
      yield put({type: adminTypes.GET_USER_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_USER_SUCCESS, user: data.user});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_USER_FAILURE, message: e.message});
  }
}

function* deleteUser (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.deleteUser, action.params, action.payload);

    if (data.error) {
      yield put({type: adminTypes.DELETE_USER_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.DELETE_USER_SUCCESS});
    }
  } catch (e) {
    yield put({type: adminTypes.DELETE_USER_FAILURE, message: e.message});
  }
}

function* saveUser (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.saveUser, action.params, action.payload);

    if (data.error) {
      yield put({type: adminTypes.SAVE_USER_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.SAVE_USER_SUCCESS, user: data.user});
    }
  } catch (e) {
    yield put({type: adminTypes.SAVE_USER_FAILURE, message: e.message});
  }
}

function* confirmUser (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.confirmUser, action.params, action.payload);

    if (data.error) {
      yield put({type: adminTypes.CONFIRM_USER_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.CONFIRM_USER_SUCCESS, user: data.user});
    }
  } catch (e) {
    yield put({type: adminTypes.CONFIRM_USER_FAILURE, message: e.message});
  }
}

function* resendConfirmationEmail (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.resendConfirmationEmail, action.params);

    if (data.error) {
      yield put({type: adminTypes.RESEND_USER_CONFIRMATION_EMAIL_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.RESEND_USER_CONFIRMATION_EMAIL_SUCCESS});
    }
  } catch (e) {
    yield put({type: adminTypes.RESEND_USER_CONFIRMATION_EMAIL_FAILURE, message: e.message});
  }
}

function* unblockUser (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.unblockUser, action.params);

    if (data.error) {
      yield put({type: adminTypes.UNBLOCK_USER_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.UNBLOCK_USER_SUCCESS});
    }
  } catch (e) {
    yield put({type: adminTypes.UNBLOCK_USER_FAILURE, message: e.message});
  }
}

/**
 * Course fetching...
 */
function* fetchCourses (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getCourses, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_COURSES_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_COURSES_SUCCESS, courses: data.courses, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_COURSES_FAILURE, message: e.message});
  }
}

// worker Saga : will be fired on GET_USERS_REQUEST actions
function* fetchCourse (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getCourse, action.params);

    if (data.error) {
      yield put({type: adminTypes.GET_COURSE_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_COURSE_SUCCESS, course: data.course});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_COURSE_FAILURE, message: e.message});
  }
}

function* deleteCourse (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.deleteCourse, action.params, action.payload);

    if (data.error) {
      yield put({type: adminTypes.DELETE_COURSE_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.DELETE_COURSE_SUCCESS});
    }
  } catch (e) {
    yield put({type: adminTypes.DELETE_COURSE_FAILURE, message: e.message});
  }
}

function* saveCourse (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.saveCourse, action.params, action.payload);

    if (data.error) {
      yield put({type: adminTypes.SAVE_COURSE_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.SAVE_COURSE_SUCCESS, course: data.course});
    }
  } catch (e) {
    yield put({type: adminTypes.SAVE_COURSE_FAILURE, message: e.message});
  }
}

/**
 * Embed fetching...
 */
function* fetchEmbeds (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getEmbeds, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_EMBEDS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_EMBEDS_SUCCESS, embeds: data.embeds, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_EMBEDS_FAILURE, message: e.message});
  }
}

/**
 * Documents fetching...
 */
function* fetchDocuments (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getDocuments, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_DOCUMENTS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_DOCUMENTS_SUCCESS, documents: data.documents, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_DOCUMENTS_FAILURE, message: e.message});
  }
}

/**
 * Log fetching...
 */
function* fetchLogs (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getLogs, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_LOGS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_LOGS_SUCCESS, logs: data.logs, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_LOGS_FAILURE, message: e.message});
  }
}

/**
 * Log fetching...
 */
function* fetchAuthAttempts (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getAuthAttempts, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_AUTHATTEMPTS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_AUTHATTEMPTS_SUCCESS, attempts: data.attempts, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_AUTHATTEMPTS_FAILURE, message: e.message});
  }
}

/**
 * Log fetching...
 */
function* fetchDeleteAllAuthAttempts () {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.deleteAllAuthAttempts);

    if (data.error) {
      yield put({type: adminTypes.DELETE_AUTHATTEMPTS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.DELETE_AUTHATTEMPTS_SUCCESS, attempts: data.attempts, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.DELETE_AUTHATTEMPTS_FAILURE, message: e.message});
  }
}

/**
 * Recyclebin entries fetching...
 */
function* fetchRecyclebinEntries (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.getRecyclebinEntries, action.query);

    if (data.error) {
      yield put({type: adminTypes.GET_RECYCLEBIN_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_RECYCLEBIN_SUCCESS, entries: data.entries, pages: data.pages, count: data.count});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_RECYCLEBIN_FAILURE, message: e.message});
  }
}

/**
 * Recyclebin entries fetching...
 */
function* fetchSendMail (action) {
  try {
    // reset notification message
    yield put({ type: adminTypes.RESET_MESSAGE });

    const data = yield call(API.admin.sendMail, action.payload);

    if (data.error) {
      yield put({type: adminTypes.SEND_MAIL_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.SEND_MAIL_SUCCESS});
    }
  } catch (e) {
    yield put({type: adminTypes.SEND_MAIL_FAILURE, message: e.message});
  }
}

export default function* adminSaga () {
  // avoid multiple fetching of the same data
  yield [
    fork(takeLatest, adminTypes.GET_USER_REQUEST, fetchUser),
    fork(takeLatest, adminTypes.SAVE_USER_REQUEST, saveUser),
    fork(takeLatest, adminTypes.GET_USERS_REQUEST, fetchUsers),
    fork(takeLatest, adminTypes.DELETE_USER_REQUEST, deleteUser),
    fork(takeLatest, adminTypes.UNBLOCK_USER_REQUEST, unblockUser),
    fork(takeLatest, adminTypes.CONFIRM_USER_REQUEST, confirmUser),
    fork(takeLatest, adminTypes.RESEND_USER_CONFIRMATION_EMAIL_REQUEST, resendConfirmationEmail),
    fork(takeLatest, adminTypes.GET_EMBEDS_REQUEST, fetchEmbeds),
    fork(takeLatest, adminTypes.GET_DOCUMENTS_REQUEST, fetchDocuments),
    fork(takeLatest, adminTypes.GET_COURSES_REQUEST, fetchCourses),
    fork(takeLatest, adminTypes.GET_COURSE_REQUEST, fetchCourse),
    fork(takeLatest, adminTypes.SAVE_COURSE_REQUEST, saveCourse),
    fork(takeLatest, adminTypes.DELETE_COURSE_REQUEST, deleteCourse),
    fork(takeLatest, adminTypes.GET_LOGS_REQUEST, fetchLogs),
    fork(takeLatest, adminTypes.GET_AUTHATTEMPTS_REQUEST, fetchAuthAttempts),
    fork(takeLatest, adminTypes.DELETE_AUTHATTEMPTS_REQUEST, fetchDeleteAllAuthAttempts),
    fork(takeLatest, adminTypes.GET_RECYCLEBIN_REQUEST, fetchRecyclebinEntries),
    fork(takeLatest, adminTypes.SEND_MAIL_REQUEST, fetchSendMail)
  ];
}