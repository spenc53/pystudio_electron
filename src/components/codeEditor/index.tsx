import React from 'react';

// Import Brace and the AceEditor Component
// import brace from 'brace';
import AceEditor from 'react-ace';

// Import a Mode (language)
require('brace/mode/python');

// Import a Theme (mokadia, github, xcode etc)
require('brace/theme/xcode');

// Import language tools/autocomplete
require("brace/ext/language_tools");

export type CodeEditorProps = {

  }

class CodeEditor extends React.Component {

    constructor(props: CodeEditorProps, context: CodeEditorProps) {
        super(props, context);
        this.onChange = this.onChange.bind(this);
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
                    onChange={this.onChange}
                    value="Hello World!" /* Load code file and load up value here */
                    editorProps={{
                    $blockScrolling: true
                    }}
                    setOptions={{
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: true,
                        enableSnippets: true,
                        showLineNumbers: true,
                    }}
                />
            </div>
        )
    }
}

export default CodeEditor