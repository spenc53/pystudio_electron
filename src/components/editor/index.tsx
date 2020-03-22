import React from 'react';
import Tabs from '../tabs/Tabs';
import JupyterMessagingService from '../../services/JupyterMessagingService';
import CodeEditor from '../codeEditor';
import FileService from '../../services/FileService';

const fs = window.require('fs');

interface EditorProps {
    fileService: FileService,
    messagingService: JupyterMessagingService
}

class Editor extends React.Component<EditorProps> {
    
    state : {
        openedFiles: {
            fileName: string
            component: any
        }[]
    }

    constructor(props: EditorProps) {
        super(props);

        this.openFile = this.openFile.bind(this);
        this.closeFile = this.closeFile.bind(this);


        const file1 = '/Users/spencerseeger/Documents/pystudio_projects/project1/test1.txt';
        const fileName1 = file1.split('/').pop();
        const file2 = '/Users/spencerseeger/Documents/pystudio_projects/project1/test2.txt';
        const fileName2 = file2.split('/').pop();
        this.state = {
            openedFiles: [
                {
                    fileName: file1,
                    component: <CodeEditor {...this.props && {_key: fileName1, label:fileName1, onClose:() => this.closeFile(file1)}} messagingService={this.props.messagingService} fileLocation={file1}/>
                },
                {
                    fileName: file2,
                    component: <CodeEditor {...this.props && {_key: fileName2, label:fileName2, onClose:() => this.closeFile(file2)}} messagingService={this.props.messagingService} fileLocation={file2}/>
                }
                
            ],
        }

        props.fileService.listenForFiles().subscribe(file => {
            this.openFile(file);
        });
    }

    openFile(file: string) {
        // const codeEditor: CodeEditor = (
        //     <CodeEditor {...this.props && {_key: "file", label:"Files"}} messagingService={this.props.messagingService} fileLocation={file}/>
        // )
        // this.setState(
        //     {
        //         openedFiles: this.state.openedFiles.concat(file),
        //         openedTabs: this.state.openedTabs.concat([codeEditor])
        //     }
        // )
    }

    closeFile(file: string) {
        // indexes should match up
        this.setState(
            {
                openedFiles: this.state.openedFiles.filter((f) =>  f.fileName !== file)
            }
        )
    }

    render() {
        return (
            <Tabs>
                {this.state.openedFiles.map((file, index) => {
                    return file.component;
                })}
                {/* <CodeEditor {...this.props && {_key: "file", label:"Files"}} messagingService={this.props.messagingService} fileLocation={'/test.txt'}></CodeEditor>
                <div {...this.props && {_key: "packages", label:"Package"}}>Stuff</div>
                <div {...this.props && {_key: "help", label:"Help"}}>Stuff</div>
                <div {...this.props && {_key: "file1", label:"Files1"}}>Stuff</div>
                <div {...this.props && {_key: "packages2", label:"Packages2"}}>Stuff</div>
                <div {...this.props && {_key: "help3", label:"Help3"}}>Stuff</div>
                <div {...this.props && {_key: "file4", label:"Files4"}}>Stuff</div>
                <div {...this.props && {_key: "packages5", label:"Packages5"}}>Stuff</div>
                <div {...this.props && {_key: "help6", label:"Help6"}}>Stuff</div> */}
            </Tabs>
        )
    }
}

export default Editor