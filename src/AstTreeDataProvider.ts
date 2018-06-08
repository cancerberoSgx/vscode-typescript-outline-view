import * as path from 'path';
import * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { ProjectManager } from './ProjectManager';
import { getNodeName, getChildren, getNodeInSelection } from './AstUtil';
import { ProjectManagerOptions, Settings, readSettings } from './extension';

export class AstTreeDataProvider implements vscode.TreeDataProvider<tsa.Node> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<tsa.Node | null> = new vscode.EventEmitter<tsa.Node | null>();
	readonly onDidChangeTreeData: vscode.Event<tsa.Node | null> = this._onDidChangeTreeData.event;

	private editor: vscode.TextEditor|undefined;
	private project: ProjectManager;
	private projectOptions: ProjectManagerOptions = {
		mode: 'forEachChildren',
		// showSourceFiles: false
	}
	private settings: Settings
	treeView: vscode.TreeView<tsa.Node>
	
	constructor(private context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		this.settings = readSettings()
		vscode.workspace.onDidChangeConfiguration(() => {
			this.settings = readSettings()
		});
		this.project = new ProjectManager()
		vscode.window.onDidChangeTextEditorSelection(e => this.onTextEditorSelectionChanged())

		this.treeView = vscode.window.createTreeView('tsAstOutline', { treeDataProvider: this })
		this.onActiveEditorChanged();

		this.editor = vscode.window.activeTextEditor;
	}

	// TREEVIEW STUFF

	async getChildren(node?: tsa.Node): Promise<tsa.Node[]> {
		await this.project.refresh()
		return getChildren(node, this.projectOptions, this.project.currentSourceFile)
	}

	getParent(node: tsa.Node): tsa.Node {
		return node.getParent() || this.project.currentSourceFile
	}



	//ACTIONS

	async changeMode() {
		this.projectOptions.mode = this.projectOptions.mode === 'getChildren' ? 'forEachChildren' : 'getChildren'
		await this.refresh()
	}


	async rename(node: tsa.Node) {
		//TODO: delegate in projectmanager : this.project.nodeCanBeRenamed(node) and 
		if(!(node as any).rename){
			return await vscode.window.showInformationMessage('Sorry, this node doesn\'t support rename operation.')
		}
		const value = await vscode.window.showInputBox({ placeHolder: 'Enter new name' })
		if (value) {
			//TODO: delegate in projectmanager : this.project.rename(node)
			(node as any).rename(value)
			this.project.save()
			await this.refresh()
		}
	}

	async refactorNode(node: tsa.Node) {
		const refactors = await this.project.getRefactorsFor(node)
		if (refactors && refactors.length) {
			const selected = await vscode.window.showQuickPick(refactors, { canPickMany: false })
			vscode.window.showErrorMessage('Operation not implemented yet, sorry - WIP')
			console.log('TODO: selected: '+selected);//TODO: implement this - how to trigger refactor programmatically ? - delegate in project manager - this.project.applyRefactor(selected)
		}
	}

	async removeNode(node: tsa.Node) {
		vscode.window.showErrorMessage('Operation not implemented yet, sorry - WIP')
	}

	async addChild(node: tsa.Node) {
		vscode.window.showErrorMessage('Operation not implemented yet, sorry - WIP')
	}



	// EDITOR EVENT HANDLERS

	private async onActiveEditorChanged() {
		await this.project.refresh()
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'typescript' || vscode.window.activeTextEditor.document.languageId === 'javascript';
				vscode.commands.executeCommand('setContext', 'tsAstOutlineEnabled', enabled);
				if (enabled) {
					this.editor = vscode.window.activeTextEditor;
					this.refresh();
					this.onTextEditorSelectionChanged()
				}
			}
		} else {
			vscode.commands.executeCommand('setContext', 'tsAstOutlineEnabled', false);
		}
	}

	private async onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): Promise<void> {
		if(!this.editor){return}
		if (this.settings.autoRefresh && changeEvent.document.uri.toString() === this.editor.document.uri.toString()) {
			for (const change of changeEvent.contentChanges) {
				await this.project.refresh()
				this._onDidChangeTreeData.fire(this.project.currentSourceFile || null); // TODO: refined
			}
		}
	}

	private async onTextEditorSelectionChanged() {
		if(!this.editor){return}
		await this.project.refresh()
		const node = getNodeInSelection(this.editor.selection, this.project.currentSourceFile)
		if (node) {
			this.treeView.reveal(node, { select: true }) // TODO: select: true or false ? - configurable ? 
		}
	}



	// TREE VIEW EVENT HANDLERS
	
	select(node: tsa.Node) {
		if(!this.editor){return}
		const start = this.editor.document.positionAt(node.getFullStart())
		const end = this.editor.document.positionAt(node.getEnd())
		this.editor.selection = new vscode.Selection(start, end);
		this.editor.revealRange(new vscode.Range(start, end))
	}

	async refresh(node?: tsa.Node) {
		await this.project.refresh()
		this._onDidChangeTreeData.fire(node);
	}


	


	// TREE ITEM STUFF

	getTreeItem(node: tsa.Node): vscode.TreeItem {
		let hasChildren = node.getChildren() && node.getChildren().length
		let treeItem: vscode.TreeItem = new vscode.TreeItem(this.getLabel(node),
			// TODO: perhaps some special nodes like decls could be expanded
			// vscode.TreeItemCollapsibleState.Collapsed
			hasChildren ?
				// vscode.TreeItemCollapsibleState.Expanded : 
				vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None
		);
		treeItem.command = {
			command: 'extension.openJsonSelection',
			title: 'treeitem command title',
			tooltip: 'treeitem command tooltip',
			arguments: [node],
		};
		treeItem.iconPath = this.getIcon(node);
		treeItem.tooltip = (node as any).getName ? (node as any).getName() : node.getText().substring(0, Math.min(node.getText().length, 40))
		treeItem.contextValue = node.getKindName()
		return treeItem
	}

	private getIcon(node: tsa.Node): any { // TODO: decide icons
		if (tsa.TypeGuards.isStatement(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'boolean.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'boolean.svg'))
			}
		}
		if (tsa.TypeGuards.isLiteralExpression(node) || tsa.TypeGuards.isLiteralLikeNode(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'string.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'string.svg'))
			}
		}
		if (tsa.TypeGuards.isStatementedNode(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'number.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'number.svg'))
			}
		}
		return null;
	}

	private getLabel(node: tsa.Node): string {
		const name = getNodeName(node)||''
		return `${name}${(name ? '(' : '') + node.getKindName() + (name ? ')' : '')}`
	}



}