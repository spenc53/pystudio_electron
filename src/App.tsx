import React, { Component } from 'react';
import './App.css';

import SplitPane from './components/splitpane/SplitPane';

import { IpcRenderer, Dialog, Remote } from 'electron';
import { OPEN_PROJECT, KERNEL_STATUS, LOADING_PROJECT_CHANNEL } from './constants/Channels';
import Plot from './components/plot';
import Terminal from './components/terminal';
import Modal from './components/modal';
import CodeEditor from "./components/codeEditor";
import Tabs from './components/tabs/Tabs';
import HorizontalSplitPane from './components/horizontalSplitPane';
import JupyterMessagingService from './services/JupyterMessagingService';
import { KernelStatus } from './constants/KernelStatus';
import ProjectData from './project/ProjectData';
import ProjectState from './project/ProjectState';


declare global {
  interface Window {
    require: (module: 'electron') => {
      ipcRenderer: IpcRenderer,
      remote: Remote
    }
  }
}

const fs = window.require('fs');

const { ipcRenderer } = window.require('electron');

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
      // const isError = args.isError;
      // const message = args.message;

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

    this.loadState();
  }

  loadState() {
    const stateString = localStorage.getItem("state");
    console.log(stateString);
    if (!stateString) {
      return;
    }

    // not null, load project
    JSON.parse(stateString);
    const projectData: ProjectData = Object.setPrototypeOf(JSON.parse(stateString), ProjectData.prototype)
    ProjectState.getInstance()?.setProjectData(projectData);

    // load project
    const projectPath = projectData.getProjectPath();
    if (projectPath) {
      this.openPystudioProject(projectPath)
    }
  }

  saveState() {
    const stateString = JSON.stringify(ProjectState.getInstance()?.getProjectData());
    localStorage.setItem("state", stateString); 
  }

  render() {
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
                <CodeEditor messagingService={this.messagingService}></CodeEditor>
              </SplitPane.Top>
              <SplitPane.Bottom>
                <Terminal messagingService={this.messagingService}></Terminal>
              </SplitPane.Bottom>
            </SplitPane>
          </HorizontalSplitPane.Left>
          <HorizontalSplitPane.Right>
            <SplitPane>
              <SplitPane.Top>
                {/* thing */}
              </SplitPane.Top>
              <SplitPane.Bottom>
                <Tabs>
                  <Plot {...this.props && {_key: "plot", label:"Plot"}} messagingService={this.messagingService}></Plot>

                  {/* <div {...this.props && {label:"Gator"}}>
                    See ya later, <em>Alligator</em>!
                  </div>
                  <div {...this.props && {label:"Croc"}}>
                    After 'while, <em>Crocodile</em>!
                  </div>
                  <div {...this.props && {label:"Dino"}}>
                    Nothing to see here, this tab is <em>extinct</em>!
                  </div> */}
                </Tabs>
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
    ProjectState.getInstance()?.getProjectData().setProjectPath(pathToProject);
    this.saveState();
  }
  
}

export default App;
