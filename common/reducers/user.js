import * as adminTypes from '../constants/AdminActionTypes';

const initalState = {
  users: [],
  user: null,
  usersQuery: {
    page: 1,
    limit: 10
  },
  filter: null,
  isFetching: false
};

export default function dashboard(state = initalState, action) {
  switch (action.type) {
    case adminTypes.GET_USERS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_USERS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.GET_USERS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        users: action.users
      });
    case adminTypes.GET_USER_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        user: action.user
      });
    case adminTypes.GET_USER_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_USER_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.CHANGE_USER_FORMDATA:
      return Object.assign({}, state, {
        user: Object.assign({}, state.user, action.update)
      });
    case adminTypes.SAVE_USER_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        user: action.user,
        message: {
          type: 'success',
          content: 'Gespeichert!'
        }
      });
    case adminTypes.SAVE_USER_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.SAVE_USER_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.DELETE_USER_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        user: {
          isDeleted: true
        }
      });
    case adminTypes.DELETE_USER_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.DELETE_USER_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    default:
      return state;
  }
}

