import * as path from 'path';
import Project, * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';

export class JsonOutlineProvider implements vscode.TreeDataProvider<tsa.Node> {

	lastFileName: string;
	private _onDidChangeTreeData: vscode.EventEmitter<tsa.Node | null> = new vscode.EventEmitter<tsa.Node | null>();
	readonly onDidChangeTreeData: vscode.Event<tsa.Node | null> = this._onDidChangeTreeData.event;

	private text: string;
	private editor: vscode.TextEditor;
	private autoRefresh: boolean = true;

	constructor(private context: vscode.ExtensionContext) {
		vscode.window.onDidChangeActiveTextEditor(() => this.onActiveEditorChanged());
		vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChanged(e));
		this.parseTree();
		this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		vscode.workspace.onDidChangeConfiguration(() => {
			this.autoRefresh = vscode.workspace.getConfiguration('jsonOutline').get('autorefresh');
		});
		this.onActiveEditorChanged();
	}

	refresh(offset?: tsa.Node): void {
		this.parseTree();
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire();
		}
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
				this._onDidChangeTreeData.fire(this.currentSourceFile || null); // TODO: refined
			}
		}
	}

	private async parseTree(): Promise<any> {
		this.editor = vscode.window.activeTextEditor;
		return this.getCurrentSourceFile()
	}

	private project: tsa.Project
	private currentSourceFile: tsa.SourceFile

	private async getCurrentSourceFile(): Promise<tsa.SourceFile> {
		if (!this.project) {
			const files = await vscode.workspace.findFiles('**/tsconfig.json')
			const tsconfig = files[0].fsPath//TODO: check null or more than one		
			// console.log(vscode.window.activeTextEditor.document.fileName, tsconfig)
			this.lastFileName = vscode.window.activeTextEditor.document.fileName
			try {
				this.project = new Project({ tsConfigFilePath: tsconfig })
			} catch (error) {
				debugger //TODO: log
			}
		}
		if (!this.currentSourceFile || this.lastFileName !== vscode.window.activeTextEditor.document.fileName) {
			this.lastFileName = vscode.window.activeTextEditor.document.fileName
			try {
				this.currentSourceFile = this.project.getSourceFileOrThrow(this.lastFileName)
			} catch (error) {
				debugger //TODO: log
			}
		}
		return Promise.resolve(this.currentSourceFile)
	}


	async getChildren(offset?: tsa.Node): Promise<tsa.Node[]> {
		await this.getCurrentSourceFile()
		const target = (offset||this.currentSourceFile)
		console.log('getChildren length:' + target.getChildren().length);

		return Promise.resolve(target.getChildren())
		// if (offset) {
		// 	const path = json.getLocation(this.text, offset).path
		// 	const node = json.findNodeAtLocation(this.tree, path);
		// 	return Promise.resolve(this.getChildrenOffsets(node));
		// } else {
		// 	return Promise.resolve(this.tree ? this.getChildrenOffsets(this.tree) : []);
		// }
		// return Promise.resolve([1])
	}

	counter = 0
	getTreeItem(node: tsa.Node): vscode.TreeItem {
		let hasChildren = node.getChildren()&& node.getChildren().length
		let treeItem: vscode.TreeItem = new vscode.TreeItem(this.getLabel(node), 
		// vscode.TreeItemCollapsibleState.Collapsed
		hasChildren ? 
		// vscode.TreeItemCollapsibleState.Expanded : // TODO: perhaps some special nodes like decls could be expanded
		vscode.TreeItemCollapsibleState.Collapsed
			: vscode.TreeItemCollapsibleState.None
		);
		treeItem.command = {
			command: 'extension.openJsonSelection',
			title: '',
			arguments: [node]
		};
		treeItem.iconPath = this.getIcon(node);
		return treeItem
	}



	select(node: tsa.Node) { 
		this.editor.selection = new vscode.Selection(vscode.window.activeTextEditor.document.positionAt(node.getFullStart()),vscode.window.activeTextEditor.document.positionAt(node.getEnd()));
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



	rename(offset: tsa.Node): void {
		vscode.window.showInputBox({ placeHolder: 'Enter the new label' })
			.then(value => {
				if (value !== null && value !== undefined) {
					this.editor.edit(editBuilder => {
						// const path = json.getLocation(this.text, offset).path
						// let propertyNode = json.findNodeAtLocation(this.tree, path);
						// if (propertyNode.parent.type !== 'array') {
						// 	propertyNode = propertyNode.parent.children[0];
						// }
						// const range = new vscode.Range(this.editor.document.positionAt(propertyNode.offset), this.editor.document.positionAt(propertyNode.offset + propertyNode.length));
						// editBuilder.replace(range, `"${value}"`);
						// setTimeout(() => {
						// 	this.parseTree();
						// 	this.refresh(offset);
						// }, 100)
					});
				}
			});
	}
}