/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
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

            formatMultiAddress: function (value) {
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
                if (value == undefined)
                    return "";
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
                    if (count > 1)
                        value = this.formatMultiAddress(value);
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
            thunderbirdColumnIDs: { author: "senderCol", recipients: "recipientCol" },
            columnHandlers: new Object,
            savedAttributes: new Object,
            treecol_pool: new Array,
            treecols: null,
            columns: null,

            flush: function () {
                for each (var handler in this.columnHandlers)
                handler.flush();
                GetThreadTree().treeBoxObject.invalidate();
            },

            addColumnHandlers: function () {
                const dbview = Thunderbird.getDBView(); if (dbview == null) return;

                for (var i = 0; i < this.treecols.length; i++) {
                    const column = this.columns[i];
                    const treecol = this.treecols[i];

                    if (this.columnHandlers[column.id] == null)
                        this.columnHandlers[column.id] = new ColumnHandler(column);
                    const handler = this.columnHandlers[column.id];
                    const id = treecol.getAttribute("id");
                    dbview.addColumnHandler(id, handler);
                }
            },

            setLabels: function (column, treecol) {
                const label = column.label;
                const tooltip = Property.getFormattedString("tooltip", [label]);

                treecol.setAttribute("label", label);
                treecol.setAttribute("tooltiptext", tooltip);
            },

            initThunderbirdTreecol: function (field) {
                const treecol = document.getElementById(this.thunderbirdColumnIDs[field]);
                if (!this.savedAttributes[field])
                    this.savedAttributes[field] = [treecol.getAttribute("label"), treecol.getAttribute("tooltiptext")];
                return treecol;
            },

            exitThunderbirdTreecol: function (field) {
                const treecol = document.getElementById(this.thunderbirdColumnIDs[field]);
                if (this.savedAttributes[field]) {
                    const dbview = Thunderbird.getDBView();
                    if (dbview)
                        dbview.removeColumnHandler(this.thunderbirdColumnIDs[field]);

                    treecol.setAttribute("label", this.savedAttributes[field][0]);
                    treecol.setAttribute("tooltiptext", this.savedAttributes[field][1]);
                    delete this.savedAttributes[field];
                }
                return treecol;
            },

            isReplaceDefaultColumn: function (column) {
                if (column.attr == "displayName" && 
                    this.thunderbirdColumnIDs[column.field] &&
                    !Preference.getBoolPref("options.create_display_name_column"))
                    return true;
                return false;
            },

            shrinkTreecols: function (index) {
                var num = this.treecol_pool.length - index;
                while (num-- > 0) {
                    var treecol = this.treecol_pool.pop();
                    this.threadCols.removeChild(treecol);
                }
            },

            getTreecol: function (i) {
                if (this.treecol_pool[i] == null) {
                    const splitter = document.createElement("splitter");
                    splitter.setAttribute("class", "tree-splitter");
                    this.threadCols.appendChild(splitter);

                    const treecol = document.createElement("treecol");
                    treecol.setAttribute("id", this.prefix + "column" + i);
                    treecol.setAttribute("persist", "hidden ordinal width");
                    treecol.setAttribute("flex", "4");
                    this.threadCols.appendChild(treecol);

                    this.treecol_pool[i] = treecol;
                }
                return this.treecol_pool[i]
            },

            getColumnList: function () {
                const columns = Config.loadColumns();
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    column.id = (column.attr == "custom") ? column.format : column.field + "." + column.attr;
                    column.index = i;
                }
                return columns;
            },

            initColumns: function () {
                var list = this.getColumnList();
                var replaced = { author: false, recipients: false };
                var ti = 0;

                this.columns = new Array;
                this.treecols = new Array;
                for (var i = 0; i < list.length; i++) {
                    var column = list[i];
                    if (column.enabled == false)
                        continue;

                    var treecol = null;
                    var replace = this.isReplaceDefaultColumn(column);
                    if (replace && !replaced[column.field]) {
                        replaced[column.field] = true;
                        treecol = this.initThunderbirdTreecol(column.field);
                    } else
                        treecol = this.getTreecol(ti++);
                    this.treecols.push(treecol);
                    this.columns.push(column);
                    this.setLabels(column, treecol);
                }
                this.shrinkTreecols(ti);
                for (var field in replaced)
                    if (replaced[field] == false)
                        this.exitThunderbirdTreecol(field);
            },

            onLoad: function () {
                Service.getService("observer-service;1", "nsIObserverService")
                .addObserver(this, "MsgCreateDBView", false);
                if (Thunderbird.getDBView()) // for Search Dialog
                    this.addColumnHandlers();
            },

            init: function () {
                this.initColumns();
                Preference.addObserver("columns", this);
                Preference.addObserver("options", this);
            },

            // implement nsIObserver interface
            observe: function (subject, topic, data) {
                switch (topic) {
                case "nsPref:changed": // nsIPrefBranch2
                    this.initColumns();
                    this.addColumnHandlers();
                    this.flush();
                    break;

                case "MsgCreateDBView": // nsIObserverService
                    this.addColumnHandlers();
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
