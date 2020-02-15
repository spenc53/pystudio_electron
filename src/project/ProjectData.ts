export default class ProjectData {
    private projectPath?: string

    public setProjectPath(projectPath: string) {
        this.projectPath = projectPath;
    }

    public getProjectPath(): string | undefined {
        return this.projectPath;
    }
}