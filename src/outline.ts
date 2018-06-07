import * as path from 'path';
import Project, * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { ProjectManager } from './projectManager';

export class JsonOutlineProvider implements vscode.TreeDataProvider<tsa.Node> {

	private _onDidChangeTreeData: vscode.EventEmitter<tsa.Node | null> = new vscode.EventEmitter<tsa.Node | null>();
	readonly onDidChangeTreeData: vscode.Event<tsa.Node | null> = this._onDidChangeTreeData.event;

	private text: string;
	private editor: vscode.TextEditor;
	private autoRefresh: boolean = true;
	private project: ProjectManager;

	constructor(private context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		this.parseTree();
		this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		vscode.workspace.onDidChangeConfiguration(() => {
			this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		});
		this.onActiveEditorChanged();
		this.project = new ProjectManager()
		vscode.window.onDidChangeTextEditorVisibleRanges(e => console.log('onDidChangeTextEditorVisibleRanges', JSON.stringify(e)))
		
	}

	async refresh(node?: tsa.Node) {
		await this.parseTree();
		if (node) {
			this._onDidChangeTreeData.fire(node);
		} else {
			this._onDidChangeTreeData.fire();
		}
	}

	private currentMode: 'getChildren' | 'forEachChildren' = 'getChildren'
	async changeMode() {
		this.currentMode = this.currentMode === 'getChildren' ? 'forEachChildren' : 'getChildren'
		await this.parseTree();
		await this.refresh()
	}

	private onActiveEditorChanged(): void {
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				const enabled = vscode.window.activeTextEditor.document.languageId === 'typescript' || vscode.window.activeTextEditor.document.languageId === 'javascript';
				vscode.commands.executeCommand('setContext', 'jsonOutlineEnabled', enabled);
				if (enabled) {
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
				await this.parseTree();
				this._onDidChangeTreeData.fire(this.project.currentSourceFile || null); // TODO: refined
			}
		}
	}

	private async parseTree(): Promise<void> {
		this.editor = vscode.window.activeTextEditor;
		return await this.project.refresh()
	}


	async getChildren(node?: tsa.Node): Promise<tsa.Node[]> {
		await this.project.refresh()
		return  this.project.getChildren(node, {mode:this.currentMode })
	}

	// counter = 0
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



	select(node: tsa.Node) {
		const start = this.editor.document.positionAt(node.getFullStart())
		const end = this.editor.document.positionAt(node.getEnd())
		this.editor.selection = new vscode.Selection(start, end);
		this.editor.revealRange(new vscode.Range(start, end))
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



	async rename(node: tsa.Node) {
		const selected = await vscode.window.showQuickPick(this.project.getRefactorsFor(node), { canPickMany: false })
		console.log(selected)
		const value = await vscode.window.showInputBox({ placeHolder: 'Enter the new label' })
		// .then(value => {
		if (value) {
			this.editor.edit(editBuilder => {
				// const path = json.getLocation(this.text, node).path
				// let propertyNode = json.findNodeAtLocation(this.tree, path);
				// if (propertyNode.parent.type !== 'array') {
				// 	propertyNode = propertyNode.parent.children[0];
				// }
				// const range = new vscode.Range(this.editor.document.positionAt(propertyNode.node), this.editor.document.positionAt(propertyNode.node + propertyNode.length));
				// editBuilder.replace(range, `"${value}"`);
				// setTimeout(() => {
				// 	this.parseTree();
				// 	this.refresh(node);
				// }, 100)
			});
		}
		// });
	}


}