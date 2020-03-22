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

        this.state = {
            openedFiles: [                
            ],
        }

        props.fileService.listenForFiles().subscribe(file => {
            this.openFile(file);
        });
    }

    openFile(file: string) {
        const fileName = file.split('/').pop();
        this.setState(
            {
                openedFiles: this.state.openedFiles.concat({
                    fileName: file, 
                    component: <CodeEditor {...this.props && {_key: fileName, label:fileName, onClose:() => this.closeFile(file)}} messagingService={this.props.messagingService} fileLocation={file}/>
                }),
            }
        )
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
        if (this.state.openedFiles.length === 0 ) return null;

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