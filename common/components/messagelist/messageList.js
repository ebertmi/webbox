/**
 * https://github.com/Microsoft/vscode/tree/master/src/vs/base/browser/ui/messagelist
 */
import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { Message } from './message';

export class MessageList extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  componentWillMount() {
    this.props.messageList.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    this.props.messageList.removeListener('change', this.onChange);
  }

  onChange() {
    this.setState({
      messages: this.props.messageList.getMessages()
    });
  }

  render() {
    return (
      <ul className="message-list">
        {this.state.messages.map(msg => {
          return <Message key={msg.key} message={msg} />;
        })}
      </ul>
    );
  }
}

