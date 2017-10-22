import React from 'react';
import PropTypes from 'prop-types';

const KEY_CODES = {
  ENTER: 13,
  BACKSPACE: 8
};

function DefaultTagComponent(props) {
  const classesStr = props.classes ? (` ${props.classes}`) : '';
  const className = `tag${classesStr}`;

  return (
    <div className={className}>
      <div className="tag-text" onClick={props.onEdit}>{props.item}</div>
      <div className="remove" onClick={props.onRemove}>
        {props.removeTagLabel}
      </div>
    </div>
  );
}

export default class TaggedInput extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      tags: (this.props.tags || []).slice(0),
      currentInput: null
    };

    this.onInputRef = this.onInputRef.bind(this);
    this.onRemoveTag = this.onRemoveTag.bind(this);
    this.onEditTag = this.onEditTag.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClickOnWrapper = this.onClickOnWrapper.bind(this);
    this._validateAndTag = this._validateAndTag.bind(this);
  }

  componentDidMount () {
    // What should this do?
    if (this.props.autofocus && this.input != null) {
      this.input.focus();
    }
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      tags: (nextProps.tags || []).slice(0)
    });
  }

  onInputRef (ref) {
    this.input = ref;
  }

  onRemoveTag (index) {
    if (this.props.onBeforeRemoveTag(index)) {
      const removedItems = this.state.tags.splice(index, 1);

      if (this.state.duplicateIndex) {
        this.setState({duplicateIndex: null}, () => {
          this.props.onRemoveTag && this.props.onRemoveTag(removedItems[0], this.state.tags);
        });
      } else {
        this.props.onRemoveTag && this.props.onRemoveTag(removedItems[0], this.state.tags);
        this.forceUpdate();
      }
    }
  }

  onEditTag (index) {
    if (this.state.currentInput) {
      const trimmedInput = this.state.currentInput.trim();
      if (trimmedInput && (this.state.tags.indexOf(trimmedInput) < 0 || !this.props.unique)) {
        this._validateAndTag(this.state.currentInput);
      }
    }

    const removedItems = this.state.tags.splice(index, 1);
    if (this.state.duplicateIndex) {
      this.setState({duplicateIndex: null, currentInput: removedItems[0]}, () => {
        this.props.onRemoveTag && this.props.onRemoveTag(removedItems[0]);
      });
    } else {
      this.setState({currentInput: removedItems[0]}, () => {
        this.props.onRemoveTag && this.props.onRemoveTag(removedItems[0]);
      });
    }
  }

  onKeyUp (e) {
    //const enteredValue = e.target.value;

    if (e.keyCode === KEY_CODES.ENTER) {
      if (this.state.currentInput) {
        this._validateAndTag(this.state.currentInput, () => {
          if (this.props.onEnter) {
            this.props.onEnter(e, this.state.tags);
          }
        });
      }
    }
  }

  onKeyDown (e) {
    let poppedValue, newCurrentInput;

    if (e.keyCode === KEY_CODES.BACKSPACE) {
      if (!e.target.value || e.target.value.length < 0) {
        if (this.props.onBeforeRemoveTag(this.state.tags.length - 1)) {
          poppedValue = this.state.tags.pop();

          newCurrentInput = this.props.backspaceDeletesWord ? '' : poppedValue;

          this.setState({
            currentInput: newCurrentInput,
            duplicateIndex: null
          });
          if (this.props.onRemoveTag && poppedValue) {
            this.props.onRemoveTag(poppedValue);
          }
        }
      }
    }
  }

  onChange (e) {
    const value = e.target.value;
    const lastChar = value.charAt(value.length - 1);
    const tagText = value.substring(0, value.length - 1);

    if (this.props.delimiters.indexOf(lastChar) !== -1) {
      this._validateAndTag(tagText);
    } else {
      this.setState({
        currentInput: e.target.value
      });
    }
  }

  onBlur (e) {
    if (this.props.tagOnBlur) {
      const value = e.target.value;
      value && this._validateAndTag(value);
    }
  }

  onClickOnWrapper () {
    //this.refs.input;
  }

  getTags () {
    return this.state.tags;
  }

  getEnteredText () {
    return this.state.currentInput;
  }

  getAllValues () {
    if (this.state.currentInput && this.state.currentInput.length > 0) {
      return this.state.tags.concat(this.state.currentInput);
    } else {
      return this.state.tags;
    }
  }

  _validateAndTag (tagText, callback) {
    let duplicateIndex;
    let trimmedText;

    if (tagText && tagText.length > 0) {
      trimmedText = tagText.trim();
      if (this.props.unique) {

        // not a boolean, it's a function
        if (typeof this.props.unique === 'function') {
          duplicateIndex = this.props.unique(this.state.tags, trimmedText);
        } else {
          duplicateIndex = this.state.tags.indexOf(trimmedText);
        }

        if (duplicateIndex === -1) {
          if (!this.props.onBeforeAddTag(trimmedText)) {
            return;
          }

          this.state.tags.push(trimmedText);
          this.setState({
            currentInput: '',
            duplicateIndex: null
          }, () => {
            this.props.onAddTag && this.props.onAddTag(tagText, this.state.tags);
            callback && callback(true);
          });
        } else {
          this.setState({duplicateIndex: duplicateIndex}, () => {
            callback && callback(false);
          });
        }
      } else {
        if (!this.props.onBeforeAddTag(trimmedText)) {
          return;
        }

        this.state.tags.push(trimmedText);
        this.setState({currentInput: ''}, () => {
          this.props.onAddTag && this.props.onAddTag(tagText);
          callback && callback(true);
        });
      }
    }
  }

  render () {
    const tagComponents = [];
    let classes = 'tagged-input-wrapper';
    let placeholder;
    let i;

    if (this.props.classes) {
      classes += ` ${this.props.classes}`;
    }

    if (this.state.tags.length === 0) {
      placeholder = this.props.placeholder;
    }

    const TagComponent = DefaultTagComponent;

    for (i = 0; i < this.state.tags.length; i++) {
      tagComponents.push(
        <TagComponent
          key={`tag${i}`}
          item={this.state.tags[i]}
          itemIndex={i}
          onRemove={this.onRemoveTag.bind(this, i)}
          onEdit={this.props.clickTagToEdit ? this.onEditTag.bind(this, i) : null}
          classes={this.props.unique && (i === this.state.duplicateIndex) ? 'duplicate' : ''}
          removeTagLabel={this.props.removeTagLabel || '\u00D7'}
        />
      );
    }

    const input = (
      <input
        type="text"
        className={this.props.inputClassName}
        ref={this.onInputRef}
        onKeyUp={this.onKeyUp}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
        onBlur={this.onBlur}
        value={this.state.currentInput || ''}
        placeholder={placeholder}
        tabIndex={this.props.tabIndex}>
      </input>
    );

    return (
      <div className={classes} onClick={this.onClickOnWrapper}>
        {tagComponents}
        {input}
      </div>
    );
  }
}

TaggedInput.propTypes = {
  onBeforeAddTag: PropTypes.func,
  onAddTag: PropTypes.func,
  onBeforeRemoveTag: PropTypes.func,
  onRemoveTag: PropTypes.func,
  onEnter: PropTypes.func,
  unique: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  autofocus: PropTypes.bool,
  backspaceDeletesWord: PropTypes.bool,
  placeholder: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.any),
  removeTagLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  delimiters: PropTypes.arrayOf((props, propName, componentName) => {
    if (typeof props[propName] !== 'string' || props[propName].length !== 1) {
      return new Error('TaggedInput prop delimiters must be an array of 1 character strings');
    }
  }),
  tagOnBlur: PropTypes.bool,
  tabIndex: PropTypes.number,
  clickTagToEdit: PropTypes.bool,
  inputClassName: PropTypes.string
};

TaggedInput.defaultProps = {
  delimiters: [' ', ','],
  unique: true,
  autofocus: false,
  backspaceDeletesWord: true,
  tagOnBlur: false,
  tabIndex: 0,
  tags: [],
  clickTagToEdit: false,
  onBeforeAddTag: () => {
    return true;
  },
  onAddTag: () => {

  },
  onBeforeRemoveTag: () => {
    return true;
  },
  placeholder: '',
  inputClassName: 'tagged-input'
};
