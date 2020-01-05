import React, { Component } from 'react';
import './App.css';
import ColoredMessage from './models/ColoredMessage';

import SplitPane from './splitpane/SplitPane';

import { IpcRenderer, Remote, Dialog } from 'electron';
import { SHELL_CHANNEL_CODE, KERNEL_INTERUPT_REQUEST, OPEN_PROJECT } from './constants/Channels';
import { KernelState } from './constants/KernelState';

declare global {
  interface Window {
    require: (module: 'electron') => {
      ipcRenderer: IpcRenderer,
      remote: Remote,
    };
  }
}

const fs = window.require('fs');
const path = window.require('path');

const { ipcRenderer, remote } = window.require('electron');
const dialog: Dialog = remote.dialog;


class App extends Component {
  state: {
    data: ColoredMessage[][],
    executionState: KernelState;
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
    this.Input = this.Input.bind(this);

    this.endofInput = React.createRef();

    this.state = {
      data: [],
      executionState: KernelState.IDLE
    };

    ipcRenderer.on("kernel_info", (event, args) => {
      this.setState({
        executionState: KernelState.IDLE
      })
    });

    ipcRenderer.on(OPEN_PROJECT, (event) => {
      const data = dialog.showOpenDialogSync({properties: ['openDirectory']});
      console.log(data);
      if (!data) return;
      fs.readdir(data[0], 'utf8', (error: any, items: any) => {
        console.log(items);
 
        for (var i=0; i<items.length; i++) {
            console.log(items[i]);
        }
      })
    })

    ipcRenderer.on("io_pub_channel", (event, args) => {
      if ('execution_count' in args) {
        this.execution_count = args['execution_count']
      }

      if ('execution_state' in args) {
        this.setState({
          executionState: args['execution_state'].toUpperCase()
        })
      } else if ('data' in args) {
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
        const messages = [];
        for (const text of args['text'].split("\n")) {
          messages.push([new ColoredMessage(text, 'black')])
        }
        this.setState({
          data: this.state.data.concat(messages)
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
      const code = e.target.value;
      ipcRenderer.send(SHELL_CHANNEL_CODE, code);
      e.target.value = "";
    }
    let charCode = String.fromCharCode(e.which).toLowerCase();
    if(e.ctrlKey && charCode === 'c') {
      console.log("Ctrl + C pressed");
      ipcRenderer.send(KERNEL_INTERUPT_REQUEST);
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
        <div className='console-content' style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="output" onKeyPress={this._handleKeyDown}>
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
          <this.Input></this.Input>
        </div>
      </div>
    )
  }

  private Input() {
    const executionState = this.state.executionState;
    // if (executionState === KernelState.BUSY || executionState === KernelState.STARTING) {
    //   return null;
    // }
    
    return (
      <div className='cursor'>
        <span style={{ display: 'table-cell', color: "blue" }}>
          IN[{this.execution_count}]:{'\t'}
        </span>
        <span style={{ display: 'table-cell', width: '100%' }}>
          <input onKeyDown={this._handleKeyDown} style={{ background: "transparent", border: "none", color: "black", outline: 'none', fontFamily: 'inherit', font: 'inherit', width: '100%' }}></input>
        </span>
      </div>
    )

  }
}

export default App;
