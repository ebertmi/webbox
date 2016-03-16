import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_LOG_STATE = {
  logs: [],
  log: null,
  pagesQuery: {
    page: 1,
    limit: 10
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function log(state = INITIAL_LOG_STATE, action) {
  switch (action.type) {
    case adminTypes.CHANGE_LOGS_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit
        }
      });
    case adminTypes.CHANGE_LOGS_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit
        }
      });
    case adminTypes.GET_LOGS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_LOGS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.GET_LOGS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        logs: action.logs,
        pages: action.pages || 1
      });
    default:
      return state;
  }
}