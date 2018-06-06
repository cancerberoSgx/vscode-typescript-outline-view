import * as vscode from 'vscode';
import * as path from 'path';

export class JsonOutlineProvider implements vscode.TreeDataProvider<number> {

	private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
	readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

	// private text: string;
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

	refresh(offset?: number): void {
		this.parseTree();
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire();
		}
	}

	rename(offset: number): void {
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

	private onActiveEditorChanged(): void {
		// debugger;
		if (vscode.window.activeTextEditor) {
			if (vscode.window.activeTextEditor.document.uri.scheme === 'file') {
				// debugger
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

	private onDocumentChanged(changeEvent: vscode.TextDocumentChangeEvent): void {
// debugger
		if (this.autoRefresh && changeEvent.document.uri.toString() === this.editor.document.uri.toString()) {
			for (const change of changeEvent.contentChanges) {
				// const path = json.getLocation(this.text, this.editor.document.offsetAt(change.range.start)).path;
				// path.pop();
				// const node = path.length ? json.findNodeAtLocation(this.tree, path) : void 0;
				// this.parseTree();
				// this._onDidChangeTreeData.fire(node ? node.offset : void 0);
			}
		}
	}

	private parseTree(): void {
		// this.text = '';
		// this.tree = null;
		this.editor = vscode.window.activeTextEditor;
		if (this.editor && this.editor.document) {
			// this.text = this.editor.document.getText();
			// debugger;
			// this.tree = json.parseTree(this.text);
		}
	}

	getChildren(offset?: number): Thenable<number[]> {
		// debugger;
		// if (offset) {
		// 	const path = json.getLocation(this.text, offset).path
		// 	const node = json.findNodeAtLocation(this.tree, path);
		// 	return Promise.resolve(this.getChildrenOffsets(node));
		// } else {
		// 	return Promise.resolve(this.tree ? this.getChildrenOffsets(this.tree) : []);
		// }
		return Promise.resolve([1])
	}

	counter: 0
	getTreeItem(offset: number): vscode.TreeItem {
		// debugger;
		return {
			label: 'seba'+offset+this.counter++, id: 'seba'+offset+this.counter++
		}
	}

	// select(range: vscode.Range) {
	// 	this.editor.selection = new vscode.Selection(range.start, range.end);
	// 	debugger
	// }

}