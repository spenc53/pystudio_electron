import React from 'react';
import JupyterMessagingService from '../../services/JupyterMessagingService';

// Import Brace and the AceEditor Component
// import brace from 'brace';
import AceEditor, { IEditorProps } from 'react-ace';
import { ifError } from 'assert';


// Import a Mode (language)
require('ace-builds/src-noconflict/mode-python');

// Import a Theme (mokadia, github, xcode etc)
require('ace-builds/src-noconflict/theme-xcode');

// Import language tools/autocomplete
require("brace/ext/language_tools");

export type CodeEditorProps = {
    messagingService: JupyterMessagingService;
}

class CodeEditor extends React.Component<CodeEditorProps> {

    selection = '';

    jupyterMessagingService: JupyterMessagingService;

    constructor(props: CodeEditorProps, context: CodeEditorProps) {
        super(props, context);
        this.onChange = this.onChange.bind(this);
        this.jupyterMessagingService = props.messagingService;
    }

    onChange(newValue: string) {
        console.log('change', newValue);
    }

    render() {
        return(
            <div>
                <AceEditor
                    mode="python"
                    theme="xcode"
                    name="UNIQUE_ID_OF_DIV"
                    // onChange={this.onChange}
                    // value="Hello World!" /* Load code file and load up value here */
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
                            exec: () => {console.log('save logged')}
                        },
                        {
                            name: 'execute_code',
                            bindKey: {win: 'control-enter', mac:'cmd-enter'},
                            exec: () => {
                                if (!this.selection.trim()) {
                                    return;
                                }
                                this.jupyterMessagingService.sendShellChannelCode(this.selection);
                            }
                        }
                    ]}
                    // onSelectionChange = {this.selectionChanged}
                    onSelectionChange = {(selection) => {
                        const session = selection.session;
                        this.selection = session.getTextRange(selection.getRange());
                    }}
                    onCursorChange = {(selection) => {
                        this.selection = selection.doc.$lines[selection.getCursor().row];
                    }}
                />
            </div>
        )
    }
}

export default CodeEditor