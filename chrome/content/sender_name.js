/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.Thunderbird = {
            getDBView: function () {
                if (gDBView)
                    return gDBView;
                else if (typeof(GetDBView) == "function") // for Search Dialog
                    return GetDBView();
                return null;
            }
        };

        SenderName.AddressBook = {

            getAddressBooks: function () {
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                return abManager.directories;
            },

            getAddressBookURI: function (addrbook) {
                return addrbook.URI;
            },

            checkInterface: function (addrbook) {
                if (addrbook instanceof Components.interfaces.nsIAbDirectory)
                    return addrbook;
                return null;
            },

            addListener: function (listener) {
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                abManager.addAddressBookListener(listener, Components.interfaces.nsIAbListener.all);
            },

            getAttributeFromContact: function (card, attr) {
                var value = null;
                if (card != null) {
                    try {
                        value = card.getProperty(attr, "");
                    } catch (e) { value = undefined; }
                }
                return value;
            }
            
        };

        SenderName.Contact = {
            directories: new Array,
            contacts: new Object,

            getContactFromDirectories: function (addr) {
                for each (var dir in this.directories) {
                    var contact = dir.cardForEmailAddress(addr);
                    if (contact)
                        return contact;
                }
                return null;
            },

            getContact: function (addr) {
                if (!this.contacts[addr])
                    this.contacts[addr] = this.getContactFromDirectories(addr);
                return this.contacts[addr];
            },

            getAttribute: function (addr, attr) {
                const contact = this.getContact(addr);
                return AddressBook.getAttributeFromContact(contact, attr);
            },

            getAddressBooks: function () {
                const addrbooks = AddressBook.getAddressBooks();
                while (addrbooks.hasMoreElements()) {
                    var addrbook = addrbooks.getNext();
                    addrbook = AddressBook.checkInterface(addrbook);
                    if (!addrbook)
                        continue;
                    if (Preference.getBoolPref("others.exclude_history_address_book"))
                        if (AddressBook.getAddressBookURI(addrbook) == "moz-abmdbdirectory://history.mab")
                            continue;
                    this.directories.push(addrbook);
                }
            },

            onChange: function() {
                this.contacts = new Object;
                this.directories = new Array;
                this.getAddressBooks();
                ThreadPane.flush();
            },

            init: function () {
                this.getAddressBooks();
                AddressBook.addListener(this);
                Preference.addObserver("others.exclude_history_address_book", this);
            },

            // Implement nsIAbListener
            onItemAdded: function(parentDir, item) { this.onChange(); },
            onItemRemoved: function(parentDir, item) { this.onChange(); },
            onItemPropertyChanged: function(item, property, oldValue, newValue) { this.onChange(); },

            // Implement nsIObserver interface
            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.onChange();
            }
        };

        SenderName.Formatter = {
            // avoid the validator bug
            headerParser: Service.getService("messenger/headerparser;1", "nsIMsg" + "HeaderParser"),
            preferMailFormats: ["unknown", "plainText", "HTML"],
            attrLabels: new Object,
            format: new Object,
            sepchar: ",",

            formatMultiAddresses: function (value) {
                if (value.indexOf(this.sepchar) < 0)
                    return value;
                return this.format.insep.replace("%s", value);
            },

            formatOneAddress: function (addr, attr, name) {
                const value = Contact.getAttribute(addr, attr);

                if (attr == "DisplayName" && !value) {
                    const args = { s: name ? name : addr, n: name, a: addr};
                    return this.format.undefined.replace(/%([sna])/g, function (all, key) { return args[key]; });
                }

                if (typeof(value) == "undefined")
                    return this.format.unsupported;
                else if (value == null)
                    return this.format.nocard;

                if (attr == "PreferMailFormat") {
                    const type = this.preferMailFormats[value];
                    return this.attrLabels[type];
                } else if (attr == "AllowRemoteContent") {
                    return value ? this.attrLabels["allowed"] : this.attrLabels["denied"];
                }

                if (value == "")
                    return this.format.nullstr;

                if (attr == "LastModifiedDate") {
                    return (new Date(value*1000)).toLocaleString();
                } else if (attr == "Notes") {
                    return value.replace("\n", " ", "g");
                }
                return value;
            },

            formatAttributeValue: function (column, header) {
                const addrs = new Object; const names = new Object; const fulls = new Object;
                const strs = new Array;
                const line = header[column.field];
                const attr = column.attr;
                const count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls);
                for (var i = 0; i < count; i++) {
                    const addr = addrs.value[i];
                    const name = names.value[i];
                    var str = this.formatOneAddress(addr, attr, name);
                    if (count > 1)
                        str = this.formatMultiAddresses(str);
                    strs.push(str);
                }
                return strs.join(this.format.separator);
            },

            init: function () {
                const types = Preference.getBranch("format.").getChildList("", {});
                for (var type; type = types.shift();)
                    this.format[type] = Preference.getLocalizedString("format." + type);
                this.sepchar = this.format.separator.replace(/^\s+|\s+$/g, '');
                const keys = ["unknown", "plainText", "HTML", "allowed", "denied"];
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    this.attrLabels[key] = Property.getString("attr.label." + key);
                }
                Preference.addObserver("format.", this);
            },

            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.format[data.split(".")[1]] = Preference.getUnicodePref(data);
                ThreadPane.flush();
            }
        };

        SenderName.ColumnHandler = function (column) {
            this.column = column;
            this.cache = new Object;
        };
        SenderName.ColumnHandler.prototype = {
            flush: function () { this.cache = new Object; },

            getAttributeValue: function (header) {
                const uri = header.folder.getUriForMsg(header);
                if (!this.cache[uri])
                    this.cache[uri] = Formatter.formatAttributeValue(this.column, header);
                return this.cache[uri];
            },

            // Implement nsIMsgCustomColumnHandler interface
            getCellText: function (row, col) {
                const dbview = Thunderbird.getDBView();
                const hdr = dbview.getMsgHdrAt(row);
                if (dbview.isContainer(row))
                    return null;
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
            getSortLongForRow: function (hdr) { return 0; }
        };

        SenderName.ThreadPane = {
            prefix: "SenderNameCol.",
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
                if (column.attr == "DisplayName" && 
                    this.thunderbirdColumnIDs[column.field] &&
                    !Preference.getBoolPref("others.create_display_name_column"))
                    return true;
                return false;
            },

            shrinkTreecols: function (index) {
                var threadCols = document.getElementById('threadCols');
                var num = this.treecol_pool.length - index;
                while (num-- > 0) {
                    var treecol = this.treecol_pool.pop();
                    threadCols.removeChild(treecol);
                }
            },

            getTreecol: function (i) {
                var threadCols = document.getElementById('threadCols');
                if (this.treecol_pool[i] == null) {
                    const splitter = document.createElement("splitter");
                    splitter.setAttribute("class", "tree-splitter");
                    threadCols.appendChild(splitter);

                    const treecol = document.createElement("treecol");
                    treecol.setAttribute("id", this.prefix + "column" + i);
                    treecol.setAttribute("persist", "hidden ordinal width");
                    treecol.setAttribute("flex", "4");
                    treecol.setAttribute("hidden", "false");
                    threadCols.appendChild(treecol);

                    this.treecol_pool[i] = treecol;
                }
                return this.treecol_pool[i];
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
                    if (!column.enabled)
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
                if (Thunderbird.getDBView()) { // for Search Dialog
                    this.initColumns();
                    this.addColumnHandlers();
                }
            },

            init: function () {
                Preference.addObserver("columns", this);
                Preference.addObserver("others.create_display_name_column", this);
            },

            // Implement nsIObserver interface
            observe: function (subject, topic, data) {
                switch (topic) {
                case "nsPref:changed": // nsIPrefBranch
                    this.initColumns();
                    this.addColumnHandlers();
                    this.flush();
                    break;

                case "MsgCreateDBView": // nsIObserverService
                    ThreadPane.initColumns();
                    ThreadPane.addColumnHandlers();
                    break;
                }
            }
        }; // end ThreadPane

        SenderName.Main = {
            isMessenger: function () {
                const e = document.getElementById('messengerWindow');
                return e != null;
            },

            onLoad: function () {
                ThreadPane.init();
                if (Main.isMessenger())
                    Tasks.init();
                Contact.init();
                ThreadPane.onLoad();
            },

            main: function () {
                Formatter.init();
                window.addEventListener("load", Main.onLoad, false);
            }
        };

        // initialize
        Main.main();

    } // end namespace

})();
