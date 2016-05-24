import google from 'googleapis'
import {authGmail} from './googleapis'
import React from 'react'

export default class StressTestSection extends React.Component {
  static displayName = "StressTestSection";

  static containerRequired = false;

  constructor(props) {
    super(props);
    this.state = {
      gmail: null,
      gmailAuth: null,
      logs: [],
    }
  }

  componentWillMount() {
    authGmail((auth) => {
      const gmail = google.gmail('v1');
      window.gmail = gmail;
      window.gmailAuth = auth;
      this.setState({
        gmail: gmail,
        gmailAuth: auth,
        auth: {
          auth: auth,
          userId: "me",
        },
      })
    })
  }

  _getLabels = () => {
    this.state.gmail.users.labels.list(this.state.auth, (err, resp) => {
      if (err) { return console.error(err) }
      const names = resp.labels.map(l => l.name);
      this.setState({logs: names})
    })
  }

  render() {
    const logs = this.state.logs.map(l => <div>{l}</div>)
    return (
      <div className="stress-test-section">
        <button className="btn" onClick={this._getLabels}>Get Labels</button>
        <div className="stress-test-logs expanded-section">
          {logs}
        </div>
      </div>
    )
  }
}
