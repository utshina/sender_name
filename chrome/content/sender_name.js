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

            onChange: function() { 
                this.cardCache = new Object;
                ThreadPane.flush();
            }, 

            init: function () {
                const nsIAddressBook = Service.getService("addressbook;1", "nsIAddressBook");
                const nsIRDFService = Service.getService("rdf/rdf-service;1", "nsIRDFService");
                const nsIAbDirectory = Components.interfaces.nsIAbDirectory;
                const parentDir = nsIRDFService.GetResource("moz-abdirectory://").QueryInterface(nsIAbDirectory);
                const enumerator = parentDir.childNodes;

                // enumerate address books
                while (enumerator.hasMoreElements()) {
                    var addrbook = enumerator.getNext();
                    if (! (addrbook instanceof Components.interfaces.nsIAbMDBDirectory))
                        continue;
                    var uri = addrbook.getDirUri();
                    if (uri.indexOf("history.mab") >= 0)
                        continue;
                    this.addrDBs.push(nsIAddressBook.getAbDatabaseFromURI(uri));
                }

                // register address book listener
                var addrbookSession = Service.getService("addressbook/services/session;1", "nsIAddrBookSession");
                addrbookSession.addAddressBookListener(this, Components.interfaces.nsIAddrBookSession.all);
            },

            // Implement nsIAbListener
            onItemAdded: function(parentDir, item) { this.onChange(); },
            onItemRemoved: function(parentDir, item) { this.onChange(); },
            onItemPropertyChanged: function(item, property, oldValue, newValue) { this.onChange(); },
        };

        SenderName.Formatter = {
            headerParser: Service.getService("messenger/headerparser;1", "nsIMsgHeaderParser"),
            format: new Object,

            formatMultiSender: function (value) {
                if (value.indexOf(this.format.separator.replace(/^\s+|\s+$/g, '')) < 0)
                    return value;
                return this.format.insep.replace("%s", value);
            },

            formatUndefined: function (attr, addr, name) {
                if (attr != "displayName")
                    return "";

                var string = this.format.undefined.replace("%s", name ? name : addr);
                string = string.replace("%n", name);
                string = string.replace("%a", addr);
                return string;
            },

            formatAttribute: function (attr, value) {
                if (attr == "preferMailFormat") {
                    var type;
                    switch (value) {
                    case 0:
                        type = "unknown"; break;
                    case 1:
                        type = "plainText"; break;
                    case 2:
                        type = "HTML"; break;
                    default:
                        type = "undefined"; break;
                    }
                    return Preference.getLocalizedString("attr.label." + type);
                } else if (attr == "notes")
                    return value.replace("\n", " ", "g");
                return value;
            },

            formatAttrValue: function (line, attr) {
                var addrs = new Object; var names = new Object; var fulls = new Object;
                var values = new Array;

                var count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls);
                for (var i = 0; i < count; i++) {
                    var addr = addrs.value[i];
                    var card = AddressBook.getCard(addr);
                    var value = card ? this.formatAttribute(attr, card[attr]) :
                                       this.formatUndefined(attr, addr, names.value[i]);
                    if (count > 0)
                        value = this.formatMultiSender(value);
                    values.push(value);
                }
                return values.join(this.format.separator);
            },

            init: function () {
                var types = Preference.getBranch("format.").getChildList("", {});
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
            treecols: new Object,
            columnHandlerList: new Array,

            // column handlers
            flush: function () {
                for (var id in this.columnHandlerList)
                    this.columnHandlerList[id].flush();
                GetThreadTree().treeBoxObject.invalidate();
            },

            addColumnHandlers: function () {
                for (var attr in this.attrEnabled) {
                    if (!this.attrEnabled[attr])
                        continue;

                    var id = this.prefix + attr;
                    var handler = new ColumnHandler(attr);
                    this.columnHandlerList[id] = handler;
                    GetDBView().addColumnHandler(id, handler);
                }
            },

            // handle treecol
            createSplitter: function () {
		        var splitter = document.createElement("splitter");
		        splitter.setAttribute("class", "tree-splitter");
		        return splitter;
            },

            setLabels: function (treecol, attr) {
		        var label = Preference.getLocalizedString("attr.label." + attr);
                var tooltip = Property.getFormattedString("tooltip", [label]);

		        treecol.setAttribute("label", label);
		        treecol.setAttribute("tooltiptext", tooltip);
            },

            createTreecol: function (attr) {
		        var treecol = document.createElement("treecol");

		        treecol.setAttribute("id", this.prefix + attr);
		        treecol.setAttribute("persist", "hidden ordinal width");
		        treecol.setAttribute("flex", "4");
                this.setLabels(treecol, attr);
                this.treecols[attr] = treecol;
		        return treecol;
            },

            appendTreecol: function (threadCols, attr) {
                threadCols.appendChild(this.createSplitter());
                threadCols.appendChild(this.createTreecol(attr));
            },

            // set columns
            setThreadCols: function () {
		        var threadCols = document.getElementById('threadCols');
                for (var attr in this.attrEnabled) {
                    var treecol = this.treecols[attr];
                    
                    if (this.attrEnabled[attr])
                        treecol ? this.setLabels(treecol, attr) :
                                  this.appendTreecol(threadCols, attr);
                    else if (treecol) {
                        threadCols.removeChild(treecol);
                        this.treecols[attr] = null;
                    }
                }
            },

            loadPreferences: function () {
                this.attrEnabled = new Object;
                var branch = Preference.getBranch("attr.enabled.");
                var attrs = branch.getChildList("", {});
                for (var attr; attr = attrs.shift();)
                    this.attrEnabled[attr] = branch.getBoolPref(attr);
            },

            setColumns: function () {
                this.loadPreferences();
                this.setThreadCols();
                if (GetDBView())
                    this.addColumnHandlers();
                else {
                    Service.getService("observer-service;1", "nsIObserverService")
                           .addObserver(ThreadPane, "MsgCreateDBView", false);
                }
            },

            init: function () {
                this.setColumns();
                Preference.addObserver("attr.", this);
            },

            // Implement nsIObserver interface
            observe: function (subject, topic, data) {
                switch (topic) {
                case "nsPref:changed": // nsIPrefBranch2
                    this.setColumns();
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
