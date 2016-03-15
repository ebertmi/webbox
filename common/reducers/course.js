import * as adminTypes from '../constants/AdminActionTypes';

const initalState = {
  courses: [],
  course: null,
  coursesQuery: {
    page: 1,
    limit: 10
  },
  filter: null,
  isFetching: false
};

export default function course(state = initalState, action) {
  switch (action.type) {
    case adminTypes.GET_COURSES_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        courses: action.courses
      });
    default:
      return state;
  }
}