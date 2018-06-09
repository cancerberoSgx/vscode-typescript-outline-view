# WIP - not ready for production, yet

Please wait a couple of days - when I consider ready I will remove this banner. Thanks. 

# What 

Adds a view in explorer panel that shows the Abstract Syntax Tree of active TypeScript or JavaScript editor.
 * automatic refresh enabled by default (configurable
 * scroll/cursor/edits bind from source code to the AST view. 
 * Node filtering by name, kind, or text
 * Different AST view modes
 * AST manipulation:
    * remove node
    * add child node
    * rename node
    * move node
    * apply code refactor / fixes available for that node
    * format node's code

# Screencast

**Taken only after two days of work - very WIP** Just for you to have an idea what's this all about

![WIP](https://github.com/cancerberoSgx/vscode-typescript-outline-view/raw/master/doc-assets/typescript-ast-demo1.gif)


   
## Currently

 * tested on very large files and very large projects and perform OK
 * auto-refresh is enabled by default - but if you don's want to have the extra performance overhead (on large
   projects perhaps) you can disable it on settings and click the refresh button or toggle refresh command
   when you need it
   

# TODO - ROADMAP

https://cancerberosgx.visualstudio.com/_git/typescript-ast-outline?path=%2FTODO.md&version=GBmaster



# CHANGELOG

https://cancerberosgx.visualstudio.com/_git/typescript-ast-outline?path=%2FCHANGELOG.md&version=GBmaster


# Motivation

this is a research project that tries to investigate how well ts-simple-ast works in conjunction with vscode -
and particularly its tree-view 

originally as a simple ts/js outline view - but now that vscode as its own outline view - will have other
objectives - mostly to be a ast representation - configurable, filtrable and manipulable - you can activate
refactors, rename, remove, formatting on individual ast nodes.

on going project very new -WIP