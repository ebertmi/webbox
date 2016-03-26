import React, { Component } from 'react';

export class SearchBar extends Component {

  componentWillMount () {
    this.setState({
      q: this.props.searchQuery
    });
  }

  renderSearchResetButton () {
    if (this.props.searchQuery === null || this.props.searchQuery === '') {
      return null;
    }

    return <button onClick={this.props.resetSearchHandler} type="button" className="btn btn-warning">Zurücksetzen</button>;
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
    return (
        <div className="row table-search-bar">
          <div className="col-sm-6">
            <form className="form-inline">
              <div className="form-group">
                <div className="input-group">
                  <input style={{width: "auto"}} defaultValue={this.props.searchQuery} onChange={this.handleSearchQuery.bind(this)} type="text" className="form-control shadow" placeholder={this.props.placeholderText} />
                  <span className="input-group-btn">
                    <button onClick={this.handleSearchClick.bind(this)} className="btn btn-info" type="button">Suchen</button>
                  </span>
                </div>
              </div>
              {this.renderSearchResetButton()}
            </form>
          </div>
        </div>
    );
  }
}

SearchBar.propTypes = {
  searchQuery: React.PropTypes.string.isRequired,
  changeSearchQuery: React.PropTypes.func.isRequired,
  searchClickHandler: React.PropTypes.func.isRequired,
  resetSearchHandler: React.PropTypes.func.isRequired,
  placeholderText: React.PropTypes.string
};

SearchBar.defaultProps = {
  placeholderText: 'Suchbegriff...'
};