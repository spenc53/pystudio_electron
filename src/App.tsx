import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

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

  constructor(props: any) {
    super(props);

    ipcRenderer.on("shell_channel", (event, args) => {
      console.log(event);
      console.log(args);
    }) 
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
