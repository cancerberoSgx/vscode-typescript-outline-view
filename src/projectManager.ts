// export class ProjectManager {

// 	async getCurrentSourceFile() {
// 		if (!vscode.window.activeTextEditor) {
// 			return
// 		}
// 		if (!this.project) {
// 			const files = await vscode.workspace.findFiles('**/tsconfig.json')
// 			const tsconfig = files[0].fsPath//TODO: check null or more than one		
// 			// console.log(vscode.window.activeTextEditor.document.fileName, tsconfig)
// 			this.lastFileName = vscode.window.activeTextEditor.document.fileName
// 			try {
// 				this.project = new Project({ tsConfigFilePath: tsconfig })
// 			} catch (error) {
// 				debugger //TODO: log
// 			}
// 		}
// 		if (!this.currentSourceFile || this.lastFileName !== vscode.window.activeTextEditor.document.fileName) {
// 			this.lastFileName = vscode.window.activeTextEditor.document.fileName
// 			try {
// 				this.currentSourceFile= this.project.getSourceFile(this.lastFileName)
// 				if (!this.currentSourceFile) {// not in tsa project (new file)
// 					this.currentSourceFile = this.project.createSourceFile(this.lastFileName, vscode.window.activeTextEditor.document.getText())
// 				} else if (vscode.window.activeTextEditor.document.isDirty){
// 					this.currentSourceFile.replaceWithText(vscode.window.activeTextEditor.document.getText())
// 				}
// 			} catch (error) {
// 				debugger //TODO: log
// 			}	
// 		}
// 		return Promise.resolve()
// 	}


// }