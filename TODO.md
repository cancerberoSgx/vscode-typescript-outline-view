# TODO

# issues
 * current screencast is too long, hard to follow and too big
 * when files are changed like in "rename" - tsa.sourcefiles gets outdated - une way of solving this is calling
refresh from filesystem(). also the general refresh button should perform updatefromfs() for each sourcefile and
also for each open editor dirty update sourcefile content from from there. 
 * remove should config before removing node by default - then that behavior could be configurable

# project / code 

 * move treenode responsibilities from dataprovider to asttreeitem

# js

 * support js and projects without tsconfig and in that case create one for tsaproject. SHould we still use tsa ? or use other thing? we should use the same thing and also offer those ts refactors that apply. 

# Tree nodes

 * name of nodes ? content of nodes ? just kindname or also should consider getText() or identifiers & keywords ? 
 * icons
 * tooltips ?
 * dont miss any treenode feature
 * what about modifiers - public private, static - should we give visual feedback?
 * mark tree nodes which are contained by a error diagnostic

# Tree view

 * a third view that show all source files as root files ? (so i can move nodes between files ?)
 * filters ? how to put input text in the view ? filter by kindname, by identifier, etc. indexing ? 
 * expand all and collapse all
 * implement autorefresh by settings
 * refresh general button should be "toggle auto refresh" and the action should be - refresh and toggle
   auto-refresh
 * toggle "hide kind names"
 * toggle hide unnamed nodes

# editor

 * when cursor changes in editor (code) the tree view should follow expanding and scrolling to that node. Make it configurable because of performance
 

## Testing 


# Refactor / actions

 * move drag&drop node (update - i dont think there an api for drag&drop - so probably will UX in two steps click -
   no drag drop.)
 * change order or children (dragdrop) (update - i dont think there an api for drag&drop - so probably will UX in two steps click -
   no drag drop.)
 * formatting action using : https://dsherret.github.io/ts-simple-ast/manipulation/formatting - get the
   preferences from vscode settings
 * addChild: one way could be : open a new temporary .ts file to the user with something like this: export
   const childNode: VariableDeclarationStructure = {} - it will have errors (cause of missing structure
   properties that user will have to fill manually) - when user saves this file or exec a command we can
   eval/import the structure and add it to the ast. We could ask which structure he wants to create
   showQuickPick where he select most relevant kind of nodes.
 * instead of offering all refactors and then tell the user rename/remove cannot be done - use context in
   commands , maintain a list of node kinds that support each action and dont offer an action on a node that
   doesnt support it.
 * keybindings dor activating context menu or individual actions like remove - format, rename, refactor, etc

# nice to have




# DONEs

 * show refactor suggestions (like proactive's) by right clicking node - call languageservice getRefactorList() for that node using tsa.
 * two modes getChildren and forEAchChildren
 * remove : if tsa.Node.remove user can right click node and remove or by pressing supr. https://dsherret.github.io/ts-simple-ast/manipulation/formatting 
 * rename node
	<!-- "enableProposedApi": true, -->
 * change name of the project to something like vscode-ts-js-ast-toolkit - the word AST must be there cause now vscode has a outline for ts and js
 * remove json stuff ids from everywhere 

 * test on very big files. and very big projects
 * test: work on changes not savedto fs ? 
 * test: is tsa well sync when working in the editor (open close, save - edit lots of files, etc ) ? 