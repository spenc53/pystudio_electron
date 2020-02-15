import ProjectData from "./ProjectData";

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

    private constructor() {
        this.projectData = new ProjectData();
    }

    projectData: ProjectData;

    public getProjectData() {
        return this.projectData;
    }

    public setProjectData(projectData: ProjectData) {
        this.projectData = projectData;
    }
}