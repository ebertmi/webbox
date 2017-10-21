import React, { Component } from 'react';
import PropTypes from 'prop-types';
import noop from 'lodash/noop';

import Icon from '../Icon';

export class SearchBar extends Component {

  constructor(props) {
    super(props);

    this.handleSearchClick = this.handleSearchClick.bind(this);
    this.handleSearchQuery = this.handleSearchQuery.bind(this);

    this.state = {
      q: this.props.searchQuery
    };
  }

  renderSearchResetButton () {
    if (this.props.searchQuery === null || this.props.searchQuery === '') {
      return null;
    }

    return <button onClick={this.props.resetSearchHandler} type="button" className="btn btn-warning btn-sm">Zurücksetzen</button>;
  }

  handleSearchQuery (event) {
    event.preventDefault();
    const value = event.target.value;

    this.setState({
      q: value
    });

    this.props.changeSearchQuery(value);
  }

  handleSearchClick (event) {
    event.preventDefault();
    this.props.searchClickHandler(this.state.q);
  }

  render() {
    const help = this.props.showHelpIcon ? <Icon onClick={this.props.onSearchHelp} name="question-circle" title="Hilfe zur Suche" /> : null;
    return (
        <div className="row table-search-bar">
          <div className="col-sm-6">
            <form className="form-inline" onSubmit={this.handleSearchClick}>
              <div className="form-group">
                <div className="input-group">
                  <input style={{width: "auto"}} defaultValue={this.props.searchQuery} onChange={this.handleSearchQuery} type="text" className="form-control form-control-sm" placeholder={this.props.placeholderText} />
                  <span className="input-group-btn">
                    <button onClick={this.handleSearchClick} className="btn btn-sm btn-info" type="button">Suchen</button>
                  </span>
                </div>
              </div>
              {this.renderSearchResetButton()}
              {help}
            </form>
          </div>
        </div>
    );
  }
}

SearchBar.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  changeSearchQuery: PropTypes.func.isRequired,
  searchClickHandler: PropTypes.func.isRequired,
  resetSearchHandler: PropTypes.func.isRequired,
  placeholderText: PropTypes.string,
  showHelpIcon: PropTypes.bool,
  onSearchHelp: PropTypes.func
};

SearchBar.defaultProps = {
  placeholderText: 'Suchbegriff...',
  showHelpIcon: false,
  onSearchHelp: noop
};