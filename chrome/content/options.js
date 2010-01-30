/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

// This script is used in its own window (no namespace conflict)
const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
with (SenderName) {
        
    SenderName.Options = {
        prefpane: document.getElementById("prefpane.columns"),
        tree: document.getElementById("options.tree"),
        treechildren: document.getElementById("options.treechildren"),

        enabled: document.getElementById("options.enabled"),
        field: document.getElementById("options.field"),
        attr: document.getElementById("options.attr"),
        label: document.getElementById("options.label"), 
        // format: document.getElementById("options.format"),

        findMenuItem: function (menulist, key) {
            for each (var menuitem in menulist.firstChild.childNodes) {
                if (typeof(menuitem.getAttribute) == "function" && menuitem.getAttribute("value") == key)
                    return menuitem;
            }
            return menulist.firstChild.firstChild;
        },

        onSelect: function () {
            const index = this.tree.currentIndex; if (index < 0) return;
            const treecells = this.tree.contentView.getItemAtIndex(index).firstChild.childNodes;

            this.enabled.setAttribute("checked", treecells[0].getAttribute("value"));
            this.field.selectedItem = this.findMenuItem(this.field, treecells[1].getAttribute("value"));
            this.attr.selectedItem = this.findMenuItem(this.attr, treecells[2].getAttribute("value"));
            this.label.setAttribute("value", treecells[3].getAttribute("label"));
            // this.format.setAttribute("value", treecells[4].getAttribute("label"));
        },

        setMenuValue: function (treecell, value, menulist) {
            const label = this.findMenuItem(menulist, value).label;
            treecell.setAttribute("label", label);
            treecell.setAttribute("value", value);
        },

        setTreeItem: function (treeitem, values) {
            const treecells = treeitem.firstChild.childNodes;
            treecells[0].setAttribute("value", values[0]);
            this.setMenuValue(treecells[1], values[1], this.field);
            this.setMenuValue(treecells[2], values[2], this.attr);
            treecells[3].setAttribute("label", values[3]);
            // treecells[4].setAttribute("label", values[4]);
        },

        createTreeItem: function () {
            const treeitem = document.createElement("treeitem");
            const treerow = document.createElement("treerow");
            for (var i = 0; i < 4; i++)
                treerow.appendChild(document.createElement("treecell"));
            treeitem.appendChild(treerow);
            return treeitem;
        },

        setTree: function (columns) {
            for (var i = 0; i < columns.length; i++) {
                const values = [
                    columns[i].enabled ? "true" : "false",
                    columns[i].field, columns[i].attr, columns[i].label, // columns[i].format,
                ];
                const treeitem = this.createTreeItem();
                this.setTreeItem(treeitem, values);
                this.treechildren.appendChild(treeitem);
            }
            this.tree.view.selection.select(0);
        },

        onLoad: function () {
            const columns = Config.loadColumns();
            this.setTree(columns);
        },

        onNew: function () {
            const treeitem = this.createTreeItem();
            const values = [
                true, "sender", "displayName", "", ""
            ];

            this.setTreeItem(treeitem, values);
            this.treechildren.appendChild(treeitem);
            this.tree.view.selection.select(this.tree.view.rowCount - 1);
            this.onSelectMenu();
            this.onApply();
        },

        onDelete: function () {
            var index = this.tree.currentIndex; if (index < 0) return;
            const treeitem = this.treechildren.childNodes.item(index);
            this.treechildren.removeChild(treeitem);
            const id = this.field.selectedItem.value + "." + this.attr.selectedItem.value;
            if (index > this.tree.view.rowCount - 1)
                index--;
            this.tree.view.selection.select(index);
            this.prefpane.userChangedValue(this.tree);
        },

        onDefault: function () {
            while (this.treechildren.childNodes.length)
                this.treechildren.removeChild(this.treechildren.firstChild);
            const columns = Config.loadDefaultColumns();
            this.setTree(columns);
            this.prefpane.userChangedValue(this.tree);
        },

        onApply: function () {
            const index = this.tree.currentIndex; if (index < 0) return;
            const treeitem = this.tree.contentView.getItemAtIndex(index);
            const values = [
                this.enabled.checked,
                this.field.selectedItem.value,
                this.attr.selectedItem.value,
                this.label.value,
                // this.format.value,
            ];

            this.setTreeItem(treeitem, values);
            this.prefpane.userChangedValue(this.tree);
        },

        onSelectMenu: function () {
            this.label.value = this.attr.selectedItem.label + "(" + this.field.selectedItem.label + ")";
        },

        onSyncToPreference: function () {
            const columns = new Array;
            const n = this.tree.view.rowCount;
            for (var i = 0; i < n; i++) {
                const treecells = this.tree.contentView.getItemAtIndex(i).firstChild.childNodes;
                const column = new Object;
                column.enabled = treecells[0].getAttribute("value") == "true" ? true : false;
                column.field = treecells[1].getAttribute("value");
                column.attr = treecells[2].getAttribute("value");
                column.label = treecells[3].getAttribute("label");
                column.format = "";
                columns.push(column);
            }
            return Config.saveColumns(columns);
        }
    };

}
