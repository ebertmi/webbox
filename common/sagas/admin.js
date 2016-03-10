import { takeLatest } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import * as adminTypes from '../constants/AdminActionTypes';

import { API } from '../services';

// worker Saga : will be fired on GET_USERS_REQUEST actions
function* fetchUsers(action) {
  console.log('adminsaga', 'fetchUsers', API);
  try {
    const data = yield call(API.admin.getUsers, action.query);
    console.log(data);
    if (data.error) {
      yield put({type: adminTypes.GET_USERS_FAILURE, message: data.error.message});
    } else {
      yield put({type: adminTypes.GET_USERS_SUCCESS, users: data.users});
    }
  } catch (e) {
    yield put({type: adminTypes.GET_USERS_FAILURE, message: e.message});
  }
}

export default function* adminSaga() {
  // avoid multiple fetching of the same data
  yield* takeLatest(adminTypes.GET_USERS_REQUEST, fetchUsers);
}