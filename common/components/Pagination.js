import React from 'react';
import ReactPaginate from 'react-paginate';

/**
 * Pagination component that uses react-paginate but provides
 * bootstrap like styles and rendering.
 */
export function Pagination (props) {
  return (
      <ReactPaginate
        subContainerClassName="pagination pagination-sub"
        disabledClassName="disabled"
        nextLinkClassName="page-link"
        previousLinkClassName="page-link"
        previousClassName="page-item"
        nextClassName="page-item"
        pageClassName="page-item"
        activeClassName="active"
        pageLinkClassName="page-link"
        containerClassName="pagination"
        previousLabel="Zurück"
        nextLabel="Weiter"
        pageRangeDisplayed={5}
        marginPagesDisplayed={2}
        {...props}/>
  );
}