import * as path from 'path';
import * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { ProjectManager, ProjectManagerOptions } from './projectManager';

export class JsonOutlineProvider implements vscode.TreeDataProvider<tsa.Node> {
	private _onDidChangeTreeData: vscode.EventEmitter<tsa.Node | null> = new vscode.EventEmitter<tsa.Node | null>();
	readonly onDidChangeTreeData: vscode.Event<tsa.Node | null> = this._onDidChangeTreeData.event;

	// private currentMode: 'getChildren' | 'forEachChildren' = 'forEachChildren'
	private editor: vscode.TextEditor;
	private autoRefresh: boolean = true;
	private project: ProjectManager;
	private projectOptions: ProjectManagerOptions = {
		mode: 'forEachChildren',
		showSourceFiles: false
	}
	treeView: vscode.TreeView<tsa.Node>
	constructor(private context: vscode.ExtensionContext) {



		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		vscode.workspace.onDidChangeConfiguration(() => {
			this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		});
		this.onActiveEditorChanged();
		this.project = new ProjectManager()
		vscode.window.onDidChangeTextEditorSelection(e => this.onTextEditorSelectionChanged(e))


	this.treeView = vscode.window.createTreeView('jsonOutline', {treeDataProvider: this})

	}



	// TREEVIEW STUFF

	async getChildren(node?: tsa.Node): Promise<tsa.Node[]> {
		await this.project.refresh()
		return this.project.getChildren(node, this.projectOptions)
	}
	getParent(node: tsa.Node): tsa.Node {
		return node.getParent()||this.project.currentSourceFile
	}



	//ACTIONS

	async refresh(node?: tsa.Node) {
		await this.project.refresh()
		this._onDidChangeTreeData.fire(node);
	}

	async changeMode() {
		this.projectOptions.mode = this.projectOptions.mode === 'getChildren' ? 'forEachChildren' : 'getChildren'
		await this.refresh()
	}

	select(node: tsa.Node) {
		const start = this.editor.document.positionAt(node.getFullStart())
		const end = this.editor.document.positionAt(node.getEnd())
		this.editor.selection = new vscode.Selection(start, end);
		this.editor.revealRange(new vscode.Range(start, end))
	}

	async rename(node: tsa.Node) {
		const value = await vscode.window.showInputBox({ placeHolder: 'Enter the new name' })
		if (value) {
			this.editor.edit(editBuilder => {
				// const range = new vscode.Range(this.editor.document.positionAt(propertyNode.node), this.editor.document.positionAt(propertyNode.node + propertyNode.length));
				// editBuilder.replace(range, `"${value}"`);
				// setTimeout(() => {
				// 	this.parseTree();
				// 	this.refresh(node);
				// }, 100)
			});
		}
	}

	async refactorNode(node: tsa.Node) {
		const refactors = await this.project.getRefactorsFor(node)
		if (refactors && refactors.length) {
			const selected = await vscode.window.showQuickPick(refactors, { canPickMany: false })
		}
	}





	// EDITOR EVENT HANDLERS

	private onActiveEditorChanged(): void {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'typescript' || vscode.window.activeTextEditor.document.languageId === 'javascript';
				vscode.commands.executeCommand('setContext', 'jsonOutlineEnabled', enabled);
				if (enabled) {
					this.editor = vscode.window.activeTextEditor;
					this.refresh();
				}
			}
		} else {
			vscode.commands.executeCommand('setContext', 'jsonOutlineEnabled', false);
		}
	}

	private async onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): Promise<void> {
		if (this.autoRefresh && changeEvent.document.uri.toString() === this.editor.document.uri.toString()) {
			for (const change of changeEvent.contentChanges) {
				await this.project.refresh()
				this._onDidChangeTreeData.fire(this.project.currentSourceFile || null); // TODO: refined
			}
		}
	}

	private onTextEditorSelectionChanged(event) {
		const node = this.project.getNodeInSelection(this.editor.selection)
		if(node){
			this.treeView.reveal(node, {select: false}) // TODO: select: true or false ? - configurable ? 
		}
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
		return node.getKindName() // TODO: decide labels
	}



}