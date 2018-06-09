import * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { ProjectManager } from './ProjectManager';
import { getChildren, getNodeInSelection, getNodeName } from './AstUtil';
import { Settings, readSettings } from './extension';
import { AstTreeItem } from './AstTreeItem';

/**
 * internal state of the tree view
 */
export interface State { 
  mode: 'getChildren' | 'forEachChildren'
	/** user can toggle auto-refresh */
	autoRefresh: boolean
	/** the current flag for collapseAll - internal */
	collapseAll: boolean
}

/**
 * this is the the most important class of this extension. It provides the data to the tree view. It delegates
 * AST-related responsibility to ProjectManager and ASTUtil. it delegate TreeItem information to AstTreeItem.
 * It handles handles all events - both users and editor's and install / manage mentioned tools.
 */
export class AstTreeDataProvider implements vscode.TreeDataProvider<tsa.Node> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<tsa.Node | null> = new vscode.EventEmitter<tsa.Node | null>();
	readonly onDidChangeTreeData: vscode.Event<tsa.Node | null> = this._onDidChangeTreeData.event;

	private editor: vscode.TextEditor|undefined;
	private project: ProjectManager;
	private state: State 
	private settings: Settings
	private treeView: vscode.TreeView<tsa.Node>
	
	constructor(private context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged())
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e))
		this.settings = readSettings()
		vscode.workspace.onDidChangeConfiguration(() => {
			this.settings = readSettings()
		})
		this.project = new ProjectManager()
		vscode.window.onDidChangeTextEditorSelection(e => this.onTextEditorSelectionChanged())

		this.treeView = vscode.window.createTreeView('tsAstOutline', { treeDataProvider: this })
		this.onActiveEditorChanged()

		this.editor = vscode.window.activeTextEditor
		this.state = {
			autoRefresh: this.settings.autoRefresh,
			mode: 'forEachChildren', 
			collapseAll: false
		}
	}

	// TREEVIEW STUFF

	async getChildren(node?: tsa.Node): Promise<tsa.Node[]> {
		await this.project.refresh()
		return getChildren(node, this.state, this.project.currentSourceFile)
	}

	getParent(node: tsa.Node): tsa.Node {
		return node.getParent() || this.project.currentSourceFile
	}

	getTreeItem(node: tsa.Node): vscode.TreeItem {
		return new AstTreeItem(node, this.context, this.state)
	}



	// ACTIONS (command implementations)

	private nodeDontSupportActionMessage = (actionName:string)=>`Sorry, this node doesn\'t support ${actionName}.
Perhaps try with an ancestor instead ?`
	
	async toggleASTMode() {
		this.state.mode = this.state.mode === 'getChildren' ? 'forEachChildren' : 'getChildren'
		await this.refresh()
	}

	async collapseAll() {
		debugger
		this.state.collapseAll = true
		await this.refresh()
		this.state.collapseAll = false
	}

	async rename(node: tsa.Node) {
		if(!this.project.nodeCanBeRenamed(node)){
			return await vscode.window.showInformationMessage(this.nodeDontSupportActionMessage('rename'))
		}
		const newName = await vscode.window.showInputBox({ placeHolder: 'Enter new name' })
		if (newName) {
			this.project.renameNode(node, newName)
			await this.refresh()
		}
	}

	async refactorNode(node: tsa.Node) {
		const refactors = await this.project.getRefactorsFor(node)
		if (refactors && refactors.length) {
			const selected = await vscode.window.showQuickPick(refactors, { canPickMany: false })
			vscode.window.showErrorMessage('Operation not implemented yet, sorry - WIP')
			// console.log('TODO: selected: '+selected);
			//TODO: implement this - how to trigger refactor programmatically ? - delegate in project manager - this.project.applyRefactor(selected)
		}
	}

	async removeNode(node: tsa.Node) {
		if(!this.project.nodeCanBeRemoved(node)){
			return await vscode.window.showErrorMessage(this.nodeDontSupportActionMessage('remove'))
		}
		const selected = await vscode.window.showQuickPick(['Yes', 'No'], { 
			canPickMany: false, 
			placeHolder: `Are you sure you want to remove ${getNodeName(node) || 'selected'} node ?`
		})
		if(selected === 'Yes') {
			this.project.removeNode(node)
			await this.refresh()
		}
	}

	async addChild(node: tsa.Node) {
		vscode.window.showErrorMessage('Operation not implemented yet, sorry - WIP')
	}




	// TREE VIEW EVENT HANDLERS
	
	select(node: tsa.Node) {
		if(!this.editor){debugger; return}
		const start = this.editor.document.positionAt(node.getFullStart())
		const end = this.editor.document.positionAt(node.getEnd())
		this.editor.selection = new vscode.Selection(start, end);
		this.editor.revealRange(new vscode.Range(start, end))
	}

	async refresh(node?: tsa.Node) {
		await this.project.refresh()
		this._onDidChangeTreeData.fire(node);
	}




	// EDITOR EVENT HANDLERS

	private async onActiveEditorChanged() {
		this.editor = undefined
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'typescript' || vscode.window.activeTextEditor.document.languageId === 'javascript';
				vscode.commands.executeCommand('setContext', 'tsAstOutlineEnabled', enabled);
				if (enabled) {
					this.editor = vscode.window.activeTextEditor;
					await this.project.refresh()
					await this.refresh();
					this.onTextEditorSelectionChanged()
				}
			}
		} else {
			vscode.commands.executeCommand('setContext', 'tsAstOutlineEnabled', false);
		}
	}

	private async onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): Promise<void> {
		if(!this.editor){debugger; return}
		if (this.settings.autoRefresh && changeEvent.document.uri.toString() === this.editor.document.uri.toString()) {
			for (const change of changeEvent.contentChanges) {
				await this.project.refresh()
				this._onDidChangeTreeData.fire(this.project.currentSourceFile || null); // TODO: refined
			}
		}
	}

	private async onTextEditorSelectionChanged() {
		if(!this.editor){debugger; return}
		await this.project.refresh()
		const node = getNodeInSelection(this.editor.selection, this.project.currentSourceFile)
		if (node) {
			this.treeView.reveal(node, { select: true }) // TODO: select: true or false ? - configurable ? 
		}
	}



}
