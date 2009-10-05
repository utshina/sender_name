/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: options file
 *
 */

(function () {

    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        
	SenderName.Options = {
	    onLoad: function () {
		return;
		const list = document.getElementById('columns.list');
		var treeitem = document.createElement("treeitem");
		var treerow = document.createElement("treerow");
		var enabled = document.createElement("treecell");
		enabled.setAttribute("id", "treecell.column0.enabled");
		enabled.setAttribute("value", true);
		enabled.setAttribute("preference", "column0.enabled");
		treerow.appendChild(enabled);
		for each (var label in ["Sender Name", "From", "displayName", ""]) {
		    var treecell = document.createElement("treecell");
		    treecell.setAttribute("label", label);
		    treerow.appendChild(treecell);
		}
		treeitem.appendChild(treerow);
		list.appendChild(treeitem);
	    },
	};


    } // end namespace

})();
