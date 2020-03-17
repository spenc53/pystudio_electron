import React from 'react';
import './OpenView.css';

import { ReactComponent as OpenFolder } from './folder_open.svg';
import { ReactComponent as CreateFolder } from './create_new_folder.svg';

import {
    CREATE_PROJECT_NEW
} from '../../constants/Channels';

const Store = window.require('electron-store');

const { ipcRenderer } = window.require('electron');

class OpenView extends React.Component {

    recentProjects: string[];

    constructor(props: any) {
        super(props);

        const store = new Store();
        let recentProjects = store.get('recentProjects');
        if (!recentProjects) {
            recentProjects = [];
        }
        this.recentProjects = recentProjects;
        console.log(recentProjects)
    }

    openProject(pathToProject: string) {
        ipcRenderer.send("OPEN_PROJECT", pathToProject)
    }

    createProject() {
        ipcRenderer.send(CREATE_PROJECT_NEW, {});
    }

    onMouseOver(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.currentTarget.style.background = "lightgrey";
    }

    onMouseLeave(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        e.currentTarget.style.backgroundColor = "";

    }

    render() {
        return (
            <div style={{ height: '-webkit-fill-available', background:'#F6F7F9'}}>
                <div className="row" style={{height:'100%'}}>
                    <div className="column" style={{justifyContent:'center'}}>
                        <div className="title" style={{textAlign:"center"}}>
                            Welcome to PyStudio!
                        </div>
                        <div style={{marginTop:'10px', textAlign:'center', justifyContent: 'center', alignItems: 'center'}}>
                            <div style={{display:'inline-flex', alignItems:'center', paddingLeft:'10px', paddingRight:'10px', paddingTop:'2px', borderRadius:'5px'}} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseLeave} onClick={() => this.createProject()}>
                                <div><CreateFolder/></div>
                            
                                <div style={{marginLeft: '5px'}}>
                                    Create a Project
                                </div>
                            </div>
                        </div>
                        <div style={{marginTop:'10px', textAlign:'center', display: 'flex', justifyContent: 'center', alignItems: 'center'}} >
                            <div style={{display:'inline-flex', alignItems:'center', paddingLeft:'10px', paddingRight:'10px', paddingTop:'2px', borderRadius:'5px'}} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseLeave} onClick={() => this.openProject('')}>
                                <div>
                                    <OpenFolder/>
                                </div>
                                <div style={{marginLeft: '5px'}}>
                                    Open a Project
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="column" style={{borderLeft: '#D6DADC 2px solid'}}>
                        <div className="recent">
                            Recent Projects
                        </div>
                        { this.recentProjects.map(pathToProject => {
                            return (
                                <div className="recentProject" onClick={() => this.openProject(pathToProject)} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseLeave}>
                                    {/* read out of the local storage */}
                                    <div className="name">
                                        Project Name
                                    </div>
                                    <div className="path">
                                        {pathToProject}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    }

}

export default OpenView;