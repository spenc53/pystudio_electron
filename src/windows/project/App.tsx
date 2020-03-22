import React, { Component } from 'react';
import './App.css';

import SplitPane from '../../components/splitpane/SplitPane';

import { IpcRenderer, Remote } from 'electron';
import { KERNEL_STATUS, LOADING_PROJECT_CHANNEL } from '../../constants/Channels';
import Plot from '../../components/plot';
import Terminal from '../../components/terminal';
import Modal from '../../components/modal';
import CodeEditor from "../../components/codeEditor";
import Tabs from '../../components/tabs/Tabs';
import HorizontalSplitPane from '../../components/horizontalSplitPane';
import JupyterMessagingService from '../../services/JupyterMessagingService';
import { KernelStatus } from '../../constants/KernelStatus';
import VariableView from '../../components/variableView';
import FileViewer from '../../components/fileViewer';

declare global {
  interface Window {
    require: (module: 'electron') => {
      ipcRenderer: IpcRenderer,
      remote: Remote
    }
  }
}

const { ipcRenderer } = window.require('electron');

const Store = window.require('electron-store');

class App extends Component {

  messagingService: JupyterMessagingService;

  state: {
    active: KernelStatus,
    showLoading: boolean
  };

  projectDir: string;

  store = new Store();

  constructor(props: any) {
    super(props);

    this.messagingService = new JupyterMessagingService(ipcRenderer);

    this.state = {
      active: KernelStatus.STOPPED,
      showLoading: false
    };
    this.projectDir = '';

    ipcRenderer.on('log', (event, args) => {
      console.log(args);
    })

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
  }

  render() {
    return (
      <div style={{ height: '-webkit-fill-available', background:'#F6F7F9' }}>
        <div style={{height:'-webkit-fill-available', padding:'5px'}}>
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
                <div style={{height:'-webkit-fill-available'}}>
                  <div style={{height:'100%'}}>
                  <Tabs>
                    <Terminal {...this.props && {_key: "terminal", label:"Terminal"}} messagingService={this.messagingService}></Terminal>
                  </Tabs>
                  </div>
                </div>
              </SplitPane.Bottom>
            </SplitPane>
          </HorizontalSplitPane.Left>
          <HorizontalSplitPane.Right>
            <SplitPane>
              <SplitPane.Top>
                <div style={{height:'-webkit-fill-available'}}>
                    <Tabs>
                      <div {...this.props && {_key: "environment", label:"Environment"}} style={{overflow:'scroll', height:'-webkit-fill-available'}}>
                        <VariableView messagingService={this.messagingService}></VariableView>
                      </div>
                    </Tabs>
                </div>
                
              </SplitPane.Top>
              <SplitPane.Bottom>
                <div style={{height:'-webkit-fill-available'}}>
                  <div style={{height:'100%'}}>
                    <Tabs>
                      <FileViewer {...this.props && {_key: "file", label:"Files"}} base={this.store.get('projectPath')} projectName={'project'}></FileViewer>
                      <Plot {...this.props && {_key: "plot", label:"Plot"}} messagingService={this.messagingService}></Plot>
                      <div {...this.props && {_key: "packages", label:"Packages"}}>Stuff</div>
                      <div {...this.props && {_key: "help", label:"Help"}}>Stuff</div>
                    </Tabs>
                  </div>
                </div>
              </SplitPane.Bottom>
            </SplitPane>
            
          </HorizontalSplitPane.Right>
        </HorizontalSplitPane>
      </div>
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
