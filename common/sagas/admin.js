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
      yield put({type: adminTypes.GET_USERS_SUCCESS, users: data.users, pages: data.pages});
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
      yield put({type: adminTypes.GET_COURSES_SUCCESS, courses: data.courses, pages: data.pages});
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
      yield put({type: adminTypes.GET_EMBEDS_SUCCESS, embeds: data.embeds, pages: data.pages});
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
      yield put({type: adminTypes.GET_DOCUMENTS_SUCCESS, documents: data.documents, pages: data.pages});
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
      yield put({type: adminTypes.GET_LOGS_SUCCESS, logs: data.logs, pages: data.pages});
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
      yield put({type: adminTypes.GET_AUTHATTEMPTS_SUCCESS, attempts: data.attempts, pages: data.pages});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_AUTHATTEMPTS_FAILURE, message: e.message});
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
    fork(takeLatest, adminTypes.RESEND_USER_CONFIRMATION_EMAIL_REQUEST, resendConfirmationEmail),
    fork(takeLatest, adminTypes.GET_EMBEDS_REQUEST, fetchEmbeds),
    fork(takeLatest, adminTypes.GET_DOCUMENTS_REQUEST, fetchDocuments),
    fork(takeLatest, adminTypes.GET_COURSES_REQUEST, fetchCourses),
    fork(takeLatest, adminTypes.GET_COURSE_REQUEST, fetchCourse),
    fork(takeLatest, adminTypes.SAVE_COURSE_REQUEST, saveCourse),
    fork(takeLatest, adminTypes.DELETE_COURSE_REQUEST, deleteCourse),
    fork(takeLatest, adminTypes.GET_LOGS_REQUEST, fetchLogs),
    fork(takeLatest, adminTypes.GET_AUTHATTEMPTS_REQUEST, fetchAuthAttempts)
  ];
}