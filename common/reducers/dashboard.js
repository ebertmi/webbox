import * as adminTypes from '../constants/AdminActionTypes';

const initalState = {
  logs: [],
  message: null,
  isFetching: false
};

export default function dashboard(state = initalState, action) {
  switch (action.type) {
    case adminTypes.DELETE_USER_FAILURE:
    case adminTypes.SAVE_USER_FAILURE:
    case adminTypes.GET_USER_FAILURE:
    case adminTypes.GET_USERS_FAILURE:
    case adminTypes.GET_EMBEDS_FAILURE:
    case adminTypes.GET_COURSES_FAILURE:
      return Object.assign({}, state, {
        message: {
          type: 'error',
          content: action.message
        }
      });
    case adminTypes.SAVE_USER_SUCCESS:
      return Object.assign({}, state, {
        message: {
          type: 'success',
          content: 'Gespeichert!'
        }
      });
    case adminTypes.RESET_MESSAGE:
      return Object.assign({}, state, {
        message: null
      });
    default:
      return state;
  }
}

