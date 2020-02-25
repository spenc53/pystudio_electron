import React from 'react';
import ColoredMessage from '../../models/ColoredMessage';
import { KernelState } from '../../constants/KernelState';
import JupyterMessagingService from '../../services/JupyterMessagingService';
import { KernelStatus } from '../../constants/KernelStatus';

export type TerminalProps = {
  messagingService: JupyterMessagingService;
}

class Terminal extends React.Component<TerminalProps> {
  state: {
    data: ColoredMessage[][],
    executionState: KernelState;
    kernelStatus: KernelStatus;
    input: string[];
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
      executionState: KernelState.IDLE,
      kernelStatus: KernelStatus.STOPPED,
      input: []
    };

    this.endofInput = React.createRef();

    // set up
    this.terminal = this.terminal.bind(this);
    this.Input = this.Input.bind(this);
    this._handlePaste = this._handlePaste.bind(this);

    // setup subscribers
    this.parsePubChannel = this.parsePubChannel.bind(this);
    this.parseInputRequest = this.parseInputRequest.bind(this);

    this.jupyterMessagingService.subscribeToPubIoChannel(this.parsePubChannel);
    this.jupyterMessagingService.subscribeToInputChannel(this.parseInputRequest);

    this.jupyterMessagingService.getStatus().subscribe((kernelStatus: KernelStatus) => {
      console.log(kernelStatus)
      this.setState({
        kernelStatus: kernelStatus
      });
    });
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
      });
    } else if ('data' in args) {
      // parse the data
      this.parseData(args['data'])
    } else if ('code' in args && args['code']) {
      const codeLines = args['code'].split("\n");
      const response = [];
      for (let i = 0; i < codeLines.length; i++) {
        if (i === 0) {
          let output = 'IN[' + this.execution_count + ']:\t' + codeLines[i];
          response.push([new ColoredMessage(output, 'black')])
          continue;
        }

        let output = '...:\t' + codeLines[i];
        response.push([new ColoredMessage(output, 'black')])
      }
      // const output = 'IN[' + this.execution_count + ']: ' + args['code'];
      this.setState({
        data: this.state.data.concat(response)
      })
      if (args['code'] === '') {
        this.execution_count -= 1;
      }

      this.jupyterMessagingService.sendPublishLocalVarsCommand();
      // after code, we should send a request for variables?
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
    } else if ('name' in args && args['name'] === 'stderr') {
      const messages = [];
      for (const text of args['text'].split("\n")) {
        messages.push([new ColoredMessage(text, 'red')])
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

    if (e.ctrlKey && e.key === 'Enter') {
      if (!code.trim()) {
        return;
      }
      this.setState({
        input: this.state.input.concat(code)
      });
      e.target.value = "";
      return;
    } else if (e.key === 'Enter' && this.state.executionState === KernelState.INPUT) {
      const allCode = this.state.input.join('\n') + '\n' + code;
      this.jupyterMessagingService.sendInputReply(allCode);
      e.target.value = "";
      this.setState({
        input: []
      });
    } else if (e.key === 'Enter' && this.state.executionState === KernelState.IDLE) {
      let allCode = this.state.input.join("\n");
      if (!allCode.trim()) {
        allCode = code;
      } else {
        allCode = allCode + "\n" + code;
      }

      if (!allCode.trim()) {
        return;
      }

      this.jupyterMessagingService.sendShellChannelCode(allCode);
      e.target.value = "";
      this.setState({
        input: []
      });
    } else if (e.ctrlKey && charCode === 'c' && this.state.executionState === KernelState.BUSY) {
      console.log("Ctrl + C pressed");
      this.jupyterMessagingService.sendKernelInterrupt();
      e.target.value = "";
      this.setState({
        input: []
      });
    }

  }

  _handlePaste(e: any) {
    e.preventDefault()
    const text = e.clipboardData.getData('Text');
    console.log(text);
    const data = text.split("\n");
    if (data.length === 1 && !data[0].trim()) {
      return;
    }
    const lastInput = data[data.length - 1];
    const pastedData = data.slice(0, -1);
    this.setState({
      input: this.state.input.concat(pastedData)
    })
    e.target.value += lastInput;
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
            {data.map((coloredMessages, index) => {
              return (<div key={index}>
                {coloredMessages.map((coloredMessage, index1) => {
                  if (!coloredMessage.getText()) {
                    return <br key={index1}></br>
                  }
                  return <span key={index1} style={{ color: coloredMessage.getColor() }}>{coloredMessage.getText()}</span>
                }
                )}
              </div>
              );
            })}
            <div ref={this.endofInput}></div>
            <this.Input></this.Input>
          </div>
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

    let input = this.state.input;
    return (
      <div>
        { input.length === 0 ?
        ( null

        ) :
        (
          <div>
            {
              input.map((code: string, index: number) => {
                return (
                  <div>
                    {
                      index === 0 ? 
                      (
                        <span style={{ display: 'table-cell', color: "blue" }}>
                          IN[{this.execution_count}]:{'\t'}
                        </span>
                      ):
                      (
                        <span style={{ display: 'table-cell', color: "blue" }}>
                          ...:{'\t'}
                        </span>
                      )
                    }
                    <span style={{ display: 'table-cell', width: '100%', overflow: 'hidden' }}>
                      {code}
                    </span>
                  </div>
                )
              })
            }
            {/* <span style={{ display: 'table-cell', color: "blue" }}>
              IN[{this.execution_count}]:{'\t'}
            </span>
            <span style={{ display: 'table-cell', width: '100%', overflow: 'hidden' }}>
              temp
            </span> */}
          </div>
        )}
        <div className='cursor'>
          {
            input.length === 0 ? 
            (
              <span style={{ display: 'table-cell', color: "blue" }}>
                IN[{this.execution_count}]:{'\t'}
              </span>
            ):
            (
              <span style={{ display: 'table-cell', color: "blue" }}>
                ...:{'\t'}
              </span>
            )
          }
          <span style={{ display: 'table-cell', width: '100%', overflow: 'hidden' }}>
            <input disabled={this.state.kernelStatus===KernelStatus.STOPPED} onKeyDown={this._handleKeyDown} onPasteCapture={this._handlePaste} style={{ background: "transparent", border: "none", color: "black", outline: 'none', fontFamily: 'inherit', font: 'inherit', width: '100%' }}></input>
          </span>
        </div>
      </div>
    )

  }
}

export default Terminal