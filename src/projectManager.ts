import Project, * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { existsSync } from 'fs';

export interface ProjectManagerOptions {
  mode: 'getChildren' | 'forEachChildren',
  showSourceFiles: boolean
}


export class ProjectManager {

  private _project: tsa.Project;
  private _currentSourceFile: tsa.SourceFile;
  private lastFileName: string;


  get currentSourceFile(): tsa.SourceFile {
    return this._currentSourceFile;
  }
  get project(): tsa.Project {
    return this._project;
  }

  async refresh() {
    if (!vscode.window.activeTextEditor) {
      return
    }
    if (!this.project) {
      const files = await vscode.workspace.findFiles('**/tsconfig.json')
      const tsconfig = files[0].fsPath//TODO: check null or more than one and decide what to do
      this.lastFileName = vscode.window.activeTextEditor.document.fileName
      try {
        this._project = new Project({ tsConfigFilePath: tsconfig })
      } catch (error) {
        debugger //TODO: log
      }
    }
    if (!this.currentSourceFile || this.lastFileName !== vscode.window.activeTextEditor.document.fileName) {
      this.lastFileName = vscode.window.activeTextEditor.document.fileName
      try {
        this._currentSourceFile = this.project.getSourceFile(this.lastFileName)
        if (!this.currentSourceFile && !existsSync(this.lastFileName)) {// not in tsa project (new file)
          this._currentSourceFile = this.project.createSourceFile(this.lastFileName, vscode.window.activeTextEditor.document.getText())
        } else if (!this.currentSourceFile){
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

  async getRefactorsFor(node: tsa.Node) {
    if(node.getKind()===tsa.SyntaxKind.SourceFile){
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
    const applicableRefactorsMap = {}
    refactors.forEach(r => {
      r.actions.forEach(a => {
        const name = r.name + ' - ' + a.description
        applicableRefactorsMap[name] = { refactor: r, action: a }
      })
    })
    return Object.keys(applicableRefactorsMap)
  }

  async getChildren(node: tsa.Node | undefined, options: ProjectManagerOptions) {
    const target = (node || this.currentSourceFile)
    let children: tsa.Node[]
    if (options.mode === 'getChildren') {
      children = target.getChildren()
    }
    else {
      children = []
      target.forEachChild(c => children.push(c))
    }
    return children
  }


	getNodeInSelection(selection: vscode.Selection): tsa.Node|undefined {
    return this.currentSourceFile.getDescendantAtPos(vscode.window.activeTextEditor.document.offsetAt(selection.anchor))
	}
}