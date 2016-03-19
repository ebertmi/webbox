import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_COURSE_STATE = {
  courses: [],
  course: null,
  pagesQuery: {
    page: 1,
    limit: 10
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function course(state = INITIAL_COURSE_STATE, action) {
  switch (action.type) {
    case adminTypes.GET_COURSES_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        courses: action.courses,
        pages: action.pages || 1
      });
    case adminTypes.GET_COURSES_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_COURSES_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.CHANGE_COURSES_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit
        }
      });
    case adminTypes.CHANGE_COURSES_LIMIT:
      return Object.assign({}, state, {
        pagesQuery: {
          page: state.pagesQuery.page,
          limit: action.limit
        }
      });
    default:
      return state;
  }
}