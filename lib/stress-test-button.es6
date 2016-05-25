import React from 'react'

export default class StressTestButton extends React.Component {
  static displayName = "StressTestButton"

  static containerRequired = false;

  // static propTypes = {
  //   activateSection: React.propTypes.func,
  // }

  _activateSection = () => {
    this.props.activateSection("StressTest")
  }

  render() {
    return (
      <div className="btn-container pull-left">
        <div className="btn" onClick={this._activateSection}>
          <span>Stress Tester</span>
        </div>
      </div>
    )
  }
}
