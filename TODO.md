# TODO

# project

 * change name of the project to something like vscode-ts-js-ast-toolkit - the word AST must be there cause now vscode has a outline for ts and js
 * remove json stuff ids from everywhere 

# js

 * support js and projects without tsconfig and in that case create one for tsaproject. SHould we still use tsa ? or use other thing? we should use the same thing and also offer those ts refactors that apply. 

# Tree nodes

 * name of nodes ? content of nodes ? just kindname or also should consider getText() or identifiers & keywords ? 
 * icons
 * tooltips ?
 * dont miss any treenode feature

# Tree view

 * a third view that show all source files as root files ? (so i can move nodes between files ?)
 * filters ? how to put input text in the view ? filter by kindname, by identifier, etc. indexing ? 
 * expand all and collapse all
 * implement autorefresh by settings

# editor

 * when cursor changes in editor (code) the tree view should follow expanding and scrolling to that node. Make it configurable because of performance
 

## Testing 

 * test on very big files. and very big projects
 * work on changes not savedto fs ? 
 * is tsa well sync when working in the editor (open close, save - edit lots of files, etc ) ? 


# Refactor

 * move drag&drop node
 * change order or children (dragdrop)
 * rename node
 * remove : if tsa.Node.remove user can right click node and remove or by pressing supr. https://dsherret.github.io/ts-simple-ast/manipulation/formatting 
 * formatting action usign : https://dsherret.github.io/ts-simple-ast/manipulation/formatting - get the
   preferences from vscode settings

# nice to have

 * mark tree nodes which are contained by a error diagnostic
 * keybindings dor activating context menu or individual actions like remove - format, rename, refactor, etc



# DONEs

 * show refactor suggestions (like proactive's) by right clicking node - call languageservice getRefactorList() for that node using tsa.
 * two modes getChildren and forEAchChildren