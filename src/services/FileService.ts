import { Subject } from 'rxjs';

class FileService {

    fileSubject = new Subject<string>();

    openFile(fileLocation: string) {
        this.fileSubject.next(fileLocation);
    }

    listenForFiles(): Subject<string> {
        return this.fileSubject;
    }
}

export default FileService;