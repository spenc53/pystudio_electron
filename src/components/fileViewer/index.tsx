import React from 'react';

import { ReactComponent as OpenFolder } from './folder_open.svg';
import { ReactComponent as FileIcon } from './file.svg';
import './fileViewer.css'

const fs = window.require('fs');

interface FileViewerProps {
    base: string,
    projectName: string
}

class FileViewer extends React.Component<FileViewerProps> {

    state: {
        currDirectory: string
    }

    watcher: any;

    constructor(props: FileViewerProps) {
        super(props);

        this.state = {
            currDirectory: ''
        };

        this.goUpDir = this.goUpDir.bind(this);
        this.openDir = this.openDir.bind(this);
        this.openFile = this.openFile.bind(this);
    }

    goUpDir() {
        const dat = this.state.currDirectory.split('/');
        dat.pop();
        const newDir = dat.join('/');
        this.setState(
            {
                currDirectory: newDir
            }
        )
    }

    openDir(dirName: string) {
        this.setState(
            {
                currDirectory: this.state.currDirectory + '/' + dirName
            }
        )
    }

    openFile(fileName: string) {
        console.log(this.props.base + '/' + this.state.currDirectory + "/" + fileName)
    }

    render() {
        if (this.watcher) {
            this.watcher.close();
        }
        const data = fs.readdirSync(this.props.base + '/' + this.state.currDirectory, {withFileTypes:true}).filter((dat: any) => dat.isFile() || dat.isDirectory());
        data.sort(function(a: any, b: any) {
            if (a.isFile() && b.isDirectory()) {
                return 1;
            }
            if (b.isFile() && a.isDirectory()) {
                return -1;
            }

            return a.name.localeCompare(b.name);
        });
        console.log(data);
        this.watcher = fs.watch(this.props.base + '/' + this.state.currDirectory, (eventName: string, fileName: string) => {
            if (eventName === 'rename') this.forceUpdate();
        });
        return(
            <>
                <div style={{borderBottom: '#D6DADC 1px solid', background:'#F4F8F9', padding:'5px'}}>
                    <div style={{display: 'flex'}} className='path'>
                        <div>{this.props.projectName}</div>
                        {this.state.currDirectory.split('/').map((path: string, index: number) => {
                            if (!path.trim()) return null;
                            return (
                                <div key={index} style={{marginLeft:'5px'}}>
                                    > {path}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className='items'>
                    { !this.state.currDirectory.trim() ? 
                        null :
                        <div className='item' key="../" onClick={this.goUpDir}><OpenFolder className='icon'/><div className='name'>../</div></div>
                    }
                    {data.map((dat: any) => {
                        return (
                            <div key={dat.name} className='item' onClick={() => dat.isDirectory() ? this.openDir(dat.name) : this.openFile(dat.name)}>
                                <div>
                                    {
                                        dat.isDirectory() ? <OpenFolder className='icon'/> : null
                                    }
                                    {
                                        dat.isFile() ? <FileIcon className='icon'/> : null
                                    }
                                </div>
                                <div className='name'>{dat.name}</div>
                            </div>
                        )
                    })}
                </div>
            </>
        );
    }

}

export default FileViewer;
