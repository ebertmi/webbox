// Library Imports
import React from 'react';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

import { MessageListModel, MessageWithAction } from '../../models/messages';
import { MessageList } from '../messagelist/messageList';

// Spectacle Presentation Framework Imports
import {
  Appear,
  Deck,
  Slide,
  Text
} from 'spectacle';

// Custom Modules
import Highlight from './Highlight';
import CodeCellView from '../notebook/CodeCellView';
import CodeEmbedCell from '../notebook/CodeEmbedCell';
import { toMarkdownComponent } from './markdownRenderer';
import createTheme from "./theme";
import { sourceFromCell, replaceIdWithSlug, notebookMetadataToSourceboxLanguage } from '../../util/nbUtil';
import RawCell from '../notebook/RawCell';
import { RemoteDispatcher, getConnectionConfiguration } from '../../models/insights/remoteDispatcher';

// Create the Theme from our custom theme
const theme = createTheme();

// ToDo: Maybe allow to override in document
const maxHeight = 800;
const maxWidth = 1200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Presentation extends React.Component {
  constructor(props) {
    super(props);

    // Create global message list
    this.messageList = new MessageListModel();

    // Create global websocket connection
    this.remoteDispatcher = new RemoteDispatcher((getConnectionConfiguration()));
  }

  // Make messageList available in the tree
  getChildContext() {
    return {
      remoteDispatcher: this.remoteDispatcher,
      messageList: this.messageList,
    };
  }


  componentWillMount() {
    // Try to update the title
    if (this.props.notebook) {
      replaceIdWithSlug(this.props.notebook.get('id'), this.props.notebook.get('slug'));

      const title = this.props.notebook.getIn(['metadata', 'title'], 'Ohne Titel');

      document.title = `${title} - trycoding.io`;
    }
  }

  /**
   * Renders a cell depending on its "cell_type". Any unknown types will be rendered as empty text (no content!).
   */
  renderCell(cell, index, notebook) {
    const id = cell.get('id');
    const activeBlock = -1;
    const isEditModeActive = false;
    const dispatch = this.props.dispatch;
    const isVisible = cell.getIn(['metadata', 'isVisible'], true);

    let height;
    let lang;
    let executionLanguage;
    let notebookLanguageInformation;
    let embedType;
    let source = sourceFromCell(cell);

    // Do not render the cell, if it is hidden!
    if (isVisible === false) {
      return null;
    }

    // Push cell
    switch (cell.get('cell_type')) {
      case 'markdown':
        return toMarkdownComponent({source: source});
      case 'code':
        notebookLanguageInformation = notebookMetadataToSourceboxLanguage(notebook.get('metadata'));
        lang = cell.getIn(['metadata', 'mode'], notebookLanguageInformation.languageName);

        executionLanguage = cell.getIn(['metadata', 'executionLanguage'], notebookLanguageInformation.executionLanguage);

        embedType = cell.getIn(['metadata', 'embedType'], notebook.get('embedType'));
        //runId = cell.getIn(['metadata', 'runid']);
        //return <Highlight showRunButton={true} embedType={embedType} runId={runId} code={source} executionLanguage={executionLanguage} notebookLanguage={lang}></Highlight>;
        return <CodeCellView className='present-mode' viewComponent={Highlight} code={source} cell={cell} executionLanguage={{executionLanguage: executionLanguage}} notebookLanguage={lang} embedType={embedType}/>;
      case 'codeembed':
        //return <Text>{source}</Text>;
        height = parseInt(cell.getIn(['metadata', 'height'], 350));
        height = isNaN(height) ? 350 : height;
        return <CodeEmbedCell /*course={course}*/ className='present-mode' dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isEditModeActive={isEditModeActive} editing={index === activeBlock}/>;
      case 'raw':
        return <RawCell dispatch={dispatch} cellIndex={index} key={id} id={id} cell={cell} isEditModeActive={isEditModeActive} editing={id === activeBlock}/>;
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
    let isVisible;

    // Dynamically create slides, depending on the slide_type in the metadata
    for (i = 0; i < cellOrder.size; i++) {
      cell = cells.get(cellOrder.get(i)); // Get current cell
      isVisible = cell.getIn(['metadata', 'isVisible'], true);

      // Skip invisible cells from rendering an empty slide
      if (isVisible === false) {
        continue;
      }

      slideType = cell.getIn(['metadata', 'slideshow', 'slide_type'], 'slide');
      // start new slide
      if (isInSlide === false && slideType === 'slide') {
        children.push(this.renderCell(cell, i, this.props.notebook)); //Render current cell and add to children
        isInSlide = true;
      } else if (isInSlide === true && slideType === 'slide') {
        // End current slide and start new one
        slideCounter += 1;
        slides.push(<Slide transition={[]} maxHeight={maxHeight} maxWidth={maxWidth} key={`slide-${slideCounter}`} children={children}></Slide>);
        children = []; // reset children
        children.push(this.renderCell(cell, i, this.props.notebook)); // add first new child
      } else {
        // Add all cells execept skip (and slide, which is handled above)
        if (slideType !== 'skip') {
          renderResult = this.renderCell(cell, i, this.props.notebook);

          // Fragments are wrapped with the Appear Tag
          if (slideType === 'fragment') {
            children.push(<Appear><div>{renderResult}</div></Appear>);
          } else {
            children.push(renderResult);
          }
        }
      }
    }

    // Final Slide
    if (isInSlide === true) {
      slideCounter += 1;
      slides.push(<Slide transition={[]} maxHeight={maxHeight} maxWidth={maxWidth} key={`slide-${slideCounter}`} children={children}></Slide>);
    }

    return slides;
  }

  render() {
    const slides = this.renderSlides();

    if (slides.length > 0) {

      return (
        <div>
          <div className="global-message-list">
            <MessageList messageList={this.messageList} />
          </div>
          <Deck theme={theme} progress="number" transition={[]} transitionDuration={200}>
            { slides }
          </Deck>
        </div>
      );
    } else {
      return <p>Keine Folien vorhanden. Sie müssen ggf. die Metadaten der ersten Zelle bearbeiten.</p>;
    }
  }
}

Presentation.childContextTypes = {
  messageList: PropTypes.object,
  remoteDispatcher: PropTypes.object
};
