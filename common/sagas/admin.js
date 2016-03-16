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
      //browserHistory.push('/admin/users');
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

function* watchGetUsers() {
  yield* takeLatest(adminTypes.GET_USERS_REQUEST, fetchUsers);
}

function* watchGetUser() {
  yield* takeLatest(adminTypes.GET_USER_REQUEST, fetchUser);
}

function* watchSaveUser() {
  yield* takeLatest(adminTypes.SAVE_USER_REQUEST, saveUser);
}

function* watchDeleteUser() {
  yield* takeLatest(adminTypes.DELETE_USER_REQUEST, deleteUser);
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

function* watchGetCourses() {
  yield* takeLatest(adminTypes.GET_COURSES_REQUEST, fetchCourses);
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

function* watchGetEmbeds() {
  yield* takeLatest(adminTypes.GET_EMBEDS_REQUEST, fetchEmbeds);
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

function* watchGetLogs() {
  yield* takeLatest(adminTypes.GET_LOGS_REQUEST, fetchLogs);
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

function* watchGetAuthAttempts() {
  yield* takeLatest(adminTypes.GET_AUTHATTEMPTS_REQUEST, fetchAuthAttempts);
}

export default function* adminSaga () {
  // avoid multiple fetching of the same data
  yield [
    fork(watchGetUser),
    fork(watchSaveUser),
    fork(watchGetUsers),
    fork(watchDeleteUser),
    fork(watchGetEmbeds),
    fork(watchGetCourses),
    fork(watchGetLogs),
    fork(watchGetAuthAttempts)
  ];
}