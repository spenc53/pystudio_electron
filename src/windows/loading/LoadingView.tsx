import React from 'react';

import {
    CREATE_PROJECT_STDOUT,
    CREATE_PROJECT_STDERR
} from '../../constants/Channels';

import './index.css';

const { ipcRenderer } = window.require('electron');

class LoadingView extends React.Component {

    private endofInput: React.RefObject<HTMLInputElement>;

    state: {
        messages: {
            text: string,
            color: string
        } []
    };
    
    componentDidUpdate() {
        if (!this.endofInput.current) return;
        this.endofInput.current.scrollIntoView()
    }

    constructor(props: any) {
        super(props);

        this.state = {
            messages: []
        };

        this.endofInput = React.createRef();

        ipcRenderer.addListener(CREATE_PROJECT_STDOUT, (event, data) => {
            this.setState({
                messages: this.state.messages.concat({
                    text: data,
                    color: 'black'
                })
            });
        });
        ipcRenderer.addListener(CREATE_PROJECT_STDERR, (event, data) => {
            this.setState({
                messages: this.state.messages.concat({
                    text: data,
                    color: 'red'
                })
            });
        })
    }

    render() {
        return (
            <div style={{ height: '-webkit-fill-available', background:'#F6F7F9', padding:'10px', display: 'flex', flexDirection:'column'}}>
                <div>
                    Project Name
                </div>
                <div className='output' style={{background: 'white', border: '2px solid #D6DADC', marginTop:'10px', flex:'1', borderRadius:'3px'}}>
                    <div style={{margin: '3px'}}>
                        {this.state.messages.map((message) => {
                            return (
                                <div style={{color: message.color}}>
                                    {message.text}
                                </div>
                            );
                        })}
                        <div ref={this.endofInput}></div>
                    </div>
                </div>
            </div>
        )
    }
}

export default LoadingView
