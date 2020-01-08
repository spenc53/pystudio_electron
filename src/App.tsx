import React, { Component } from 'react';
import './App.css';
import ColoredMessage from './models/ColoredMessage';

import SplitPane from './splitpane/SplitPane';

import { IpcRenderer, Remote, Dialog } from 'electron';
import { SHELL_CHANNEL_CODE, KERNEL_INTERUPT_REQUEST, OPEN_PROJECT } from './constants/Channels';
import { KernelState } from './constants/KernelState';
import Terminal from './terminal';
import JupyterMessagingService from './services/JupyterMessagingService';

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

  messagingService: JupyterMessagingService;

  constructor(props: any) {
    super(props);

    this.messagingService = new JupyterMessagingService(ipcRenderer);

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
  }

  render() {
    return (
      <div style={{ height: '100vh' }}>
        <SplitPane >
          <SplitPane.Top>
            {this.file()}
          </SplitPane.Top>
          <SplitPane.Bottom>
            <Terminal messagingService={this.messagingService}></Terminal>
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

}

export default App;
