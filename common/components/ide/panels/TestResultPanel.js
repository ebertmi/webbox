import React from 'react';

import { Button } from '../../bootstrap';
import Icon from '../../Icon';

function percentageToBootstrapClass(percentage) {
  if (percentage < 25) {
    return "danger";
  } else if (percentage >= 25 && percentage < 50) {
    return "warning";
  } else if (percentage >= 50 && percentage < 75) {
    return "info";
  } else {
    return "success";
  }
}

export default class TestsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);

    // Initial state
    this.state = {
    };
  }

  onChange() {
    this.setState({
    });
  }

  componentDidMount() {
  }

  componentWillMount() {
    this.props.item.on('change', this.onChange);
  }

  componentWillUnmount() {
    this.props.item.removeListener('change', this.onChange);
  }

  render() {
    const progress = this.props.item.getScorePercentage();
    const progressClass = `progress progress-${percentageToBootstrapClass(progress)}`;

    return (
      <div className="tests-panel" onSubmit={e => e.preventDefault()}>
        <h3>Dein Ergebnis</h3>
        <div>
          <p>Sie haben <strong className="total-score">{this.props.item.getScore()} / {this.props.item.getMaximumScore()}</strong> Punkten erreicht.</p>
          <progress className={progressClass} value={progress} max="100"></progress>
        </div>
        <hr />
        <ul className="list-group list-group-flush">
          {this.props.item.getTests().map((test, index) => {
            let checkIcon = test.success === true ? <Icon className="text-success" name="check" title="Erfolgreich" /> : <Icon className="text-danger" name="times" title="Fehlgeschlagen" />;
            let hint = test.hint != null ? <p><small>{test.hint}</small></p> : null;
            let output = test.output != null ? <p>Ausgabe: <code>{ test.output }</code></p> : null;
            return (
              <li className="list-group-item" key={index}>
                <p>
                  <span>{ checkIcon } </span>
                  {test.name}
                  <span className="pull-xs-right">
                    <strong>{test.score} / {test.max_score}</strong>
                  </span>
                </p>
                { output }
                { hint }
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
