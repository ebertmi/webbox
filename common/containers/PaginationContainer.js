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
  pushPageQuery(page, limit) {
    // add to history
    browserHistory.push({
      pathname: this.props.location.pathname,
      query: {
        limit,
        page
      },
      state: this.props.location.state
    });
  }

  componentDidMount() {
    // get query params
    let { query } = this.props.location;
    let {limit, page } = this.props.pagesQuery;

    if (query.page) {
      page = query.page;
    }

    if (query.limit) {
      limit = query.limit;
    }

    this.pushPageQuery(page, limit);
    this.props.requestPage(page, limit);
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
    if (this.props.pagesQuery.page === nextProps.pagesQuery.page && this.props.pagesQuery.limit === nextProps.pagesQuery.limit) {
      return;
    }

    this.pushPageQuery(nextProps.pagesQuery.page, nextProps.pagesQuery.limit);
    this.props.requestPage(nextProps.pagesQuery.page, nextProps.pagesQuery.limit);
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