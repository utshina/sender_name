            // createElement-based
            createSplitter: function () {
		        var splitter = document.createElement("splitter");
		        splitter.setAttribute("class", "tree-splitter");
		        return splitter;
            },

            createTreecol: function (id, attr) {
		        var treecol = document.createElement("treecol");
		        var label = Property.getString(attr);
		        var tooltip = Property.getFormattedString("tooltip", [label]);

		        treecol.setAttribute("id", id);
		        treecol.setAttribute("persist", "hidden ordinal width");
		        treecol.setAttribute("flex", "4");
		        treecol.setAttribute("label", label);
		        treecol.setAttribute("tooltiptext", tooltip);
		        return treecol;
            },

            createColumns: function (elements) {
		        for (var id in this.attrList) {
                    var attr = this.attrList[id];
                    elements[attr] = this.createTreecol(id, attr);
		        }
            },

            appendColumns: function (elements, threadCols) {
		        for (var id in this.attrList) {
                    var s = this.createSplitter();
                    var e = elements[this.attrList[id]];
                    threadCols.appendChild(s);
                    threadCols.appendChild(e);
		        }
            },

            loadElements: function () {
		        var threadCols = document.getElementById('threadCols');
		        var elements = new Object;
		        this.createColumns(elements);
		        this.appendColumns(elements, threadCols);
		        LocalStore.setAttribute(elements, threadCols.baseURI);
            },

