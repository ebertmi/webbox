import React, {Component} from 'react';
import { browserHistory } from 'react-router';

import { Pagination } from '../components/Pagination';

/**
 * Renders a pagination for with the given props and calls
 * callbacks when a page changes.
 * Keeps also the browser URL with the current page/limit query
 * in state.
 */
export class PaginationContainer extends Component {
  pushPageQuery(page, limit, q='') {
    // add to history
    browserHistory.push({
      pathname: this.props.location.pathname,
      query: {
        limit,
        page,
        q
      },
      state: this.props.location.state
    });
  }

  componentDidMount() {
    // get query params
    let { query } = this.props.location;
    let {limit, page, q } = this.props.pagesQuery;

    if (query.page) {
      page = query.page;
    }

    if (query.limit) {
      limit = query.limit;
    }

    if (query.q) {
      q = query.q;
    }

    this.pushPageQuery(page, limit, q);
    this.props.requestPage(page, limit, q);
  }

  handlePageChange(event) {
    const newPage = event.selected + 1;
    // check if we need to change
    if (this.props.pagesQuery.page === newPage) {
      return;
    }

    this.props.changePage(newPage);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.pagesQuery.page === nextProps.pagesQuery.page
        && this.props.pagesQuery.limit === nextProps.pagesQuery.limit
        && this.props.pagesQuery.q === nextProps.pagesQuery.q) {
      return;
    }

    this.pushPageQuery(nextProps.pagesQuery.page, nextProps.pagesQuery.limit, nextProps.pagesQuery.q);
    this.props.requestPage(nextProps.pagesQuery.page, nextProps.pagesQuery.limit, nextProps.pagesQuery.q);
  }

  render() {
    return (
      <div>
        {this.props.children}
        <Pagination
        clickCallback={this.handlePageChange.bind(this)}
        initialSelected={this.props.pagesQuery.page - 1 || 0}
        pageNum={this.props.pages} />
      </div>
    );
  }
}

PaginationContainer.propTypes = {
  changePage: React.PropTypes.func.isRequired,
  requestPage: React.PropTypes.func.isRequired,
  pages: React.PropTypes.number.isRequired,
  pagesQuery: React.PropTypes.shape({
    page: React.PropTypes.number.isRequired,
    limit: React.PropTypes.number.isRequired
  }).isRequired
};