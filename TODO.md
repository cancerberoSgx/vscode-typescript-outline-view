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

## Testing 

 * test on very big files. and very big projects
 * work on changes not savedto fs ? 
 * is tsa well sync when working in the editor (open close, save - edit lots of files, etc ) ? 


# Refactor

 * move drag&drop node
 * change order or childs (dragdrop)
 * show refactor suggestions (like proactive's) by right clicking node - call languageservice getRefactorList() for that node using tsa.
 * rename node
 * remove : if tsa.Node.remove user can right click node and remove or by pressing supr. 




# DONEs

 * two modes getChildren and forEAchChildren