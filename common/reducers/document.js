import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_DOCUMENTS_STATE = {
  documents: [],
  document: null,
  count: 0,
  pagesQuery: {
    page: 1,
    limit: 15,
    q: ''
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function document(state = INITIAL_DOCUMENTS_STATE, action) {
  switch (action.type) {
    case adminTypes.GET_DOCUMENTS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        documents: action.documents,
        pages: action.pages != null ? action.pages : 1,
        count: action.count != null ? action.count : 1
      });
    case adminTypes.GET_DOCUMENTS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_DOCUMENTS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.CHANGE_DOCUMENTS_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit,
          q: state.pagesQuery.q
        }
      });
    case adminTypes.CHANGE_DOCUMENTS_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit,
          q: state.pagesQuery.q
        }
      });
    case adminTypes.CHANGE_DOCUMENTS_SEARCH:
      return Object.assign({}, state, {
        pagesQuery: {
          page: 1,
          limit: state.pagesQuery.limit,
          q: action.q
        }
      });
    default:
      return state;
  }
}