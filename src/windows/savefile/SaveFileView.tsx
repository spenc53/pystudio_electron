import React from 'react';

// declare global {
//     interface Window {
//         require: (module: 'electron') => {
//         ipcRenderer: IpcRenderer,
//         remote: Remote
//         }
//     }
// }
  
const { ipcRenderer } = window.require('electron');

class SaveFileView extends React.Component{

    state: {
        fileName: string
    };
    event: any;

    constructor(props: any) {
        super(props);
        ipcRenderer.once('SAVE_FILE', (event: any, args: any) => {
            this.event = event;
            this.setState({
                fileName: args
            });
        });

        this.state = {
            fileName: ''
        };
    }

    render() {
        return (
            <div style={{ height: '-webkit-fill-available', background:'#F6F7F9', padding:'10px', flexDirection:'column'}}>
                <div style={{textAlign:'center', marginBottom:'10px'}}>
                    Save File?
                </div>
                <div style={{display:'flex', justifyContent:'center'}}>
                    <div>
                        <button style={{fontSize:'16px'}} onClick={() => {this.event.sender.send('SAVE_' + this.state.fileName, 'SAVE_AND_CLOSE')}}>Save {'&'} Close</button>
                    </div>
                    <div style={{marginLeft:'10px'}}>
                        <button style={{fontSize:'16px'}} onClick={() => {this.event.sender.send('SAVE_' + this.state.fileName, 'CANCEL')}}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
}

export default SaveFileView;