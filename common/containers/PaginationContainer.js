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
  pushPageQuery(query) {
    // add to history
    browserHistory.push({
      pathname: this.props.location.pathname,
      query: query,
      state: this.props.location.state
    });
  }

  componentDidMount() {
    // get query params
    let { query } = this.props.location;

    // generic query param updating
    query = Object.assign({}, this.props.pagesQuery, query);

    this.pushPageQuery(query);
    this.props.requestPage(query);
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
    // generic diff on plain object
    let param;
    let foundChange = false;
    for (param in nextProps.pagesQuery) {
      if (nextProps.pagesQuery[param] != this.props.pagesQuery[param]) {
        foundChange = true;
        break;
      }
    }

    if (foundChange) {
      this.pushPageQuery(nextProps.pagesQuery);
      this.props.requestPage(nextProps.pagesQuery);
    }
  }

  render() {
    return (
      <div>
        {this.props.children}
        <Pagination
        onPageChange={this.handlePageChange.bind(this)}
        initialPage={this.props.pagesQuery.page - 1 || 0}
        pageCount={this.props.pages} />
      </div>
    );
  }
}

PaginationContainer.propTypes = {
  changePage: React.PropTypes.func.isRequired, // callback for page changes
  requestPage: React.PropTypes.func.isRequired, // callback for requesting new page
  pages: React.PropTypes.number.isRequired, // total number of pages
  pagesQuery: React.PropTypes.shape({
    page: React.PropTypes.number.isRequired, // current page
    limit: React.PropTypes.number.isRequired // current number of entries per page (max)
  }).isRequired
};