import { takeEvery, takeLatest } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
//import Api from '...';

// worker Saga : will be fired on USER_FETCH_REQUESTED actions
function* fetchUsers(action) {
  try {
    const user = yield call(Api.fetchUser, action.payload.userId);
    yield put({type: "USER_FETCH_SUCCEEDED", user: user});
  } catch (e) {
    yield put({type: "USER_FETCH_FAILED",message: e.message});
  }
}

/*
  starts fetchUser on each dispatched `USER_FETCH_REQUESTED` action
  Allow concurrent fetches of user
*/
export default function* adminSaga() {
  yield* [];
}