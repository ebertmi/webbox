import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_DASHBOARD_STATE = {
  message: null,
  isFetching: false
};

export default function dashboard(state = INITIAL_DASHBOARD_STATE, action) {
  switch (action.type) {
    case adminTypes.DELETE_USER_FAILURE:
    case adminTypes.UNBLOCK_USER_FAILURE:
    case adminTypes.RESEND_USER_CONFIRMATION_EMAIL_FAILURE:
    case adminTypes.SAVE_USER_FAILURE:
    case adminTypes.GET_USER_FAILURE:
    case adminTypes.GET_USERS_FAILURE:
    case adminTypes.GET_EMBEDS_FAILURE:
    case adminTypes.GET_DOCUMENTS_FAILURE:
    case adminTypes.GET_COURSES_FAILURE:
    case adminTypes.GET_AUTHATTEMPTS_FAILURE:
    case adminTypes.DELETE_COURSE_FAILURE:
    case adminTypes.SAVE_COURSE_FAILURE:
    case adminTypes.GET_COURSE_FAILURE:
    case adminTypes.SEND_MAIL_FAILURE:
      return Object.assign({}, state, {
        message: {
          type: 'error',
          content: action.message
        }
      });
    case adminTypes.SAVE_COURSE_REQUEST:
    case adminTypes.SAVE_USER_SUCCESS:
      return Object.assign({}, state, {
        message: {
          type: 'success',
          content: 'Gespeichert!'
        }
      });
    case adminTypes.RESEND_USER_CONFIRMATION_EMAIL_SUCCESS:
    case adminTypes.UNBLOCK_USER_SUCCESS:
    case adminTypes.CONFIRM_USER_SUCCESS:
    case adminTypes.SEND_MAIL_SUCCESS:
      return Object.assign({}, state, {
        message: {
          type: 'success',
          content: 'Durchgeführt.'
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
