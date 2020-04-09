import React from 'react';
import Tabs from '../tabs/Tabs';
import JupyterMessagingService from '../../services/JupyterMessagingService';
import CodeEditor from '../codeEditor';
import FileService from '../../services/FileService';
import { Subject, BehaviorSubject } from 'rxjs';

const { ipcRenderer } = window.require('electron');

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
        const items = this.state.openedFiles.filter((f) =>  f.fileName === file);
        if (items.length > 0) {
            return;
        }

        const fileName = file.split('/').pop();
        const changeSubject = new BehaviorSubject<boolean>(false);
        const ref = React.createRef<CodeEditor>();
        this.setState(
            {
                openedFiles: this.state.openedFiles.concat({
                    fileName: file, 
                    component: <CodeEditor key={'EDITOR_' + fileName} ref={ref} {...this.props && {label: fileName, onClose:(isSaved: boolean) => this.closeFile(isSaved, file), changedSubject: changeSubject}} messagingService={this.props.messagingService} fileLocation={file} changedSubject={changeSubject}/>
                }),
            }
        )
    }

    closeFile(isSaved: boolean, file: string) {
        const component = this.state.openedFiles.filter((f) =>  f.fileName === file)[0];

        if (!isSaved) {
            const data = ipcRenderer.sendSync('SAVE_FILE', component.fileName);
            
            if (data == 'SAVE_AND_CLOSE') {
                component.component.ref.current.onSave();
            } else if ('CANCEL') {
                return;
            }
        }

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
            </Tabs>
        )
    }
}

export default Editor