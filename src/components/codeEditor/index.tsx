import React from 'react';
import JupyterMessagingService from '../../services/JupyterMessagingService';

import AceEditor, { IEditorProps } from 'react-ace';
import { ifError } from 'assert';

// Import a Mode (language)
require('ace-builds/src-noconflict/mode-python');

// Import a Theme (mokadia, github, xcode etc)
require('ace-builds/src-noconflict/theme-xcode');

// Import language tools/autocomplete; need to update to ace-builds
require("brace/ext/language_tools");

export type CodeEditorProps = {
    messagingService: JupyterMessagingService;
}

class CodeEditor extends React.Component<CodeEditorProps> {

    aceEditorRef: any;

    jupyterMessagingService: JupyterMessagingService;

    constructor(props: CodeEditorProps, context: CodeEditorProps) {
        super(props, context);
        this.jupyterMessagingService = props.messagingService;

        this.aceEditorRef = React.createRef();
    }

    render() {
        return(
                <AceEditor
                    ref={this.aceEditorRef}
                    mode="python"
                    style={{height:'100%', width:'100%'}}
                    theme="xcode"
                    name="UNIQUE_ID_OF_DIV"
                    editorProps={{
                    $blockScrolling: true,
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
                            exec: () => {console.log('save logged')}
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
        )
    }
}

export default CodeEditor