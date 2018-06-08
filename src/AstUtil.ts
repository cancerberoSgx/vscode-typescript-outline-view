import { Node, SyntaxKind, SourceFile } from "ts-simple-ast";
import * as vscode from 'vscode';
import { ProjectManagerOptions } from "./extension";

export function getNodeName(node: Node): string | undefined {
  return (node as any).getName ? (node as any).getName() :
    node.getKind() === SyntaxKind.Identifier ? node.getText() : undefined
}

export async function getChildren(node: Node | undefined, options: ProjectManagerOptions, defaultTarget: Node) {
  const target = (node || defaultTarget)
  if (!target) {
    return []
  }
  let children: Node[]
  if (options.mode === 'getChildren') { 
    children = target.getChildren()
  }
  else {
    children = []
    target.forEachChild(c => children.push(c))
  }
  return children
}

export function getNodeInSelection(selection: vscode.Selection, currentSourceFile: SourceFile): Node | undefined {
  if (!currentSourceFile) {
    throw new Error('getNodeInSelection() called before refresh()')
  }
  if (!vscode.window.activeTextEditor) {
    return undefined
  }
  return currentSourceFile.getDescendantAtPos(vscode.window.activeTextEditor.document.offsetAt(selection.anchor))
}