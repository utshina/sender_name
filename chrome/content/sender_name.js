/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: main file
 *
 */

(function () {

    // begin the namespace (defined in "namespace.js")
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        // for compatibility with Thunderbird 2.0 and 3.0
        SenderName.Thunderbird = {

            getDBView: function () {
                if (gDBView)
                    return gDBView;
                else if (typeof(GetDBView) == "function") // for Search Dialog
                    return GetDBView();
                return null;
            },

            getAddrbooks: function () {
                // Thunderbird 3.0
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                if (abManager)
                    return abManager.directories;
                // Thunderbird 2.0
                const RDF = Service.getService("rdf/rdf-service;1", "nsIRDFService");
                const nsIAbDirectory = Components.interfaces.nsIAbDirectory;
                const parentDir = RDF.GetResource("moz-abdirectory://").QueryInterface(nsIAbDirectory);
                return parentDir.childNodes;
            },

            getAddrbookURI: function (addrbook) {
                // Thunderbird 3.0
                if (addrbook.URI)
                    return addrbook.URI;
                // Thunderbird 2.0
                else if (addrbook instanceof Components.interfaces.nsIAbMDBDirectory &&
                         typeof(addrbook.getDirUri) == "function")
                    return addrbook.getDirUri();
                return "";
            },

            addAddressBookListener: function (listener) {
                // Thunderbird 3.0
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                if (abManager) {
                    abManager.addAddressBookListener(listener, Components.interfaces.nsIAbListener.all);
                    return;
                }
                // Thunderbird 2.0
                const addrbookSession = Service.getService("addressbook/services/session;1", "nsIAddrBookSession");
                addrbookSession.addAddressBookListener(listener, Components.interfaces.nsIAddrBookSession.all);
            },
        },

        SenderName.AddressBook = {
            addrDBs: new Array,
            cardCache: new Object,

            getCardFromDB: function (addr) {
                for each (var ab in this.addrDBs) {
                    var card = ab.cardForEmailAddress(addr);
                    if (card != null)
                        return card;
                }
                return null;
            },

            getCard: function (addr) {
                if (this.cardCache[addr] == undefined)
                    this.cardCache[addr] = this.getCardFromDB(addr);
                return this.cardCache[addr];
            },

            onChange: function() {
                this.cardCache = new Object;
                ThreadPane.flush();
            },

            init: function () {
                const addrbooks = Thunderbird.getAddrbooks();
                while (addrbooks.hasMoreElements()) {
                    var addrbook = addrbooks.getNext();
                    if (!(addrbook instanceof Components.interfaces.nsIAbDirectory))
                        continue;
                    if (!addrbook.isRemote && Thunderbird.getAddrbookURI(addrbook).indexOf("history.mab") >= 0)
                        continue;
                    this.addrDBs.push(addrbook);
                }
                Thunderbird.addAddressBookListener(this);
            },

            // Implement nsIAbListener
            onItemAdded: function(parentDir, item) { this.onChange(); },
            onItemRemoved: function(parentDir, item) { this.onChange(); },
            onItemPropertyChanged: function(item, property, oldValue, newValue) { this.onChange(); },
        };

        SenderName.Formatter = {
            headerParser: Service.getService("messenger/headerparser;1", "nsIMsgHeaderParser"),
            format: new Object,
            preferMailFormats: ["unknown", "plainText", "HTML"],

            formatMultiSender: function (value) {
                if (value.indexOf(this.format.separator.replace(/^\s+|\s+$/g, '')) < 0)
                    return value;
                return this.format.insep.replace("%s", value);
            },

            formatUndefined: function (attr, addr, name) {
                if (attr != "displayName")
                    return "";
                const args = { s: name ? name : addr, n: name, a: addr};
                return this.format.undefined.replace(/%([sna])/g, function (all, key) { return args[key]; });
            },

            formatAttribute: function (attr, value) {
                if (attr == "preferMailFormat") {
                    const type = value <= 2 ? this.preferMailFormats[value] : "undefined";
                    return Preference.getLocalizedString("attr.label." + type);
                } else if (attr == "notes")
                    return value.replace("\n", " ", "g");
                return value;
            },

            formatAttrValue: function (column, header) {
                var addrs = new Object; var names = new Object; var fulls = new Object;
                var values = new Array;

                var line = header[column.field];
                var attr = column.attr;
                const count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls);
                for (var i = 0; i < count; i++) {
                    const addr = addrs.value[i];
                    const card = AddressBook.getCard(addr);
                    const value = card ? this.formatAttribute(attr, card[attr]) :
                                       this.formatUndefined(attr, addr, names.value[i]);
                    if (count > 0)
                        value = this.formatMultiSender(value);
                    values.push(value);
                }
                return values.join(this.format.separator);
            },

            init: function () {
                const types = Preference.getBranch("format.").getChildList("", {});
                for (var type; type = types.shift();)
                    this.format[type] = Preference.getUnicodePref("format." + type);
                Preference.addObserver("format.", this);
            },

            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.format[data.split(".")[1]] = Preference.getUnicodePref(data);
                ThreadPane.flush();
            },
        };

        SenderName.ColumnHandler = function (column) {
            this.column = column;
            this.cache = new Object;
        };
        SenderName.ColumnHandler.prototype = {
            flush: function () { this.cache = new Object; },

            getAttributeValue: function (header) {
                const uri = header.folder.getUriForMsg(header);
                if (this.cache[uri] == undefined)
                    this.cache[uri] = Formatter.formatAttrValue(this.column, header);
                return this.cache[uri];
            },

            // Implement nsIMsgCustomColumnHandler interface
            getCellText: function (row, col) {
                const dbview = Thunderbird.getDBView();
                const key = dbview.getKeyAt(row);
                const folder = dbview.getFolderForViewIndex(row);
                const hdr = folder.GetMessageHeader(key);

                return this.getAttributeValue(hdr);
            },

            getSortStringForRow: function (hdr) {
                return this.getAttributeValue(hdr);
            },

            isEditable:        function (row, col) { return false; },
            cycleCell:         function (row, col) { },
            isString:          function () { return true; },
            getCellProperties: function (row, col, props) { },
            getRowProperties:  function (row, props) {},
            getImageSrc:       function (row, col) { return null; },
            getSortLongForRow: function (hdr) { return 0; },
        };

        SenderName.ThreadPane = {
            prefix: "SenderNameCol.",
            threadCols: document.getElementById('threadCols'),
            defaultColumnIDs: { author: "senderCol", recipients: "recipientCol" },
            columns: null,
            treecols: new Object,
            columnHandlers: new Array,
            savedAttributes: new Object,

            // column handlers
            flush: function () {
                for each (var handler in this.columnHandlers)
                    handler.flush();
                GetThreadTree().treeBoxObject.invalidate();
            },

            addColumnHandlers: function () {
                for (var cid in this.treecols) {
                    const column = this.columns[cid];
                    const treecol = this.treecols[cid];

                    const id = treecol.getAttribute("id");
                    const handler = new ColumnHandler(column);
                    this.columnHandlers[id] = handler;
                    Thunderbird.getDBView().addColumnHandler(id, handler);
                }
            },

            // handle treecol
            createSplitter: function () {
		        const splitter = document.createElement("splitter");
		        splitter.setAttribute("class", "tree-splitter");
		        return splitter;
            },

            setLabels: function (column, treecol) {
                const label = column.label;
                const tooltip = Property.getFormattedString("tooltip", [label]);

		        treecol.setAttribute("label", label);
		        treecol.setAttribute("tooltiptext", tooltip);
            },

            saveLabels: function (treecol) {
                var id = treecol.getAttribute("id");
                this.savedAttributes[id] = [treecol.getAttribute("label"), treecol.getAttribute("tooltip")];
            },

            restoreLabels: function (treecol) {
                var id = treecol.getAttribute("id");
                treecol.setAttribute("label", this.savedAttributes[id][0]);
                treecol.setAttribute("tooltip", this.savedAttributes[id][1]);
            },

            createTreecol: function (column) {
		        const treecol = document.createElement("treecol");

		        treecol.setAttribute("id", this.prefix + column.id);
		        treecol.setAttribute("persist", "hidden ordinal width");
		        treecol.setAttribute("flex", "4");
                treecol.isSenderNameCol = true;
		        return treecol;
            },

            initThunderbirdTreecol: function (column) {
                treecol = document.getElementById(this.defaultColumnIDs[column.field]);
                this.saveLabels(treecol);
                return treecol;
            },

            exitThunderbirdTreecol: function (column, treecol) {
                Thunderbird.getDBView().removeColumnHandler(this.defaultColumnIDs[column.field]);
                this.restoreLabels(treecol);
                delete this.treecols[column.id];
            },

            initSenderNameTreecol: function (column) {
                treecol = this.createTreecol(column)
                this.threadCols.appendChild(this.createSplitter());
                this.threadCols.appendChild(treecol);
                return treecol;
            },

            exitSenderNameTreecol: function (column, treecol) {
                this.threadCols.removeChild(treecol);
                delete this.treecols[column.id];
            },

            isReplaceDefaultColumn: function (column) {
                if (column.attr == "displayName" && 
                    !Preference.getBoolPref("options.create_display_name_column") &&
                    this.defaultColumnIDs[column.field])
                    return true;
                return false;
            },

            initThreadCols: function (old) {
                for (var id in this.treecols) {
                    if (this.columns[id])
                        continue;
                    var treecol = this.treecols[id];
                    if (treecol.isSenderNameCol)
                        this.exitSenderNameTreecol(old.column[id], treecol);
                    else
                        this.exitThunderbirdTreecol(old.column[id], treecol);
                }

                for (var id in this.columns) {
                    var column = this.columns[id];
                    var treecol = this.treecols[id];
                    var replace = this.isReplaceDefaultColumn(column);

                    if (treecol) {
                        if (treecol.isSenderNameCol && (replace || !column.enabled))
                            this.exitSenderNameTreecol(column, treecol);
                        else if (!treecol.isSenderNameCol && (!replace || !column.enabled))
                            this.exitThunderbirdTreecol(column, treecol);
                    }

                    if (column.enabled) {
                        if (!this.treecols[id])
                            this.treecols[id] = replace ?
                            this.initThunderbirdTreecol(column) : this.initSenderNameTreecol(column);
                        this.setLabels(column, this.treecols[id]);
                    }
                }
            },

            setColumns: function () {
                this.columns = ColumnInfo.getColumns();
                this.initThreadCols(old);
            },




            addColumnHandlers2: function () {
                for (var i = 0; i < this.treecols.length; i++) {
                    const column = this.columns[i];
                    const treecol = this.treecols[i];

                    if (this.columnHandlers[column.id] == null)
                        this.columnHandlers[column.id] = new ColumnHandler(column);
                    const handler = this.columnHandlers[column.id];
                    const id = treecol.getAttribute("id");
                    Thunderbird.getDBView().addColumnHandler(id, handler);
                }
            },

            ThunderbirdColumnIDs: { author: "senderCol", recipients: "recipientCol" },

            initThunderbirdTreecol2: function (field) {
                const treecol = document.getElementById(this.ThunderbirdColumnIDs[field]);
                if (!this.savedAttributes[field])
                    this.savedAttributes[field] = [treecol.getAttribute("label"), treecol.getAttribute("tooltip")];
                return treecol;
            },

            exitThunderbirdTreecol2: function (field) {
                if (!this.savedAttributes[field])
                    return;
                Thunderbird.getDBView().removeColumnHandler(this.ThunderbirdColumnIDs[field]);
                const treecol = document.getElementById(this.ThunderbirdColumnIDs[field]);
                treecol.setAttribute("label", this.savedAttributes[field][0]);
                treecol.setAttribute("tooltip", this.savedAttributes[field][1]);
                delete this.savedAttributes[field];
                return;
            },

            treecol_pool: new Array,

            shrinkTreecol: function (index) {

                var num = this.treecol_pool.length - index;
                while (num-- > 0) {
                    var treecol = this.treecol_pool.pop();
                    this.threadCols.removeChild(treecol);
                }

                for (var i = 0; i < this.treecol_pool.length; i++)
                    dump(i + ":" + this.treecol_pool[i].id + "\n"); 


            },

            getTreecol: function (i) {
                if (this.treecol_pool[i] == null) {
		            const treecol = document.createElement("treecol");
		            treecol.setAttribute("id", this.prefix + "column" + i);
		            treecol.setAttribute("persist", "hidden ordinal width");
		            treecol.setAttribute("flex", "4");
                    this.threadCols.appendChild(this.createSplitter());
                    this.threadCols.appendChild(treecol);
                    this.treecol_pool[i] = treecol;
                }
                return this.treecol_pool[i]
            },

            initColumns: function () {
                var columnList = ColumnInfo.getColumnList();
                var replaced = { author: false, recipients: false };
                var ti = 0;

                this.columns = new Array;
                this.treecols = new Array;
                for (var i = 0; i < columnList.length; i++) {
                    var column = columnList[i];
                    if (column.enabled == false)
                        continue;

                    var treecol = null;
                    var replace = this.isReplaceDefaultColumn(column);
                    if (replace && !replaced[column.field]) {
                        replaced[column.field] = true;
                        treecol = this.initThunderbirdTreecol2(column.field);
                    }
                    if (treecol == null)
                        treecol = this.getTreecol(ti++);
                    this.treecols.push(treecol);
                    this.columns.push(column);
                    this.setLabels(column, treecol);
                }
                this.shrinkTreecol(ti);
                for (var field in replaced)
                    if (replaced[field] == false)
                        this.exitThunderbirdTreecol2(field);
            },

            onLoad: function () {
                Service.getService("observer-service;1", "nsIObserverService")
                       .addObserver(this, "MsgCreateDBView", false);
                if (Thunderbird.getDBView()) // for Search Dialog
                    this.addColumnHandlers2();
            },

            init: function () {
                // this.setColumns();
                this.initColumns();
                Preference.addObserver("columns", this);
                Preference.addObserver("options", this);
            },

            // implement nsIObserver interface
            observe: function (subject, topic, data) {
                switch (topic) {
                case "nsPref:changed": // nsIPrefBranch2
                    // this.setColumns();
                    this.initColumns();
                    this.addColumnHandlers2();
                    this.flush();
                    break;

                case "MsgCreateDBView": // nsIObserverService
                    this.addColumnHandlers2();
                    break;
                }
            },
        };

        SenderName.Main = {
            onLoad: function () {
                AddressBook.init();
                ThreadPane.onLoad();
            },

            main: function () {
                ThreadPane.init();
                Formatter.init();
                window.addEventListener("load", Main.onLoad, false);
            },
        };
        Main.main();

    } // end namespace

})();
