import React from 'react';

import { ReactComponent as OpenFolder } from './folder_open.svg';
import { ReactComponent as FileIcon } from './file.svg';
import './fileViewer.css'
import FileService from '../../services/FileService';
import ImageButton from '../imageButton';

const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');

interface FileViewerProps {
    base: string,
    projectName: string,
    fileService: FileService
}

class FileViewer extends React.Component<FileViewerProps> {

    state: {
        currDirectory: string
    }

    watcher: any;
    editedFile?: string;

    constructor(props: FileViewerProps) {
        super(props);

        this.state = {
            currDirectory: ''
        };

        this.goUpDir = this.goUpDir.bind(this);
        this.openDir = this.openDir.bind(this);
        this.openFile = this.openFile.bind(this);
        this.newFile = this.newFile.bind(this);
        this.newFolder = this.newFolder.bind(this);
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
        this.props.fileService.openFile(this.props.base + '/' + this.state.currDirectory + "/" + fileName);
    }

    newFolder() {
        const savePath = this.props.base + '/' + this.state.currDirectory + "/New Folder";
        fs.mkdir(savePath, 0o755, (err: any) =>{
            this.editedFile = "New Folder";
            this.forceUpdate();
        });
    }

    newFile() {
        const savePath = this.props.base + '/' + this.state.currDirectory + "/untitled";
        fs.writeFile(savePath, '', (err: any) =>{
            this.editedFile = "untitled";
            this.forceUpdate();
        });
    }

    fileMenu(fileName: string) {
        this.editedFile = fileName;
        this.forceUpdate();
    }

    updateFileName(oldFileName: string, newFileName: string) {
        if (oldFileName !== newFileName) {
            const oldPath = this.props.base + '/' + this.state.currDirectory + "/" + oldFileName;
            const newPath = this.props.base + '/' + this.state.currDirectory + "/" + newFileName;
            fs.rename(oldPath, newPath, () => {});
        }
        this.editedFile = undefined;
        this.forceUpdate();
    }

    handleRenameKeyPress(event: any, fileName: string){
        if (event.key === 'Enter') {
            this.updateFileName(fileName, event.target.value)
        }
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
        this.watcher = fs.watch(this.props.base + '/' + this.state.currDirectory, (eventName: string, fileName: string) => {
            if (eventName === 'rename') this.forceUpdate();
        });
        return(
            <>
                <div style={{borderBottom: '#D6DADC 1px solid', background:'#F4F8F9', padding:'5px', display: 'flex', flexDirection: 'row'}}>
                    <div style={{display: 'flex', marginRight: '5px'}} className='path'>
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
                    <div style={{display: 'flex'}}>
                        <ImageButton onClick={this.newFile}>
                            <FileIcon className='icon'></FileIcon>
                        </ImageButton>
                    </div>
                    <div style={{display: 'flex'}}>
                        <ImageButton onClick={this.newFolder}>
                            <OpenFolder className='icon'></OpenFolder>
                        </ImageButton>
                    </div>
                </div>
                <div className='items'>
                    { !this.state.currDirectory.trim() ? 
                        null :
                        <div className='item' key="../" onClick={this.goUpDir}><OpenFolder className='icon'/><div className='name'>../</div></div>
                    }
                    {data.map((dat: any) => {
                        if (dat.name == this.editedFile) {
                            return (
                                <div key={dat.name} style={{display:'flex', flexDirection:'row'}}>
                                    <div>
                                        {
                                            dat.isDirectory() ? <OpenFolder className='icon'/> : null
                                        }
                                        {
                                            dat.isFile() ? <FileIcon className='icon'/> : null
                                        }
                                    </div>
                                    <div style={{marginLeft:"10px"}}>
                                        <input onKeyPress={(event) => this.handleRenameKeyPress(event, dat.name)} autoFocus={true} onBlur={(event) => {this.updateFileName(dat.name, event.target.value)}} defaultValue={dat.name}></input>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div className='item'
                                onClick={() => dat.isDirectory() ? this.openDir(dat.name) : this.openFile(dat.name)}
                                onContextMenu={() => this.fileMenu(dat.name)}
                            >
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
