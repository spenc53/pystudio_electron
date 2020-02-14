import React from 'react';
import JupyterMessagingService from '../services/JupyterMessagingService';
import { ReactComponent as Next } from './navigate_next-24px.svg';
import { ReactComponent as Before } from './navigate_before-24px.svg';
import { ReactComponent as Save } from './save_alt-24px.svg';
import ImageButton from '../imageButton';

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

        this.messagingService.subscribeToPubIoChannel(this.parsePubChannel);
    }

    parsePubChannel(args: any) {
        if ('data' in args) {
            let data = args['data'];
            if ('image/png' in data) {
                const imageData = "data:image/png;base64," + data['image/png'];
                const image = (<img src={imageData} alt="Graph" />)
                const plots = this.state.plots.concat(image)
                this.setState({
                    plots: plots,
                    currIndex: plots.length - 1 
                })
            }
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
                    <ImageButton disabled={maxLength === 0} style={{borderRadius:"4px", marginLeft: "3px"}}>
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
            this.state.plots[this.state.currIndex]
        )
    }
}

export default Plot;