import React, { Component, Children } from 'react';
import './App.css';
import ColoredMessage from './models/ColoredMessage';

import SplitPane from './splitpane/SplitPane';

import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    require: (module: 'electron') => {
      ipcRenderer: IpcRenderer
    };
  }
}

const { ipcRenderer } = window.require('electron');

class App extends Component {
  state: {
    data: ColoredMessage[][]
  };
  execution_count = 0;

  private endofInput: React.RefObject<HTMLInputElement>;

  componentDidUpdate() {
    if (!this.endofInput.current) return;
    this.endofInput.current.scrollIntoView()
  }

  constructor(props: any) {
    super(props);

    this.parseData = this.parseData.bind(this);

    this.endofInput = React.createRef();

    this.state = {
      data: []
    };

    ipcRenderer.on("kernel_info", (event, args) => {

    })

    ipcRenderer.on("io_pub_channel", (event, args) => {
      if ('execution_count' in args) {
        this.execution_count = args['execution_count']
      }

      if ('data' in args) {
        // parse the data
        this.parseData(args['data'])
      } else if ('code' in args) {
        const output = 'IN[' + this.execution_count + ']: ' + args['code'];
        this.setState({
          data: this.state.data.concat([[new ColoredMessage(output, 'black')]])
        })
        if (args['code'] === '') {
          this.execution_count -= 1;
          this.setState({
            data: this.state.data.concat([[new ColoredMessage('', 'white')]])
          })
        }
      } else if ('ename' in args) {
        this.execution_count -= 1;
        this.parseError(args)
      } else if ('name' in args && args['name'] === 'stdout') {
        // handle new lines...
        this.setState({
          data: this.state.data.concat([[new ColoredMessage(args['text'], 'black')], [new ColoredMessage('', 'white')]])
        })
      }
    });
  }

  parseData(data: any) {
    //gonna have to figure out all the types
    if ('text/plain' in data) {
      const output = 'OUT[' + this.execution_count + ']: ' + data['text/plain'];
      this.setState({
        data: this.state.data.concat([[new ColoredMessage(output, 'black')], [new ColoredMessage('', 'white')]])
      })
    }
  }

  parseError(error: any) {
    const traceback = error['traceback'];
    // const errorName = error['ename'];
    // const errorValue = error['evalue'];
    const messages = [];
    for (const trace of traceback) {
      messages.push(this.parseColor(trace))
    }
    let dat = this.state.data;
    for (const m of messages) {
      dat = dat.concat(m);
    }
    this.setState({
      data: dat.concat([[new ColoredMessage('', 'white')]])
    })
  }

  parseColor(text: String) {
    let messages = [];
    for (const t of text.split('\n')) {
      const splitTexts = t.split("\u001b").filter((s) => s !== '')
      const message = [];
      for (const splitText of splitTexts) {

        const coloredMessage = new ColoredMessage(splitText);
        if (!coloredMessage.getText().trim()) {
          continue;
        }
        message.push(coloredMessage);
      }
      messages.push(message)
    }
    return messages;
  }

  _handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      const data = e.target.value;
      console.log(data);
      e.target.value = "";
    }
  }

  render() {
    return (
      <div style={{ height: '100vh' }}>
        <SplitPane >
          <SplitPane.Top>
            {this.file()}
          </SplitPane.Top>
          <SplitPane.Bottom>
            {this.terminal()}
          </SplitPane.Bottom>
        </SplitPane>
      </div>
    );
  }

  file() {
    return (
      <div style={{backgroundColor: 'blue' }}>
        MAIN
      </div>
    );
  }

  terminal() {
    const { data } = this.state;
    return (
      <div className="console">
        {/* <div onMouseDown={(e) => console.log("mouseDown!")} onMouseUp={(e) => console.log("mouseUp!")} style={{ width: '100%', backgroundColor: 'gray', height: "5px" }} /> */}
        <div className='console-content' style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="output">
            {data.map((coloredMessages) => {
              return (<div>
                {coloredMessages.map((coloredMessage) => {
                  if (!coloredMessage.getText()) {
                    return <br></br>
                  }
                  return <span style={{ color: coloredMessage.getColor() }}>{coloredMessage.getText()}</span>
                }
                )}
              </div>
              );
            })}
            <div ref={this.endofInput}></div>
          </div>
          <div className='cursor'>
            <span style={{ display: 'table-cell', color: "blue" }}>
              IN[{this.execution_count}]:{'\t'}
            </span>
            <span style={{ display: 'table-cell', width: '100%' }}>
              <input onKeyDown={this._handleKeyDown} style={{ background: "transparent", border: "none", color: "black", outline: 'none', fontFamily: 'inherit', font: 'inherit', width: '100%' }}></input>
            </span>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
