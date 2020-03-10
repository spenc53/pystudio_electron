import React from 'react';
import JsonViewer from './jsonViewer';
import JupyterMessagingService from '../../services/JupyterMessagingService';
import { Subscription } from 'rxjs';

export type VariableViewProps = {
    messagingService: JupyterMessagingService
}

class VariableView extends React.Component<VariableViewProps> {
    state: {
        json: any
    }

    ioPubSubscription: Subscription;

    componentWillUnmount() {
        this.ioPubSubscription.unsubscribe();
    }

    constructor(props: VariableViewProps) {
        super(props);

        this.state = {
            json: {}
        }

        this.listenForMessages = this.listenForMessages.bind(this);

        this.ioPubSubscription = props.messagingService.subscribeToIoPub(this.listenForMessages)
    }

    listenForMessages(args: any) {
        if (!('data' in args) || !('application/json' in args['data'])) { 
            return;
        }
        this.setState({
            json: args['data']['application/json']
        })
    }

    render() {
        return(
            <JsonViewer data={this.state.json}></JsonViewer>
        )
    }
}

export default VariableView