// Library Imports
import React from 'react';
import LazyLoad from 'react-lazyload';

// Spectacle Presentation Framework Imports
import {
  Appear,
  Deck,
  Slide,
  Spectacle,
  Text
} from 'spectacle/lib/index';
import 'spectacle/lib/themes/default/index';

// Custom Modules
import Highlight from './Highlight';
import { toMarkdownComponent } from './markdownRenderer';
import createTheme from "./theme";
import { sourceFromCell } from '../../util/nbUtil';
import RawCell from '../notebook/RawCell';

// Create the Theme from our custom theme
const theme = createTheme();

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Presentation extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * Renders a cell depending on its "cell_type". Any unknown types will be rendered as empty text (no content!).
   */
  renderCell(cell, index, notebook) {
    const id = cell.get('id');
    const activeBlock = -1;
    const isAuthor = false;
    const dispatch = this.props.dispatch;

    let lang;
    let embedType;
    let runId;
    let source = sourceFromCell(cell);

    // Push cell
    switch (cell.get('cell_type')) {
      case 'markdown':
        return toMarkdownComponent({source: source});
      case 'code':
        lang = cell.getIn(['metadata', 'mode'], '');
        embedType = cell.getIn(['metadata', 'embedType'], notebook.getIn(['metadata', 'embedType']));
        runId = cell.getIn(['metadata', 'runid']);
        return <Highlight showRunButton={true} embedType={embedType} runId={runId} source={source} lang={lang}></Highlight>;
      case 'codeembed':
        return (
          <LazyLoad height={cell.getIn(['metadata', 'height'], 350)} once>
            <iframe className={this.props.className} width={cell.getIn(['metadata', 'width'], 800)} height={cell.getIn(['metadata', 'height'], 400)} src={`/embed/${source}`} seamless={true} allowFullScreen={true} frameBorder="0" />
          </LazyLoad>
        );
      case 'raw':
        return <RawCell dispatch={dispatch} cellIndex={index} key={id} id={id} cell={cell} isAuthor={isAuthor} editing={id === activeBlock}/>;
      default:
        // Should only occur for some flawed notebook files
        return <Text></Text>;
    }
  }

  /**
   * Renders the cells to slides depending on the given "slide_type" in the metadata.
   */
  renderSlides() {
    let i;
    let cell;
    let children = [];
    let slides = [];
    let renderResult;
    const cells = this.props.notebook.get('cells');
    const cellOrder = this.props.notebook.get('cellOrder');
    let slideType;
    let isInSlide = false;
    let slideCounter = 0;

    // Dynamically create slides, depending on the slide_type in the metadata
    for (i = 0; i < cellOrder.size; i++) {
      cell = cells.get(cellOrder.get(i)); // Get current cell
      slideType = cell.getIn(['metadata', 'slideshow', 'slide_type'], 'slide');
      // start new slide
      if (isInSlide === false && slideType === 'slide') {
        children.push(this.renderCell(cell, i, this.props.notebook)); //Render current cell and add to children
        isInSlide = true;
      } else if (isInSlide === true && slideType === 'slide') {
        // End current slide and start new one
        slideCounter += 1;
        slides.push(<Slide key={`slide-${slideCounter}`} children={children}></Slide>);
        children = []; // reset children
        children.push(this.renderCell(cell, i, this.props.notebook)); // add first new child
      } else {
        // Add all cells execept skip (and slide, which is handled above)
        if (slideType !== 'skip') {
          renderResult = this.renderCell(cell, i, this.props.notebook);

          // Fragments are wrapped with the Appear Tag
          if (slideType === 'fragment') {
            children.push(<Appear>{renderResult}</Appear>);
          } else {
            children.push(renderResult);
          }
        }
      }
    }

    // Final Slide
    if (isInSlide === true) {
      slideCounter += 1;
      slides.push(<Slide key={`slide-${slideCounter}`} children={children}></Slide>);
    }

    return slides;
  }

  render() {
    const slides = this.renderSlides();

    if (slides.length > 0) {
      return (
        <Spectacle theme={theme} onRef={s => this.spectacle = s}>
          <Deck progress="bar" transition={[]} transitionDuration={200}>
            { slides }
          </Deck>
        </Spectacle>
      );
    } else {
      return <p>Loading...</p>;
    }
  }
}
