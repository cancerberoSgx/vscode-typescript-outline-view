
import * as tsa from 'ts-simple-ast';
import * as vscode from 'vscode';
import { getNodeName } from './AstUtil';
import { join } from 'path'
import { State } from './AstTreeDataProvider';

export class AstTreeItem extends vscode.TreeItem {
	private node: tsa.Node
	private context: vscode.ExtensionContext
	private state: State

	constructor(node: tsa.Node, context: vscode.ExtensionContext, state: State) {
		super('', vscode.TreeItemCollapsibleState.None)
		this.node = node
		this.context = context
		this.state = state
		this.init()
	}


	private init() {
		const hasChildren = !!this.node.getChildren().length
		this.label = this.getLabel(this.node)
		this.collapsibleState = hasChildren && !this.state.collapseAll ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
		this.command = {
			command: 'tsAstOutline.selectTreeItem',
			title: 'treeitem command title',
			tooltip: 'treeitem command tooltip',
			arguments: [this.node],
		};
		this.iconPath = this.getIcon(this.node)
		this.tooltip = this.node.getText().substring(0, Math.min(this.node.getText().length, 40))
		this.contextValue = this.node.getKindName()
	}

	private getIcon(node: tsa.Node): any {
		if (tsa.TypeGuards.isInterfaceDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'interface.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'interface.svg'))
			}
		}
		else if (tsa.TypeGuards.isClassDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'class.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'class.svg'))
			}
		}
		else if (tsa.TypeGuards.isImportDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'import.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'import.svg'))
			}
		}
		else if (tsa.TypeGuards.isMethodDeclaration(node) || tsa.TypeGuards.isMethodSignature(node) ||
			tsa.TypeGuards.isFunctionDeclaration(node) || tsa.TypeGuards.isFunctionLikeDeclaration(node) || tsa.TypeGuards.isFunctionExpression(node) || tsa.TypeGuards.isFunctionTypeNode(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'method.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'method.svg'))
			}
		}
		else if (tsa.TypeGuards.isPropertyDeclaration(node) || tsa.TypeGuards.isPropertyDeclaration(node) ||
			tsa.TypeGuards.isPropertySignature(node) || tsa.TypeGuards.isPropertyNamedNode(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'property.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'property.svg'))
			}
		}
		else if (tsa.TypeGuards.isBooleanLiteral(node) || tsa.TypeGuards.isBooleanKeyword(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'boolean.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'boolean.svg'))
			}
		}
		else if (tsa.TypeGuards.isLiteralExpression(node) || tsa.TypeGuards.isLiteralLikeNode(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'string.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'string.svg'))
			}
		}
		else if (tsa.TypeGuards.isNumberKeyword(node) || tsa.TypeGuards.isNumericLiteral(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'number.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'number.svg'))
			}
		}
		else if (tsa.ts.isTypeOperatorNode(node.compilerNode)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'operator.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'operator.svg'))
			}
		}
		else if (tsa.TypeGuards.isNamespaceDeclaration(node)) {
			return {
				light: this.context.asAbsolutePath(join('resources', 'light', 'namespace.svg')),
				dark: this.context.asAbsolutePath(join('resources', 'dark', 'namespace.svg'))
			}
		}
		return null;
	}

	private getLabel(node: tsa.Node, kindName: boolean = true): string {
		const name = getNodeName(node) || ''
		const kindNameString = ` ${!name ? '' : '('}${node.getKindName()}${!name ? '' : ')'}`
		return `${name}${kindNameString}`
	}
}