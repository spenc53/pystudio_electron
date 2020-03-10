import { IpcRenderer } from "electron";
import { SHELL_CHANNEL_CODE, KERNEL_INTERUPT_REQUEST, STDIN_CHANNEL_REQUEST, STDIN_CHANNEL_REPLY, KERNEL_STATUS, SHELL_CHANNEL_CODE_SILENT } from "../constants/Channels";
import { KernelStatus } from "../constants/KernelStatus";
import { Subject, Subscription } from 'rxjs';

class JupyterMessagingService {
    ipcRenderer: IpcRenderer;
    kernelStatusSubject: Subject<KernelStatus>;

    ioPubSubject: Subject<any>;
    inputChannelSubject: Subject<any>;

    constructor(ipcRenderer: IpcRenderer) {
        this.ipcRenderer = ipcRenderer;
        // this.kernelStatus = KernelStatus.STOPPED;
        this.kernelStatusSubject = new Subject();
        this.kernelStatusSubject.next(KernelStatus.STOPPED);

        this.ioPubSubject = new Subject();
        this.inputChannelSubject = new Subject();

        ipcRenderer.on("io_pub_channel", (event, args) => {
            this.ioPubSubject.next(args);
        })

        ipcRenderer.on(STDIN_CHANNEL_REQUEST, (event, args) => {
            this.inputChannelSubject.next(args);
        });

        ipcRenderer.on(KERNEL_STATUS, (event, args) => {
            this.kernelStatusSubject.next(args);
        });
    }

    // subject functions

    subscribeToIoPub(recieveFunc: recieve): Subscription {
        return this.ioPubSubject.subscribe(recieveFunc);
    }

    subscribeToInputChannel(recieveFunc: recieve): Subscription {
        return this.inputChannelSubject.subscribe(recieveFunc);
    }

    getStatus() {
        return this.kernelStatusSubject.asObservable();
    }

    // send functions 

    sendShellChannelCode(code: string) {
        this.ipcRenderer.send(SHELL_CHANNEL_CODE, code);
    }

    sendInputReply(data: string) {
        this.ipcRenderer.send(STDIN_CHANNEL_REPLY, data);
    }

    sendPublishLocalVarsCommand() {
        const code = "_publish_local_vars()"
        this.ipcRenderer.send(SHELL_CHANNEL_CODE_SILENT, code)
    }

    sendKernelInterrupt() {
        this.ipcRenderer.send(KERNEL_INTERUPT_REQUEST);
    }    
}

export interface recieve {
    (args: any): void;
}

export default JupyterMessagingService;