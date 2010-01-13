/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: options file
 *
 */

const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
with (SenderName) {
        
	SenderName.Options = {
        prefpane: document.getElementById("prefpane.displayAttribute"),
        tree: document.getElementById("options.tree"),
        treechildren: document.getElementById("options.treechildren"),
        // menulist
        enabled: document.getElementById("options.enabled"),
        field: document.getElementById("options.field"),
        attr: document.getElementById("options.attr"),
        label: document.getElementById("options.label"), 
        format: document.getElementById("options.format"),

        findMenuItem: function (menulist, key) {
            for each (var menuitem in menulist.firstChild.childNodes) {
                if (menuitem.value == key)
                    return menuitem;
            }
            return null;
        },

        onSelect: function () {
            var index = this.tree.currentIndex; if (index < 0) return;
            var treecells = this.tree.contentView.getItemAtIndex(index).firstChild.childNodes;

            this.enabled.checked = treecells[0].getAttribute("value");
            this.field.selectedItem = this.findMenuItem(this.field, treecells[1].getAttribute("value"));
            this.attr.selectedItem = this.findMenuItem(this.attr, treecells[2].getAttribute("value"));
            this.label.value = treecells[3].getAttribute("label");
            this.format.value = treecells[4].getAttribute("label");
        },

        setMenuValue: function (treecell, value, menulist) {
            var label = this.findMenuItem(menulist, value).label;
            treecell.setAttribute("label", label);
            treecell.setAttribute("value", value);
        },

        setTreeItem: function (treeitem, values) {
            var treecells = treeitem.firstChild.childNodes;
            treecells[0].setAttribute("value", values[0]);
            this.setMenuValue(treecells[1], values[1], this.field);
            this.setMenuValue(treecells[2], values[2], this.attr);
            treecells[3].setAttribute("label", values[3]);
            treecells[4].setAttribute("label", values[4]);
        },

        createTreeItem: function () {
            var treeitem = document.createElement("treeitem");
            var treerow = document.createElement("treerow");
            for (var i = 0; i < 5; i++)
                treerow.appendChild(document.createElement("treecell"));
            treeitem.appendChild(treerow);
            return treeitem;
        },

        onLoad: function () {
            const pref = Preference.getLocalizedString("columns");
            const columns = eval(pref);
            for (var i = 0; i < columns.length; i++) {
                var values = [
                    columns[i].enabled, columns[i].field, columns[i].attr, columns[i].label, columns[i].format,
                ];
                var treeitem = this.createTreeItem();
                this.setTreeItem(treeitem, values);
                this.treechildren.appendChild(treeitem);
            }
            this.tree.view.selection.select(0);
        },

        onNew: function () {
            var treeitem = this.createTreeItem();
            var values = [
                "true", "sender", "displayName", "", ""
            ];

            this.setTreeItem(treeitem, values);
            this.treechildren.appendChild(treeitem);
            this.tree.view.selection.select(this.tree.view.rowCount - 1);
            this.prefpane.userChangedValue(this.tree);
        },

        onDelete: function () {
            var index = this.tree.currentIndex; if (index < 0) return;
            var treeitem = this.treechildren.childNodes.item(index);
            this.treechildren.removeChild(treeitem);
            if (index > this.tree.view.rowCount - 1)
                index--;
            this.tree.view.selection.select(index);
            this.prefpane.userChangedValue(this.tree);
        },

        onApply: function () {
            var index = this.tree.currentIndex; if (index < 0) return;
            var treeitem = this.tree.contentView.getItemAtIndex(index);
            var values = [
                this.enabled.checked,
                this.field.selectedItem.value,
                this.attr.selectedItem.value,
                this.label.value,
                this.format.value,
            ];

            this.setTreeItem(treeitem, values);
            this.prefpane.userChangedValue(this.tree);
        },

        onSelectAttr: function () {
            this.label.value = this.attr.selectedItem.label;
        },

        onSyncToPreference: function () {
            var columns = new Array;
            const n = this.tree.view.rowCount;
            for (var i = 0; i < n; i++) {
                var treecells = this.tree.contentView.getItemAtIndex(i).firstChild.childNodes;
                var column = new Object;
                column.enabled = treecells[0].getAttribute("value") == "true" ? true : false;
                column.field = treecells[1].getAttribute("value");
                column.attr = treecells[2].getAttribute("value");
                column.label = treecells[3].getAttribute("label");
                column.format = treecells[4].getAttribute("label")
                columns.push(column);
            }
            return uneval(columns);
        },
	};


} // end namespace
