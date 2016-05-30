import React from 'react';

import {
  Appear,
  BlockQuote,
  Cite,
  CodePane,
  Deck,
  Fill,
  Heading,
  Image,
  Layout,
  Link,
  ListItem,
  List,
  Markdown,
  Quote,
  Slide,
  Spectacle,
  Text
} from "spectacle";

import createTheme from "spectacle/lib/themes/default";

const theme = createTheme({
  primary: "#ffffff",
  secondary: '#000000',
  tertiary: "#eeeeee",
  quartenary: "#6f6b6b"
});

require("spectacle/lib/themes/default/index");

import { sourceFromCell } from '../../util/nbUtil';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';


/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Presentation extends React.Component {
  constructor(props) {
    super(props);
  }

  renderCell(cell) {
    const id = cell.get('id');
    const activeBlock = -1;
    const isAuthor = false;
    const isFirst = false;
    const isLast = false;
    const dispatch = this.props.dispatch;

    let lang;
    let source = sourceFromCell(cell);

    // push actual cell
    switch (cell.get('cell_type')) {
      case 'markdown':
        return <Markdown>{ source }</Markdown>;
      case 'code':
        lang = cell.getIn(['metadata', 'mode'], '');
        return <CodePane source={source} lang={lang}></CodePane>;
      case 'codeembed':
        return <CodeEmbedCell dispatch={dispatch} key={id} id={id} cell={cell} isAuthor={isAuthor} isFirst={isFirst} isLast={isLast} editing={id === activeBlock}/>;
      case 'raw':
        return <RawCell dispatch={dispatch} key={id} id={id} cell={cell} isAuthor={isAuthor} isFirst={isFirst} isLast={isLast} editing={id === activeBlock}/>;
      default:
        return <Text>Empty</Text>;
    }
  }

  renderSlides() {
    let i;
    let cell;
    let children = [];
    let slides = [];
    const cells = this.props.notebook.get('cells');
    let slideType;
    let isInSlide = false;
    let slideCounter = 0;
    for (i = 0; i < cells.size; i++) {
      cell = cells.get(i); // get current cell
      slideType = cell.getIn(['metadata', 'slideshow', 'slide_type'], 'slide');
      // start new slide
      if (isInSlide === false && slideType === 'slide') {
        children.push(this.renderCell(cell)); // render current cell and add to children
        isInSlide = true;
      } else if (isInSlide === true && slideType === 'slide') {
        // end current slide and start new one
        console.log("push slide children:", children);
        slideCounter += 1;
        slides.push(<Slide key={`slide-${slideCounter}`} children={children}></Slide>);
        children = []; // reset children
        children.push(this.renderCell(cell)); // add first new child
      } else {
        // add to current slide
        if (slideType !== 'skip') {
          children.push(this.renderCell(cell));
        }
      }
    }

    return slides;
  }

  render() {

    const slides = this.renderSlides();
    console.log(slides);
    return (
      <Spectacle theme={theme}>
        <Deck progress="bar" transition={["slide"]} transitionDuration={200}>
          { slides }

        </Deck>
      </Spectacle>
    );
  }
}
