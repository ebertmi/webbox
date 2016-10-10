import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_USER_STATE = {
  users: [],
  user: null,
  pages: 1,
  count: 0,
  pagesQuery: {
    page: 1,
    limit: 15,
    q: ''
  },
  filter: null,
  isFetching: false
};

export default function user(state = INITIAL_USER_STATE, action) {
  switch (action.type) {
    case adminTypes.GET_USERS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_USERS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        users: action.users,
        pages: action.pages != null ? action.pages : 1,
        count: action.count != null ? action.count : 0
      });
    case adminTypes.GET_USER_SUCCESS:
    case adminTypes.CONFIRM_USER_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        user: action.user
      });
    case adminTypes.GET_USER_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.CHANGE_USER_FORMDATA:
      return Object.assign({}, state, {
        user: Object.assign({}, state.user, action.update)
      });
    case adminTypes.SAVE_USER_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        user: action.user
      });
    case adminTypes.SAVE_USER_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
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
    case adminTypes.CHANGE_USERS_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit,
          q: state.pagesQuery.q
        }
      });
    case adminTypes.CHANGE_USERS_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit,
          q: state.pagesQuery.q
        }
      });
    case adminTypes.CHANGE_USERS_SEARCH:
      return Object.assign({}, state, {
        pagesQuery: {
          page: 1,
          limit: state.pagesQuery.limit,
          q: action.q
        }
      });
    case adminTypes.DELETE_USER_FAILURE:
    case adminTypes.GET_USERS_FAILURE:
    case adminTypes.GET_USER_FAILURE:
    case adminTypes.SAVE_USER_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    default:
      return state;
  }
}

