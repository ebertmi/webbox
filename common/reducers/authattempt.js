import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_AUTHATTEMPT_STATE = {
  attempts: [],
  attempt: null,
  pagesQuery: {
    page: 1,
    limit: 10
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function authAttempt(state = INITIAL_AUTHATTEMPT_STATE, action) {
  switch (action.type) {
    case adminTypes.CHANGE_AUTHATTEMPTS_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit
        }
      });
    case adminTypes.CHANGE_AUTHATTEMPTS_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit
        }
      });
    case adminTypes.GET_AUTHATTEMPTS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_AUTHATTEMPTS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.GET_AUTHATTEMPTS_SUCCESS:
      console.log('GET_AUTHATTEMPTS_SUCCESS', action);
      return Object.assign({}, state, {
        isFetching: false,
        attempts: action.attempts,
        pages: action.pages || 1
      });
    default:
      return state;
  }
}