import { existsSync } from 'fs';
import Project, * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';

/** helpers for project-related tasks. Maintain a ts-simple-ast project object and keep it updated */
export class ProjectManager {


  private _project: tsa.Project | undefined;
  private _currentSourceFile: tsa.SourceFile | undefined;
  private lastFileName: string | undefined;

  get currentSourceFile(): tsa.SourceFile{
    if ( !this._currentSourceFile) {
      throw new Error('currentSourceFile getter called before refresh()')
    }
    return this._currentSourceFile;
  }

  get project(): tsa.Project{
    if ( !this._project) {
      debugger;
      throw new Error('project getter  called before refresh()')
    }
    return this._project;
  }

  async refresh() {
    if (!vscode.window.activeTextEditor) {
      return
    }
    if (!this._project) {
      const files = await vscode.workspace.findFiles('**/tsconfig.json')
      const tsconfig = files[0].fsPath//TODO: check null or more than one and decide what to do
      this.lastFileName = vscode.window.activeTextEditor.document.fileName
      try {
        this._project = new Project({ tsConfigFilePath: tsconfig })
      } catch (error) {
        debugger //TODO: log
      }
    }
    if (this._project &&
      (!this._currentSourceFile || this.lastFileName !== vscode.window.activeTextEditor.document.fileName)) {
      this.lastFileName = vscode.window.activeTextEditor.document.fileName
      try {
        this._currentSourceFile = this.project.getSourceFile(this.lastFileName)
        if (!this.currentSourceFile && !existsSync(this.lastFileName)) {// not in tsa project (new file)
          this._currentSourceFile = this.project.createSourceFile(this.lastFileName, vscode.window.activeTextEditor.document.getText())
        } else if (!this.currentSourceFile) {
          this._currentSourceFile = this.project.addExistingSourceFile(this.lastFileName)
        }
        if (vscode.window.activeTextEditor.document.isDirty) {
          this.currentSourceFile.replaceWithText(vscode.window.activeTextEditor.document.getText())
        }
      } catch (error) {
        debugger //TODO: log
      }
    }
    return Promise.resolve()
  }

	save() {
	  if (!this._project || !this._currentSourceFile) {
      throw new Error('save() called before refresh()')
    }
    this._project.save()
  }
  
  async getRefactorsFor(node: tsa.Node) {
    if (!this._project || !this._currentSourceFile) {
      throw new Error('getRefactorsFor() called before refresh()')
    }
    if (node.getKind() === tsa.SyntaxKind.SourceFile) {
      return []
    }
    const userPreferences = {
      disableSuggestions: false,
      includeCompletionsForModuleExports: true,
      includeCompletionsWithInsertText: true,
      allowTextChangesInNewFiles: true
      // TODO : we should respect the user regarding quotepreference and import importModuleSpecifierPreference
      // quotePreference?: "double" | "single";
      // importModuleSpecifierPreference?: "relative" | "non-relative";
    }
    const refactors = this.project.getLanguageService().compilerObject.getApplicableRefactors(
      this.currentSourceFile.getFilePath(), { pos: node.getPos(), end: node.getEnd() }, userPreferences)
    const applicableRefactorsMap: { [key: string]: { refactor: tsa.ts.ApplicableRefactorInfo, action: tsa.ts.RefactorActionInfo } } = {}
    refactors.forEach(r => {
      r.actions.forEach(a => {
        const name = r.name + ' - ' + a.description
        applicableRefactorsMap[name] = { refactor: r, action: a }
      })
    })
    return Object.keys(applicableRefactorsMap)
  }

}