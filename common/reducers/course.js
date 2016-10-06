import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_COURSE_STATE = {
  courses: [],
  course: null,
  count: 0,
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
        pages: action.pages != null ? action.pages : 1,
        count: action.count != null ? action.count : 1
      });
    case adminTypes.GET_COURSES_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
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
    case adminTypes.GET_COURSE_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        course: action.course
      });
    case adminTypes.GET_COURSE_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.CHANGE_COURSE_FORMDATA:
      return Object.assign({}, state, {
        course: Object.assign({}, state.course, action.update)
      });
    case adminTypes.SAVE_COURSE_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        course: action.course
      });
    case adminTypes.SAVE_COURSE_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.DELETE_COURSE_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        course: {
          isDeleted: true
        }
      });
    case adminTypes.DELETE_COURSE_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    /* Case fallthrough */
    case adminTypes.DELETE_COURSE_FAILURE:
    case adminTypes.SAVE_COURSE_FAILURE:
    case adminTypes.GET_COURSE_FAILURE:
    case adminTypes.GET_COURSES_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    default:
      return state;
  }
}