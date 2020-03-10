import React from 'react';
import './OpenView.css';

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
                        <div style={{marginTop:'10px', textAlign:'center'}}>
                            Create a Project
                        </div>
                        <div style={{marginTop:'10px', textAlign:'center'}}>
                            Open a Project
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