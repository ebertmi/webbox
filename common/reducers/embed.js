import * as adminTypes from '../constants/AdminActionTypes';

const initalState = {
  embeds: [],
  embed: null,
  embedsQuery: {
    page: 1,
    limit: 10
  },
  filter: null,
  isFetching: false
};

export default function embed(state = initalState, action) {
  switch (action.type) {
    case adminTypes.GET_EMBEDS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        embeds: action.embeds
      });
    default:
      return state;
  }
}