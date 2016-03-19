import * as adminTypes from '../constants/AdminActionTypes';

export const INITIAL_EMBED_STATE = {
  embeds: [],
  embed: null,
  pagesQuery: {
    page: 1,
    limit: 15
  },
  pages: 1,
  filter: null,
  isFetching: false
};

export default function embed(state = INITIAL_EMBED_STATE, action) {
  switch (action.type) {
    case adminTypes.GET_EMBEDS_SUCCESS:
      return Object.assign({}, state, {
        isFetching: false,
        embeds: action.embeds,
        pages: action.pages || 1
      });
    case adminTypes.GET_EMBEDS_REQUEST:
      return Object.assign({}, state, {
        isFetching: true
      });
    case adminTypes.GET_EMBEDS_FAILURE:
      return Object.assign({}, state, {
        isFetching: false
      });
    case adminTypes.CHANGE_EMBEDS_PAGE:
      return Object.assign({}, state, {
        pagesQuery: {
          page: action.page,
          limit: state.pagesQuery.limit
        }
      });
    case adminTypes.CHANGE_EMBEDS_LIMIT:
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