import React from 'react';
import JupyterMessagingService from '../services/JupyterMessagingService';
import { ReactComponent as Next } from './navigate_next-24px.svg';
import { ReactComponent as Before } from './navigate_before-24px.svg';
import { ReactComponent as Save } from './save_alt-24px.svg';
import ImageButton from '../imageButton';

import { Dialog } from 'electron';
import ProjectState from '../project/ProjectState';

// const fs = window.require('fs');

const { dialog } = window.require('electron').remote;
const fs = window.require('fs');

export type PlotProps = {
  messagingService: JupyterMessagingService;
}

class Plot extends React.Component<PlotProps> {
    state: {
        plots: any[],
        currIndex: number
    }

    messagingService: JupyterMessagingService;

    constructor(props: PlotProps) {
        super(props);
        this.messagingService = props.messagingService;
        this.state = {
            plots: [],
            currIndex: 0
        };

        this.parsePubChannel = this.parsePubChannel.bind(this);
        this.getCurrentPlot = this.getCurrentPlot.bind(this);
        this.saveImage = this.saveImage.bind(this);

        this.messagingService.subscribeToPubIoChannel(this.parsePubChannel);
    }

    parsePubChannel(args: any) {
        if ('data' in args) {
            let data = args['data'];
            
            const plots = this.state.plots.concat(data)
            this.setState({
                plots: plots,
                currIndex: plots.length - 1
            })
        }
    }

    saveImage() {
        const savePath = dialog.showSaveDialogSync({
            title: "Save plot",
            defaultPath: ProjectState.getInstance()?.getProjectData().getProjectPath() || ""
        });

        if (!savePath) return;

        const plotData = this.state.plots[this.state.currIndex];

        if ('image/png' in plotData) {
            const imageData = "data:image/png;base64," + plotData['image/png'];

            let base64String = imageData; 
            let base64Image = base64String.split(';base64,').pop();

            fs.writeFile(savePath + '.png', base64Image, {encoding: 'base64'}, function(err: any) {
                console.log('File created')
            });
        }
        
    }

    render() {
        const maxLength = this.state.plots.length;
        const { currIndex } = this.state
        return (
            <div style={{overflow: "scroll"}}>
                <div style={{textAlign:"center"}}>Plots</div>
                <div style={{display: "inline-flex"}}>
                    <ImageButton 
                        disabled={maxLength === 0 || currIndex === 0}
                        style={{borderRadius:"4px", marginLeft: "3px"}}
                        onClick={() => {
                            this.setState({
                                currIndex: currIndex - 1
                            })
                        }}
                    >
                        <Before 
                            style={{fill: "grey"}}
                        />
                    </ImageButton>
                    <ImageButton
                        disabled={maxLength === 0 || (currIndex === maxLength-1)}
                        style={{borderRadius:"4px", marginLeft: "3px"}}
                        onClick={() => {
                            this.setState({
                                currIndex: currIndex + 1
                            })
                        }}
                    >
                        <Next 
                            style={{fill: "grey"}}
                        />
                    </ImageButton>
                    <div style={{borderLeft: "1px solid grey", marginLeft: "3px", marginTop: "3px", marginBottom: "3px"}}></div>
                    <ImageButton onClick={this.saveImage} disabled={maxLength === 0} style={{borderRadius:"4px", marginLeft: "3px"}}>
                        <Save 
                            style={{fill: "grey"}}
                        />
                        <span style={{verticalAlign:"super", marginLeft: "2px", fontSize:"13px"}}>Export</span>
                    </ImageButton>
                </div>
                <div style={{textAlign:"center", overflow: "scroll"}}>
                    {this.getCurrentPlot()}
                </div>
            </div>
        )
    }

    getCurrentPlot() {
        if (this.state.plots.length <= 0) {
            return null;
        }

        return (
            this.renderPlot(this.state.plots[this.state.currIndex])
        )
    }

    renderPlot(plotData: any) {
        if ('image/png' in plotData) {
            const imageData = "data:image/png;base64," + plotData['image/png'];
            const image = (<img src={imageData} alt="Graph" />)
            return image;
        }
    }
}

export default Plot;