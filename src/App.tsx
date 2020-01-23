import React, { Component } from 'react';
import './App.css';

import SplitPane from './splitpane/SplitPane';

import { IpcRenderer, Remote, Dialog } from 'electron';
import { OPEN_PROJECT, KERNEL_STATUS } from './constants/Channels';
import Terminal from './terminal';
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
    active: KernelStatus
  };

  projectDir: string;

  constructor(props: any) {
    super(props);

    this.messagingService = new JupyterMessagingService(ipcRenderer);

    this.state = {
      active: KernelStatus.STOPPED
    };
    this.projectDir = '';

    this.openPystudioProject = this.openPystudioProject.bind(this);

    ipcRenderer.on(OPEN_PROJECT, (event) => {
      const data = dialog.showOpenDialogSync({properties: ['openDirectory']});
      if (!data || data.length === 0) return;

      this.openPystudioProject(data[0]);
    });

    ipcRenderer.on(KERNEL_STATUS, (event, args) => {
      this.setState({
        active: args
      });
    });
  }

  render() {
    const { active } = this.state;
    return (
      <div style={{ height: '100vh' }}>
        <HorizontalSplitPane>
          <HorizontalSplitPane.Left>
            <SplitPane>
              <SplitPane.Top>
                {this.file()}
              </SplitPane.Top>
              <SplitPane.Bottom>
                <Terminal messagingService={this.messagingService}></Terminal>
              </SplitPane.Bottom>
            </SplitPane>
          </HorizontalSplitPane.Left>
          <HorizontalSplitPane.Right>
            <div>right</div>
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
