
		"menus": {
			"view/title": [
				{
					"command": "tsAstOutline.refresh",
					"when": "view == tsAstOutline",
					"group": "navigation"
				},
				{
					"command": "tsAstOutline.changeMode",
					"when": "view == tsAstOutline",
					"group": "navigation"
				},
				{
					"command": "tsAstOutline.toggleHideUnnamedNodes",
					"when": "view == tsAstOutline",
					"group": "2_workspace"
				},
				{
					"command": "tsAstOutline.toggleHideNodeKindNames",
					"when": "view == tsAstOutline",
					"group": "2_workspace"
				},
				{
					"command": "tsAstOutline.changeMode",
					"when": "view == tsAstOutline",
					"group": "3_compare"
				},
				{
					"command": "tsAstOutline.changeMode",
					"when": "view == tsAstOutline",
					"group": "4_search"
				},
				{
					"command": "tsAstOutline.changeMode",
					"when": "view == tsAstOutline",
					"group": "5_cutcopypaste"
				},
				{
					"command": "tsAstOutline.changeMode",
					"when": "view == tsAstOutline",
					"group": "7_modification"
				}
			],






	"explorer/context": [
				{
					"command": "tsAstOutline.refresh",
					"when": "view == tsAstOutline",
					"group":  "navigation@+1"
				}










// function test1(context: vscode.ExtensionContext){
	// vscode.commands.registerCommand('foo.bar', accessor =>{
		
	// })
// 	const _outlineDesc = <IViewDescriptor>{
// 		id: 'code.outline',
// 		name: localize('name', "Outline"),
// 		// ctor: OutlinePanel,
// 		// container: VIEW_CONTAINER,
// 		canToggleVisibility: true,
// 		hideByDefault: false,
// 		collapsed: true,
// 		order: 2,
// 		weight: 30
// 	};
	
// 	ViewsRegistry.registerViews([_outlineDesc]);
	
// 	CommandsRegistry.registerCommand('outline.focus', accessor => {
// 		let viewsService = accessor.get(IViewsService);
// 		return viewsService.openView(_outlineDesc.id, true);
// 	});
	
// 	MenuRegistry.addCommand({
// 		id: 'outline.focus',
// 		category: localize('category.focus', "File"),
// 		title: localize('label.focus', "Focus on Outline")
// 	});
	// }