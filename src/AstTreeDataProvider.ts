import * as path from 'path';
import * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { ProjectManager } from './ProjectManager';
import { getNodeName, getChildren, getNodeInSelection } from './AstUtil';
import { State, Settings, readSettings } from './extension';

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
	private projectOptions: State 
	private settings: Settings
	private treeView: vscode.TreeView<tsa.Node>
	
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
		this.projectOptions = {
			autoRefresh: this.settings.autoRefresh,
			mode: 'forEachChildren'
		}
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

	private nodeDontSupportActionMessage = (actionName:string)=>`Sorry, this node doesn\'t support ${actionName}.\nPerhaps try with an ancestor instead ?`
	
	async toggleASTMode() {
		this.projectOptions.mode = this.projectOptions.mode === 'getChildren' ? 'forEachChildren' : 'getChildren'
		await this.refresh()
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
			// console.log('TODO: selected: '+selected);//TODO: implement this - how to trigger refactor programmatically ? - delegate in project manager - this.project.applyRefactor(selected)
		}
	}

	async removeNode(node: tsa.Node) {
		if(!this.project.nodeCanBeRemoved(node)){
			return await vscode.window.showErrorMessage(this.nodeDontSupportActionMessage('rename'))
		}
		this.project.removeNode(node)
		await this.refresh()
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
	// TODO: move this to AstTreeItem.ts

	getTreeItem(node: tsa.Node): vscode.TreeItem {
		const hasChildren = !!node.getChildren().length
		let treeItem: vscode.TreeItem = new vscode.TreeItem(this.getLabel(node), hasChildren ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
			// TODO: perhaps some special nodes like decls could be expanded  vscode.TreeItemCollapsibleState.Collapsed , vscode.TreeItemCollapsibleState.Expanded :  hasChildren ?	vscode.TreeItemCollapsibleState.Collapsed	: node.TreeItemCollapsibleState.None
		treeItem.command = {
			command: 'tsAstOutline.selectTreeItem',
			title: 'treeitem command title',
			tooltip: 'treeitem command tooltip',
			arguments: [node],
		};
		treeItem.iconPath = this.getIcon(node)
		treeItem.tooltip = node.getText().substring(0, Math.min(node.getText().length, 40))
		treeItem.contextValue = node.getKindName()
		return treeItem
	}

	private getIcon(node: tsa.Node): any {
		if (tsa.TypeGuards.isInterfaceDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'interface.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'interface.svg'))
			}
		}
		else if (tsa.TypeGuards.isClassDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'class.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'class.svg'))
			}
		}
		else if (tsa.TypeGuards.isImportDeclaration(node)) {	
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'import.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'import.svg'))
			}
		}
		else if (tsa.TypeGuards.isMethodDeclaration(node)||tsa.TypeGuards.isMethodSignature(node)||
		tsa.TypeGuards.isFunctionDeclaration(node)||tsa.TypeGuards.isFunctionLikeDeclaration(node)||tsa.TypeGuards.isFunctionExpression(node)||tsa.TypeGuards.isFunctionTypeNode(node)) {	
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'method.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'method.svg'))
			}
		}
		else if (tsa.TypeGuards.isPropertyDeclaration(node)||tsa.TypeGuards.isPropertyDeclaration(node)||
		tsa.TypeGuards.isPropertySignature(node)||tsa.TypeGuards.isPropertyNamedNode(node)) {	
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'property.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'property.svg'))
			}
		}
		else if (tsa.TypeGuards.isBooleanLiteral(node)||tsa.TypeGuards.isBooleanKeyword(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'boolean.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'boolean.svg'))
			}
		}
		else if (tsa.TypeGuards.isLiteralExpression(node) || tsa.TypeGuards.isLiteralLikeNode(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'string.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'string.svg'))
			}
		}
		else if (tsa.TypeGuards.isNumberKeyword(node) || tsa.TypeGuards.isNumericLiteral(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'number.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'number.svg'))
			}
		}
		else if (tsa.ts.isTypeOperatorNode(node.compilerNode)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'operator.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'operator.svg'))
			}
		}
		else if (tsa.TypeGuards.isNamespaceDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'namespace.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'namespace.svg'))
			}
		}
		return null;
	}

	private getLabel(node: tsa.Node, kindName: boolean = true): string {
		const name = getNodeName(node)||''
		const kindNameString = ` ${!name ? '' : '('}${node.getKindName()}${!name ? '' : ')'}`
		return `${name}${kindNameString}`
	}

}
