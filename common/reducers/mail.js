import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_MAIL_STATE = {
  mail: {
    subject: '',
    email: '',
    message: ''
  },
  activeTab: 0,
};

export default function mail(state = INITIAL_MAIL_STATE, action) {
  switch (action.type) {
    case adminTypes.CHANGE_MAIL_DATA:
      return Object.assign({}, state, {
        mail: action.mail
      });
    case adminTypes.SEND_MAIL_SUCCESS:
      return Object.assign({}, state, {
        mail: {
          email: '',
          subject: state.mail.subject,
          message: state.mail.message
        }
      });
    case adminTypes.SEND_MAIL_FAILURE:
      return Object.assign({}, state, {

      });
    default:
      return state;
  }
}