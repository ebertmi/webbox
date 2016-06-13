import React from 'react';
import LazyLoad from 'react-lazyload';
import assign from 'lodash/assign';

import CustomMarkdown from './CustomMarkdown';

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
} from "spectacle/lib/index";

import createTheme from "spectacle/lib/themes/default";

const theme = createTheme({
  primary: "#ffffff",
  secondary: '#000000',
  tertiary: "#eeeeee",
  quartenary: "#6f6b6b"
});

require("spectacle/lib/themes/default/index");

import { sourceFromCell } from '../../util/nbUtil';
import RawCell from '../notebook/RawCell';

import { mdastConfigDefault } from 'spectacle/lib/components/markdown';

class HTMLWrapper extends React.Component {
  constructor(props) {
    super(props);

    console.log('created HTMLWrapper', props);
  }
  render() {
    console.log('HTMLWrapper', this.props);
    let innerHTML = Array.isArray(this.props.children) ? this.props.children.join("") : this.props.children;
    return (
      <div className="htmlwrapper" dangerouslySetInnerHTML={{__html: innerHTML}} />
    );
  }
}

const customMdast = assign({}, mdastConfigDefault); // make copy
//customMdast.mdastReactComponents["p"] = (s, s2, s3) => { console.log(s, arguments); return new Text(s, s2, s3);};
customMdast.mdastReactComponents["html"] = HTMLWrapper;//= (s) => { console.log(s); }; // add html wrapper
customMdast.sanitize = false;
customMdast.entities = false;
//customMdast.commonmark = true;
//customMdast.xhtml = false;
console.log(customMdast);

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Presentation extends React.Component {
  constructor(props) {
    super(props);
  }

  renderCell(cell, index) {
    const id = cell.get('id');
    const activeBlock = -1;
    const isAuthor = false;
    const dispatch = this.props.dispatch;

    let lang;
    let source = sourceFromCell(cell);

    // push actual cell
    switch (cell.get('cell_type')) {
      case 'markdown':
        return <CustomMarkdown source={source} />;
        //return <Markdown mdastConfig={customMdast} >{ source }</Markdown>;
      case 'code':
        lang = cell.getIn(['metadata', 'mode'], '');
        return <CodePane source={source} lang={lang}></CodePane>;
      case 'codeembed':
        return (
          <LazyLoad height={cell.getIn(['metadata', 'height'], 400)} once>
            <iframe className={this.props.className} width={cell.getIn(['metadata', 'width'], 800)} height={cell.getIn(['metadata', 'height'], 400)} src={`/embed/${source}`} seamless={true} allowFullScreen={true} frameBorder="0" />
          </LazyLoad>
        );
      case 'raw':
        return <RawCell dispatch={dispatch} cellIndex={index} key={id} id={id} cell={cell} isAuthor={isAuthor} editing={id === activeBlock}/>;
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
    const cellOrder = this.props.notebook.get('cellOrder');
    let slideType;
    let isInSlide = false;
    let slideCounter = 0;

    // dynamically create slides
    for (i = 0; i < cellOrder.size; i++) {
      cell = cells.get(cellOrder.get(i)); // get current cell
      slideType = cell.getIn(['metadata', 'slideshow', 'slide_type'], 'slide');
      // start new slide
      if (isInSlide === false && slideType === 'slide') {
        children.push(this.renderCell(cell, i)); // render current cell and add to children
        isInSlide = true;
      } else if (isInSlide === true && slideType === 'slide') {
        // end current slide and start new one
        slideCounter += 1;
        slides.push(<Slide key={`slide-${slideCounter}`} children={children}></Slide>);
        children = []; // reset children
        children.push(this.renderCell(cell, i)); // add first new child
      } else {
        // add to current slide
        if (slideType !== 'skip') {
          children.push(this.renderCell(cell, i));
        }
        // ToDo: none!
      }
    }

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
          <Deck progress="bar" transition={["slide"]} transitionDuration={200}>
            { slides }

          </Deck>
        </Spectacle>
      );
    } else {
      return <p>Loading...</p>;
    }
  }
}
