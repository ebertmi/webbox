import React from 'react';

import Icon from '../../Icon';

/**
 * Simple helper function that maps the ranges 0-25, 25-50, 50-75 and 75-100
 * to bootstrap classes.
 *
 * @param {any} percentage
 * @returns
 */
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

/**
 * Display the test results for a user. This is the user facing panel.
 *
 * @export
 * @class TestsPanel
 * @extends {React.Component}
 */
export default class TestsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange() {
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
          <progress className={progressClass} max="100" value={progress} >
            <div className="progress">
              <span className="progress-bar" style={{width: progress+"%"}}></span>
            </div>
          </progress>
        </div>
        <hr />
        <ul className="list-group list-group-flush">
          {this.props.item.getTests().map((test, index) => {
            let checkIcon = test.success === true ? <Icon className="text-success" name="check" title="Erfolgreich" /> : <Icon className="text-danger" name="times" title="Fehlgeschlagen" />;

            // Render hint only, when the test failed
            let hint = test.success === false && test.hint != null ? <p><small><strong>Hinweis: </strong>{test.hint}</small></p> : null;
            let output = test.success === false && test.output != null ? <div><p className="text-danger test-result-output-label">Ausgabe:</p><pre className="test-result-output"><code>{ test.output }</code></pre></div> : null;
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
