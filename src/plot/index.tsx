import React from 'react';
import JupyterMessagingService from '../services/JupyterMessagingService';

export type PlotProps = {
  messagingService: JupyterMessagingService;
}

class Plot extends React.Component<PlotProps> {
    state: {
        plots: any[],
    }

    messagingService: JupyterMessagingService;

    constructor(props: PlotProps) {
        super(props);
        this.messagingService = props.messagingService;
        this.state = {
            plots: []
        };

        this.parsePubChannel = this.parsePubChannel.bind(this);

        this.messagingService.subscribeToPubIoChannel(this.parsePubChannel);
    }

    parsePubChannel(args: any) {
        if ('data' in args) {
            let data = args['data'];
            if ('image/png' in data) {
                let imageData = "data:image/png;base64," + data['image/png'];
                let image = (<img src={imageData} alt="Graph" />)
                this.setState({
                    plots: this.state.plots.concat(image)
                })
            }
        }
    }

    render() {
        if (this.state.plots.length >= 1) {
            return (
                <div>
                    <div style={{textAlign:"center"}}>Plots</div>
                    <div>
                        {this.state.plots[this.state.plots.length - 1]}
                    </div>
                </div>
            )
        }

        return (
            <div>
                <div style={{textAlign:"center"}}>Plots</div>
            </div>
        )
    }
}

export default Plot;