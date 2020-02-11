import React, { Component } from 'react';
import './App.css';

import SplitPane from './splitpane/SplitPane';

import { IpcRenderer, Remote, Dialog } from 'electron';
import { OPEN_PROJECT, KERNEL_STATUS, LOADING_PROJECT_CHANNEL } from './constants/Channels';
import Plot from './plot';
import Terminal from './terminal';
import Modal from './modal';
import HorizontalSplitPane from './horizontalSplitPane';
import JupyterMessagingService from './services/JupyterMessagingService';
import { KernelStatus } from './constants/KernelStatus';

declare global {
  interface Window {
    require: (module: 'electron') => {
      ipcRenderer: IpcRenderer,
      remote: Remote,
    };
  }
}

const fs = window.require('fs');

const { ipcRenderer, remote } = window.require('electron');
const dialog: Dialog = remote.dialog;


class App extends Component {

  messagingService: JupyterMessagingService;

  state: {
    active: KernelStatus,
    showLoading: boolean
  };

  projectDir: string;

  constructor(props: any) {
    super(props);

    this.messagingService = new JupyterMessagingService(ipcRenderer);

    this.state = {
      active: KernelStatus.STOPPED,
      showLoading: false
    };
    this.projectDir = '';

    this.openPystudioProject = this.openPystudioProject.bind(this);

    ipcRenderer.on(OPEN_PROJECT, (event, args) => {
      this.setState({
        showLoading: true
      })
      this.openPystudioProject(args);
    });

    ipcRenderer.on(LOADING_PROJECT_CHANNEL, (event, args) => {
      const isDone = args.isDone;
      const isError = args.isError;
      const message = args.message;

      this.setState({
        showLoading: !isDone
      })
    })

    ipcRenderer.on(KERNEL_STATUS, (event, args) => {
      if (args === KernelStatus.RUNNING && this.state.showLoading) {
        this.setState({
          showLoading: false
        })
      }
      this.setState({
        active: args
      });
    });
  }

  render() {
    const { active } = this.state;
    return (
      <div style={{ height: '100vh' }}>
        <Modal show={this.state.showLoading} onClick={() => {console.log('background clicked')}}>
          <div style={{textAlign: 'center'}}>
            Opening Project
          </div>
        </Modal>
        <HorizontalSplitPane>
          <HorizontalSplitPane.Left>
            <SplitPane>
              <SplitPane.Top>
                {/* {this.file()} */}
              </SplitPane.Top>
              <SplitPane.Bottom>
                <Terminal messagingService={this.messagingService}></Terminal>
              </SplitPane.Bottom>
            </SplitPane>
          </HorizontalSplitPane.Left>
          <HorizontalSplitPane.Right>
            <SplitPane>
              <SplitPane.Top>
                {/* {this.file()} */}
              </SplitPane.Top>
              <SplitPane.Bottom>
                <Plot messagingService={this.messagingService}></Plot>
              </SplitPane.Bottom>
            </SplitPane>
            
          </HorizontalSplitPane.Right>
        </HorizontalSplitPane>
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

  openPystudioProject(pathToProject: string): void {

    if (!fs.existsSync(pathToProject + "/.pystudio/config.json")) {
      console.log('not a pystudio project');
      return;
    }

    // logic for valid project here
    let configData = JSON.parse(fs.readFileSync(pathToProject + "/.pystudio/config.json"));
    let envFolder = configData['env_name'];
    if (!fs.existsSync(pathToProject + "/" + envFolder)) {
      console.log('no python env present')
      return;
    }

    // pystudio project
    // send main config location and python env path
    // front end will only be required to know overall command, not path to python or the config, will pass as params

    // else it is a pystudio project
    console.log(pathToProject + "/" + envFolder + "/bin/python");
    console.log(pathToProject + "/.pystudio/ipython_config.json");
    ipcRenderer.send(OPEN_PROJECT, {
      pythonPath: pathToProject + "/" + envFolder + "/bin/python",
      configPath: pathToProject + "/.pystudio/ipython_config.json"
    });
  }
  
}

export default App;
