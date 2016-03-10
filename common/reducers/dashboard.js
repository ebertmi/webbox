import { GET_USERS_REQUEST, GET_USERS_SUCCESS, GET_USERS_FAILURE } from '../constants/AdminActionTypes';

const initalState = {
  logs: [],
  users: [],
  message: { },
  isFetching: false
};

export default function dashboard(state = initalState, action) {
  switch (action.type) {
    case GET_USERS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case GET_USERS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false,
        message: {
          type: 'error',
          content: action.message
        }
      });
    case GET_USERS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        users: action.users
      });
    default:
      return state;
  }
}

