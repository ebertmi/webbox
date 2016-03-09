import { LOAD_USERS_REQUEST } from '../constants/AdminActionTypes';

const initalState = {
  logs: [],
  message: { },
  isWorking: false
};

export default function dashboard(state = initalState, action) {
  switch (action.type) {
    case LOAD_USERS_REQUEST:
      return Object.assign({}, state, {
        isWorking: true,
      });
    default:
      return state;
  }
}

