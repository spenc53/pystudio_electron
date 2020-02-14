import React from 'react';

// Import Brace and the AceEditor Component
// import brace from 'brace';
import AceEditor from 'react-ace';

// Import a Mode (language)
require('brace/mode/python');

// Import a Theme (mokadia, github, xcode etc)
require('brace/theme/xcode');

class CodeEditor extends React.Component {
    
    render() {
        return(
            <div>
                <AceEditor
                    mode="python"
                    theme="xcode"
                    name="UNIQUE_ID_OF_DIV"
                    value="Hello World!" /* Load python script and load up value here */
                    editorProps={{
                    $blockScrolling: true
                    }}
                />
            </div>
        )
    }
}

export default CodeEditor