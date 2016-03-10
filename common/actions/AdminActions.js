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