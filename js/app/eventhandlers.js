var currentTree = null;

initRPCEventHandlers = function() {
	// Done when clicking the compile button at editor.
	ponos.RPCEventHandlers["GetTree"] = getTree;
}

getTree = function(result) {
	currentTree = result
	var treeObj = convertTree(result)
	$('#TreeView').treeview({
		data : treeObj
	});
}

// Helpers

// Get the nested object form from the serialized form of a tree.
function convertTree(treeList) {
	var treeW = {"cIdx" : 0, "tree" : []};
	while (treeW.cIdx < treeList.length) {
		treeW.tree.push(NodeToObj(treeW,treeList));
	}
	return treeW.tree;
}

function NodeToObj(treeW, treeList) {
	var node = treeList[treeW.cIdx];
	treeW.cIdx++;
	var obj = {};
	obj.text = node.Address
	if(node.Children.length > 0){
		obj.nodes = []
		for(var i = 0; i < node.Children.length; i++){
			var o = NodeToObj(treeW,treeList);
			obj.nodes.push(o);
		}
	}
	return obj;
}

function GetNodeData(idx){
	return currentTree[idx];
}