import * as vscode from 'vscode';

import { JsonOutlineProvider } from './outline'

export function activate(context: vscode.ExtensionContext) {

	const jsonOutlineProvider = new JsonOutlineProvider(context);
	vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
	vscode.commands.registerCommand('jsonOutline.changeMode', () => jsonOutlineProvider.changeMode());
	vscode.commands.registerCommand('jsonOutline.refreshNode', node => jsonOutlineProvider.refresh(node));
	vscode.commands.registerCommand('jsonOutline.renameNode', node => jsonOutlineProvider.rename(node));
	vscode.commands.registerCommand('jsonOutline.refactorNode', node => jsonOutlineProvider.refactorNode(node));
	vscode.commands.registerCommand('jsonOutline.removeNode', node => jsonOutlineProvider.removeNode(node));
	vscode.commands.registerCommand('jsonOutline.addChild', node => jsonOutlineProvider.addChild(node));
	vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));

}
