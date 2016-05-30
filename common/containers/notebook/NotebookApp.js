import React, { Component } from 'react';
import { connect } from 'react-redux';

// own imports
import Notebook from '../../components/notebook/Notebook';
import { addCellsFromJS } from '../../actions/NotebookActions';

class NotebookApp extends Component {

  componentWillMount() {
    // ToDo: remove this at some point, when finished with testing
    const exampleData = [
      {
        cell_type: 'markdown',
        metadata: {
          slideshow: {
            slide_type: 'slide' /* slide, fragment[, subslide], skip, notes */
          }
        },
        source: "## Hello\nEtwas Text und vielleicht das ein oder andere Gedicht. Aber jetzt kommen wir zu etwas coolem: `inline-code` und\n```python\ndef fu():\n\tpass\n```",
      }, {
        cell_type: 'codeembed',
        metadata: {
          slideshow: {
            slide_type: 'fragment' /* slide, fragment[, subslide], skip, notes */
          },
          width: 900,
          height: 400
        },
        source: 'db0cadd0-fe97-415b-96f6-90ecbd2d11e0',
      }, {
        cell_type: 'markdown',
        metadata: {
          slideshow: {
            slide_type: 'slide'
          }
        },
        source: "## Hello\n\nUnd noch mehr tExt und wenn das Speichern geht, dann geht es ab!",
      }, {
        cell_type: 'code',
        metadata: {
          slideshow: {
            slide_type: 'slide'
          },
          mode: 'java'
        },
        source: "public static void main(String args[]) {\n\tSystem.out.println(\"test\");\n}",
      }
    ];

    this.props.dispatch(addCellsFromJS(exampleData, 'python'));
  }

  render() {
    return <Notebook notebook={this.props.notebook} dispatch={this.props.dispatch}></Notebook>;
  }
}

export default connect(state => {
  return { notebook: state.notebook };
})(NotebookApp);