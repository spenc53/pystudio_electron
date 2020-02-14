export default class ProjectState {

    static myInstance?: ProjectState;

    static getInstance() {
        if (!ProjectState.myInstance) {
            ProjectState.myInstance = new ProjectState();
        }
        return this.myInstance;
    }

    public static load(projectState: ProjectState) {
        ProjectState.myInstance = projectState;
    }


    projectPath?: string;

    public getProjectPath(): string | undefined {
        return this.projectPath;
    }

    public setProjectPath(projectPath: string) {
        this.projectPath = projectPath;
    }
}