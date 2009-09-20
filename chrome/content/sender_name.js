/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name 0.3: main file
 *
 */

(function () {
    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.AddressBook = {
            addrDBs: new Array,
            cardCache: new Object,

            getCardFromDB: function (addr) {
                var card = null;
                Search: for (var i in this.addrDBs) {
                    var db = this.addrDBs[i];
                    var fields = ["LowercasePrimaryEmail", "SecondEmail"];
                    for (var field; field = fields.shift(); ) {
                        card = db.getCardFromAttribute(null, field, addr, true);
                        if (card != null)
                            break Search;
                    }
                }
                return card;
            },

            getCard: function (addr) {
                if (this.cardCache[addr] == undefined)
                    this.cardCache[addr] = this.getCardFromDB(addr);
                return this.cardCache[addr];
            },

            flush: function () { cardCache = new Object; },

            onChange: function() { flush(); }, 

            // nsIAbListener (Thunderbird 3.0)
            onItemAdded: function(aParentDir, aItem) { onChange(); },
            onItemRemoved: function(aParentDir, aItem) { onChange(); },
            onItemPropertyChanged: function(aItem, aProperty, aOldValue, aNewValue) { onChange(); },

            init: function () {
                var nsIAddressBook = Service.getService("addressbook;1", "nsIAddressBook");
                var nsIRDFService = Service.getService("rdf/rdf-service;1", "nsIRDFService");
                var nsIAbDirectory = Components.interfaces.nsIAbDirectory;
                var parentDir = nsIRDFService.GetResource("moz-abdirectory://").QueryInterface(nsIAbDirectory);
                var enumerator = parentDir.childNodes;

                while (enumerator.hasMoreElements()) {
                    var addrbook = enumerator.getNext();
                    if (! (addrbook instanceof Components.interfaces.nsIAbMDBDirectory))
                        continue;
                    var uri = addrbook.getDirUri();
                    if (uri.indexOf("history.mab") >= 0)
                        continue;
                    this.addrDBs.push(nsIAddressBook.getAbDatabaseFromURI(uri));
                }

                // notify on address book changes (Thunderbird 3.0)
                var nsIAbManager = Service.getService("abmanager;1", "nsIAbManager");
                if (nsIAbManager) {
                    var flag = Components.interfaces.nsIAbListener.all;
                    nsIAbManager.addAddressBookListener(AddressBook, flag);
                }

            },
        };

        SenderName.Formatter = {
            headerParser: Service.getService("messenger/headerparser;1", "nsIMsgHeaderParser"),
            format: new Object,
            format_list: ["undefined", "separator", "insep"],

            formatUndefined: function (attr, addr, name) {
                return attr == "displayName" ?
                    this.format.undefined.replace("%s", name ? name : addr) : "";
            },

            formatInsep: function (value) {
                return this.format.insep.replace("%s", value);
            },

            formatAttrValue: function (line, attr) {
                var addrs = new Object; var names = new Object; var fulls = new Object;
                var values = new Array;

                var count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls);
                for (var i = 0; i < count; i++) {
                    var addr = addrs.value[i];
                    var card = AddressBook.getCard(addr);
                    var value = card ? card[attr] : this.formatUndefined(attr, addr, names.value[i]);
                    if (count > 0 && value.indexOf(this.format.separator.replace(/^\s+|\s+$/g, '')) >= 0)
                        value = this.formatInsep(value);
                    values.push(value);
                }
                return values.join(this.format.separator);
            },

            init: function () {
                for (var id in this.format_list) {
                    var type = this.format_list[id];
                    this.format[type] = Preference.getUnicodePref("format." + type);
                }
                Preference.addObserver("format.", this);
            },

            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.format[data.split(".")[1]] = Preference.getUnicodePref(data);
                ThreadPane.flush();
            },
        };

        SenderName.ColumnHandler = function (attr) {
            this.attr = attr;
            this.cache = new Object;
        };

        SenderName.ColumnHandler.prototype = {
            flush: function () { this.cache = new Object; },

            getAttributeValue: function (hdr) {
                var uri = hdr.folder.getUriForMsg(hdr);
                var author = hdr.mime2DecodedAuthor;

                // should use nsIAddrDBAnnouncer
                if (this.cache[uri] == undefined)
                    this.cache[uri] = Formatter.formatAttrValue(author, this.attr);
                return this.cache[uri];
            },

            // Implement nsIMsgCustomColumnHandler interface
            getCellText: function (row, col) {
                var dbview = GetDBView();
                var key = dbview.getKeyAt(row);
                var folder = dbview.getFolderForViewIndex(row);
                var hdr = folder.GetMessageHeader(key);

                return this.getAttributeValue(hdr);
            },

            getSortStringForRow: function (hdr) {
                return this.getAttributeValue(hdr);
            },

            getCellProperties: function (row, col, props) {
                // var aserv = Components.classes["@mozilla.org/atom-service;1"]
                // .createInstance(Components.interfaces.nsIAtomService);
                // props.AppendElement(aserv.getAtom("undef"));
            },

            isEditable:        function (row, col) { return false; },
            cycleCell:         function (row, col) { },
            isString:          function () { return true; },
            getRowProperties:  function (row, props) {},
            getImageSrc:       function (row, col) { return null; },
            getSortLongForRow: function (hdr) { return 0; },
        };

        SenderName.ThreadPane = {
            prefix: "senderNameCol.",
            attrEnabled: null,
            columnHandlerList: new Array,

            flush: function () {
                for (var id in this.columnHandlerList)
                    this.columnHandlerList[id].flush();
                var tree = GetThreadTree();
                tree.treeBoxObject.invalidate();
            },

            addColumnHandlers: function () {
                for (var attr in this.attrEnabled) {
                    if (this.attrEnabled[attr]) {
                        var id = this.prefix + attr;
                        var handler = new ColumnHandler(attr);
                        this.columnHandlerList[id] = handler;
                        GetDBView().addColumnHandler(id, handler);
                    }
                }
            },

            // createElement-based
            createSplitter: function () {
		        var splitter = document.createElement("splitter");
		        splitter.setAttribute("class", "tree-splitter");
		        return splitter;
            },

            createTreecol: function (id, attr) {
		        var treecol = document.createElement("treecol");
		        var label = Preference.getLocalizedString("attr.label." + attr);
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
            },

            loadPreferences: function () {
                this.attrList = new Object;
                var attrs = Preference.getBranch("attr.enabled.").getChildList("", {});
                for (var i in attrs) {
                    var attr = attrs[i];
                    var enabled = Preference.getBoolPref("attr.enabled." + attr);
                    if (enabled) {
                        var id = this.prefix + "." + attr;
                        this.attrList[id] = attr;
                    }
                }
            },



            removeColumn: function (threadCols, id) {
                for (var i in threadCols.childNodes) {
                    var c = threadCols.childNodes[i];
                    if (c.id == id) {
                        threadCols.removeChild(threadCols.childNodes[i - 1]);
                        threadCols.removeChild(c);
                    }
                }
            },

            reloadColumn: function (treecol, id, attr) {
		        var label = Preference.getLocalizedString("attr.label." + attr);
                var tooltip = Property.getFormattedString("tooltip", [label]);

		        treecol.setAttribute("label", label);
		        treecol.setAttribute("tooltiptext", tooltip);
            },

            appendColumn: function (threadCols, id, attr) {
                threadCols.appendChild(this.createSplitter());
                threadCols.appendChild(this.createTreecol(id, attr));
            },

            findChild: function (id, threadCols) {
                for (var i in threadCols.childNodes) {
                    var child = threadCols.childNodes[i];
                    if (child.id == id)
                        return child;
                }
                return null;
            },

            loadElements2: function () {
		        var threadCols = document.getElementById('threadCols');
                for (var attr in this.attrEnabled) {
                    var id = this.prefix + attr;
                    var child = this.findChild(id, threadCols);
                    
                    if (this.attrEnabled[attr])
                        child ? this.reloadColumn(child, id, attr) : this.appendColumn(threadCols, id, attr);
                    else if (child)
                        this.removeColumn(threadCols, id);
                }
            },

            loadPreferences2: function () {
                this.attrEnabled = new Object;
                var branch = Preference.getBranch("attr.enabled.");
                var attrs = branch.getChildList("", {});
                for (var i in attrs) {
                    var attr = attrs[i];
                    this.attrEnabled[attr] = branch.getBoolPref(attr);
                }
            },

            load: function () {
                this.loadPreferences2();
                this.loadElements2();
            },

            init: function () {
                this.load();
                Preference.addObserver("attr.", this);
            },

            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.load();
            },

        };

        SenderName.Observer = {
            // Implement nsIObserver interface
            observe: function (subject, topic, data) {
                ThreadPane.addColumnHandlers();
            },

            register: function () {
                if (gSearchView)
                    ThreadPane.addColumnHandlers();
                else {
                    Service.getService("observer-service;1", "nsIObserverService")
                    .addObserver(this, "MsgCreateDBView", false);
                }
            }
        };

        SenderName.Main = {
            onLoad: function () {
                AddressBook.init();
                Formatter.init();
                Observer.register();
            },

            main: function () {
                ThreadPane.init();
                window.addEventListener("load", Main.onLoad, false);
            },
        };

        Main.main();
    } // end namespace

})();
