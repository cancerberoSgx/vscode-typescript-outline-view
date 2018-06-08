import * as vscode from 'vscode';
import { AstTreeDataProvider } from './AstTreeDataProvider'

export function activate(context: vscode.ExtensionContext) {
	const tsAstOutlineProvider = new AstTreeDataProvider(context);

	vscode.commands.registerCommand('tsAstOutline.refresh', () => tsAstOutlineProvider.refresh());
	vscode.commands.registerCommand('tsAstOutline.changeMode', () => tsAstOutlineProvider.changeMode());
	vscode.commands.registerCommand('tsAstOutline.refreshNode', node => tsAstOutlineProvider.refresh(node));
	vscode.commands.registerCommand('tsAstOutline.renameNode', node => tsAstOutlineProvider.rename(node));
	vscode.commands.registerCommand('tsAstOutline.refactorNode', node => tsAstOutlineProvider.refactorNode(node));
	vscode.commands.registerCommand('tsAstOutline.removeNode', node => tsAstOutlineProvider.removeNode(node));
	vscode.commands.registerCommand('tsAstOutline.addChild', node => tsAstOutlineProvider.addChild(node));
	vscode.commands.registerCommand('extension.openJsonSelection', range => tsAstOutlineProvider.select(range));
}

export function readSettings(): Settings {
	return {
		autoRefresh: vscode.workspace.getConfiguration('tsAstOutline').get('autorefresh')||false
	}
}

export interface Settings {
	autoRefresh: boolean
}

export interface State { 
  mode: 'getChildren' | 'forEachChildren'
	/** user can toggle auto-refresh */
	autoRefresh: boolean
}

