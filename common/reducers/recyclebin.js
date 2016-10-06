import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_RECYCLEBIN_STATE = {
  entries: [],
  entry: null,
  count: 0,
  pagesQuery: {
    page: 1,
    limit: 10
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function recyclebin(state = INITIAL_RECYCLEBIN_STATE, action) {
  switch (action.type) {
    case adminTypes.CHANGE_RECYCLEBIN_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit
        }
      });
    case adminTypes.CHANGE_RECYCLEBIN_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit
        }
      });
    case adminTypes.GET_RECYCLEBIN_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_RECYCLEBIN_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.GET_RECYCLEBIN_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        entries: action.entries,
        pages: action.pages != null ? action.pages : 1,
        count: action.count != null ? action.count : 0
      });
    default:
      return state;
  }
}