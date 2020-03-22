import React from 'react';
import JupyterMessagingService from '../../services/JupyterMessagingService';

import AceEditor from 'react-ace';

// Import a Mode (language)
require('ace-builds/src-noconflict/mode-python');

// Import a Theme (mokadia, github, xcode etc)
require('ace-builds/src-noconflict/theme-xcode');

// Import language tools/autocomplete; need to update to ace-builds
require("brace/ext/language_tools");

const fs = window.require('fs');

export type CodeEditorProps = {
    messagingService: JupyterMessagingService;
    fileLocation: string
}

class CodeEditor extends React.Component<CodeEditorProps> {

    aceEditorRef: any;

    jupyterMessagingService: JupyterMessagingService;

    type: string;

    static typeTable:any = {
        "py" : "python",
        "python": "python",
        "" : "txt"
    }

    constructor(props: CodeEditorProps, context: CodeEditorProps) {
        super(props, context);
        this.onChange = this.onChange.bind(this);
        this.onSave = this.onSave.bind(this);
        this.jupyterMessagingService = props.messagingService;

        this.aceEditorRef = React.createRef();

        let tempType = props.fileLocation.split('\.').pop();
        this.type = tempType ? CodeEditor.typeTable[tempType] : "";
        
        fs.readFile(this.props.fileLocation, (err: any, data: any) => {
            this.aceEditorRef.current.editor.setValue(data.toString(), -1)
        });
    }

    onChange(newValue: string) {
        console.log('change', newValue);
    }

    onSave() {
        fs.writeFileSync(this.props.fileLocation, this.aceEditorRef.current.editor.getSession().getValue())
    }

    render() {
        return(
            <>
                <AceEditor
                    ref={this.aceEditorRef}
                    mode={this.type}
                    style={{height:'100%', width:'100%'}}
                    theme="xcode"
                    name="UNIQUE_ID_OF_DIV"
                    editorProps={{
                    $blockScrolling: true
                    }}
                    
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                    }}
                    commands={[
                        {
                            name: 'saving',
                            bindKey: {win: 'control-s', mac: 'cmd-s'},
                            exec: () => {this.onSave()}
                        },
                        {
                            name: 'execute_code',
                            bindKey: {win: 'control-enter', mac:'cmd-enter'},
                            exec: () => {

                                const editor = this.aceEditorRef.current.editor;
                                const session = this.aceEditorRef.current.editor.session;
                                const selection = this.aceEditorRef.current.editor.selection;
                                const selectedText = session.getTextRange(selection.getRange());
                                const rowText = selection.doc.$lines[selection.getCursor().row];

                                if (!selectedText.trim()) {
                                    this.jupyterMessagingService.sendShellChannelCode(rowText);
                                    selection.moveCursorTo(selection.getCursor().row+1,0);
                                } 
                                else {
                                    this.jupyterMessagingService.sendShellChannelCode(selectedText);
                                }
                                
                            }
                        }
                    ]}
                />
            </>
        )
    }
}

export default CodeEditor