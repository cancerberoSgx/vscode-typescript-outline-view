
import Project, * as tsa from 'ts-simple-ast';

import * as vscode from 'vscode';

export interface ProjectManagerOptions {
mode:  'getChildren' | 'forEachChildren'
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
			const tsconfig = files[0].fsPath//TODO: check null or more than one		
			// console.log(vscode.window.activeTextEditor.document.fileName, tsconfig)
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
				this._currentSourceFile= this.project.getSourceFile(this.lastFileName)
				if (!this.currentSourceFile) {// not in tsa project (new file)
					this._currentSourceFile = this.project.createSourceFile(this.lastFileName, vscode.window.activeTextEditor.document.getText())
				} else if (vscode.window.activeTextEditor.document.isDirty){
					this.currentSourceFile.replaceWithText(vscode.window.activeTextEditor.document.getText())
				}
			} catch (error) {
				debugger //TODO: log
			}	
		}
		return Promise.resolve()
  }
  

	async getRefactorsFor(node: tsa.Node) {
		const refactors = this.project.getLanguageService().compilerObject.getApplicableRefactors(this.currentSourceFile.getFilePath(), { pos: node.getPos(), end: node.getEnd() }, {})
		const applicableRefactorsMap = {}
		refactors.forEach(r => {
			r.actions.forEach(a => {
				const name = r.name + ' - ' + a.description
				applicableRefactorsMap[name] = { refactor: r, action: a }
			})
		})
		return Object.keys(applicableRefactorsMap)
	}
  
	async getChildren(node: tsa.Node|undefined, options: ProjectManagerOptions) {
    const target = (node || this.currentSourceFile)
    let children: tsa.Node[]
		// console.log('getChildren length:' + target.getChildren().length);
		if (options.mode=== 'getChildren') {
			children = target.getChildren()
		}
		else {
			children = []
			target.forEachChild(c => children.push(c))
    }
    return children
  }
}