import { IpcRenderer } from "electron";
import { SHELL_CHANNEL_CODE, KERNEL_INTERUPT_REQUEST, STDIN_CHANNEL_REQUEST, STDIN_CHANNEL_REPLY } from "../constants/Channels";

class JupyterMessagingService {
    ipcRenderer: IpcRenderer;

    kernelInfoSubscribers: recieve[] = [];
    ioPubSubscribers: recieve[] = [];
    stdInSubscribers: recieve[] = [];

    constructor(ipcRenderer: IpcRenderer) {
        this.ipcRenderer = ipcRenderer;
    
        ipcRenderer.on("kernel_info", (event, args) => {
            // this.setState({
            //     executionState: KernelState.IDLE
            // })
            
            // publish... but where to publish?
            // kernel info should be where?
            this.kernelInfoSubscribers.forEach(recieve => {
                recieve(args);
            });
        });

        ipcRenderer.on("io_pub_channel", (event, args) => {
            this.ioPubSubscribers.forEach(recieve => {
                recieve(args);
            });
        })

        ipcRenderer.on(STDIN_CHANNEL_REQUEST, (event, args) => {
            this.stdInSubscribers.forEach(recieve => {
                recieve(args);
            })
        });
    }

    sendShellChannelCode(code: string) {
        this.ipcRenderer.send(SHELL_CHANNEL_CODE, code); // need to send this
    }

    sendInputReply(data: string) {
        this.ipcRenderer.send(STDIN_CHANNEL_REPLY, data);
    }

    sendKernelInterrupt() {
        this.ipcRenderer.send(KERNEL_INTERUPT_REQUEST);
    }

    subscribeToKernelInfo(recieveFunc: recieve) {
        this.kernelInfoSubscribers.push(recieveFunc);
    }

    subscribeToPubIoChannel(recieveFunc: recieve) {
        this.ioPubSubscribers.push(recieveFunc);
    }

    subscribeToInputChannel(recieveFunc: recieve) {
        this.stdInSubscribers.push(recieveFunc);
    }

    
    
}

export interface recieve {
    (args: any): void;
}

export default JupyterMessagingService;