import React from 'react';
import ColoredMessage from '../models/ColoredMessage';
import { KernelState } from '../constants/KernelState';
import JupyterMessagingService from '../services/JupyterMessagingService';

export type TerminalProps = {
  messagingService: JupyterMessagingService;
}

class Terminal extends React.Component<TerminalProps> {
  state: {
    data: ColoredMessage[][],
    executionState: KernelState;
  };

  execution_count = 0;

  jupyterMessagingService: JupyterMessagingService;

  private endofInput: React.RefObject<HTMLInputElement>;

  componentDidUpdate() {
    if (!this.endofInput.current) return;
    this.endofInput.current.scrollIntoView()
  }

  constructor(props: TerminalProps) {
    super(props);

    this.jupyterMessagingService = props.messagingService;

    this.state = {
      data: [],
      executionState: KernelState.IDLE
    };

    this.endofInput = React.createRef();

    // set up
    this.terminal = this.terminal.bind(this);
    this.Input = this.Input.bind(this);

    // setup subscribers
    this.parsePubChannel = this.parsePubChannel.bind(this);
    this.parseInputRequest = this.parseInputRequest.bind(this);

    this.jupyterMessagingService.subscribeToPubIoChannel(this.parsePubChannel);
    this.jupyterMessagingService.subscribeToInputChannel(this.parseInputRequest);
  }

  parsePubChannel(args: any) {
    if ('execution_count' in args) {
      this.execution_count = args['execution_count']
    }

    console.log(args);

    if ('execution_state' in args) {
      if (args['execution_state'].toUpperCase() === 'IDLE') {
        this.setState({
          data: this.state.data.concat([[new ColoredMessage('', "white")]])
        })
      }
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
  }

  parseInputRequest(data: any) {
    // TODO: check to see if there is a prompt
    // TODO: check to see if prompting for password
    this.setState({
      executionState: KernelState.INPUT
    });
  }

  parseData(data: any) {
    //gonna have to figure out all the types
    if ('text/plain' in data) {
      const output = 'OUT[' + this.execution_count + ']: ' + data['text/plain'];
      this.setState({
        data: this.state.data.concat([[new ColoredMessage(output, 'black')]])
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
      data: dat
    })
  }

  parseColor(text: String) {
    let messages = [];
    for (const t of text.split('\n')) {
      const splitTexts = t.split("\u001b").filter((s) => s !== '')
      const message = [];
      for (const splitText of splitTexts) {

        const coloredMessage = new ColoredMessage(splitText);
        if (!coloredMessage.getText()) {
          continue;
        }
        message.push(coloredMessage);
      }
      messages.push(message)
    }
    return messages;
  }

  _handleKeyDown = (e: any) => {
    const charCode = String.fromCharCode(e.which).toLowerCase();
    const code = e.target.value;

    if (e.key === 'Enter' && this.state.executionState === KernelState.INPUT) {
      this.jupyterMessagingService.sendInputReply(code);
      e.target.value = "";
    } else if (e.key === 'Enter' && this.state.executionState === KernelState.IDLE) {
      this.jupyterMessagingService.sendShellChannelCode(code);
      e.target.value = "";
    } else if (e.ctrlKey && charCode === 'c' && this.state.executionState === KernelState.BUSY) {
      console.log("Ctrl + C pressed");
      this.jupyterMessagingService.sendKernelInterrupt();
      e.target.value = "";
    }

  }

  render() {
    return this.terminal();
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
    // if (executionState === KernelState.BUSY || executionState === KernelState.STARTING) {
    //   return null;
    // }

    if (this.state.executionState === KernelState.BUSY) {
      // need input but has to listen for the ctrl + c
    }

    if (this.state.executionState === KernelState.INPUT) {
      return (
        <div className='cursor'>
          {/* display input request details */}
          {/* <span style={{ display: 'table-cell', color: "blue" }}>
            IN[{this.execution_count}]:{'\t'}
          </span> */}
          <span style={{ display: 'table-cell', width: '100%' }}>
            <input onKeyDown={this._handleKeyDown} style={{ background: "transparent", border: "none", color: "black", outline: 'none', fontFamily: 'inherit', font: 'inherit', width: '100%' }}></input>
          </span>
      </div>
      )
    }

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

export default Terminal