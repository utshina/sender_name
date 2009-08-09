/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name v0.3 (by Takahiro Shinagawa)
 *
 */

var SenderName = {

    ID: "{52b8c721-5d3a-4a2b-835e-d3f044b74351}",

    AddressBook: {
        addrDBs: new Array(),
        cardCache: new Object(),

        getCardFromDB: function (addr) {
            var card = null;
            for (var i in this.addrDBs) {
                card = this.addrDBs[i].getCardFromAttribute(null, "LowercasePrimaryEmail", addr, true);
                if (card != null)
                    break;
                card = this.addrDBs[i].getCardFromAttribute(null, "SecondEmail", addr, true);
                if (card != null)
                    break;
            }
            return card;
        },

        getCard: function (addr) {
            if (this.cardCache[addr] == undefined)
                this.cardCache[addr] = this.getCardFromDB(addr);
            return this.cardCache[addr];
        },

        flush: function () { cardCache = new Object(); },

        init: function () {
            var nsIAddressBook = SenderNameLibs.getService("addressbook;1", "nsIAddressBook");
            var nsIRDFService = SenderNameLibs.getService("rdf/rdf-service;1", "nsIRDFService");
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
        }
    },

    Formatter: {
        undef_format: "(%s)",
        incom_format: '"%s"',
        separator: ", ",

        formatUndef: function (attr, addr, name) {
            var value = "";
            if (attr == "displayName")
                value = this.undef_format.replace("%s", name ? name : addr);
            return value;
        },

        formatCommaIncluded: function (value) {
            return this.incom_format.replace("%s", value);
        },

        formatAttrValue: function (line, attr) {
            var addrs = new Object; var names = new Object; var fulls = new Object; var count = 0;
            var values = new Array;

            count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls, count);
            for (var i = 0; i < count; i++) {
                var addr = addrs.value[i];
                var card = SenderName.AddressBook.getCard(addr);
                var value = card ? card[attr] : this.formatUndef(attr, addr, names.value[i]);
                if (count > 1 && value.indexOf(',') >= 0)
                    value = this.formatCommaIncluded(value);
                values.push(value);
            }
            return values.join(this.separator);
        },

        init: function () {
            this.headerParser = SenderNameLibs.getService("messenger/headerparser;1", "nsIMsgHeaderParser");
        },
    },

    ColumnHandler: function (attr) {
        this.attr = attr;
        this.cache = new Object();
    },

    ColumnHandler_init: function () {
        SenderName.ColumnHandler.prototype = {
            flush: function () { this.cache = new Object(); },

            getAttributeValue: function (hdr) {
                var uri = hdr.folder.getUriForMsg(hdr);
                var author = hdr.mime2DecodedAuthor;

                // should use nsIAddrDBAnnouncer
                if (this.cache[uri] == undefined)
                    this.cache[uri] = SenderName.Formatter.formatAttrValue(author, this.attr);
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

            isEditable:        function (row, col) { return false; },
            cycleCell:         function (row, col) { },
            isString:          function () { return true; },
            getCellProperties: function (row, col, props) {},
            getRowProperties:  function (row, props) {},
            getImageSrc:       function (row, col) { return null; },
            getSortLongForRow: function (hdr) { return 0; },
        };
    },

    ThreadPane: {
        prefix: "senderNameCol",
        attrList: new Object,

        // createElement-based
        createSplitter: function () {
            var splitter = document.createElement("splitter");
            splitter.setAttribute("class", "tree-splitter");
            return splitter;
        },

        createTreecol: function (id, attr) {
            var treecol = document.createElement("treecol");
            var label = SenderNameLibs.Property.getString(attr);
            var tooltip = SenderNameLibs.Property.getFormattedString("tooltip", [label]);

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
            SenderNameLibs.LocalStore.setAttribute(elements, threadCols.baseURI);
        },

        // Text-based overlay
        createColumnXML: function (id, attr) {
            var treecol = '<splitter class="tree-splitter" />' + 
                '<treecol id="%id%" persist="hidden ordinal width" flex="2" label="%label%" tooltiptext="%tooltip%" />';
            var label = SenderNameLibs.Preference.getComplexValue("attr.label." + attr);
            var tooltip = SenderNameLibs.Property.getFormattedString("tooltip", [label]);

            treecol = treecol.replace("%id%", id);
            treecol = treecol.replace("%label%", label);
            treecol = treecol.replace("%tooltip%", tooltip);
            return treecol;
        },

        loadOverlay: function () {
            var xml = '<?xml version="1.0"?>' + 
                '<!DOCTYPE overlay SYSTEM "chrome://messenger/locale/addressbook/abCardOverlay.dtd">' + 
                '<overlay id="sender_name" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">' +
                '<tree id="threadTree"><treecols id="threadCols">';
            var tail = '</treecols></tree></overlay>';

            for (var id in this.attrList)
                xml += this.createColumnXML(id, this.attrList[id]);
            xml += tail;
            var uri = "data:application/vnd.mozilla.xul+xml," + xml;
            document.loadOverlay(uri, null);
        },

        loadPreferences: function () {
            var cols = SenderNameLibs.Preference.getBranch("attr.enabled.").getChildList("", {});
            for (var i in cols) {
                var attr = cols[i];
                var enabled = SenderNameLibs.Preference.getBoolPref("attr.enabled." + attr);
                if (enabled) {
                    var id = this.prefix + "." + attr;
                    this.attrList[id] = attr;
                }
            }
        },

        init: function () {
            this.loadPreferences();
            this.loadOverlay();        // text-based overlay
            // this.loadElements();        // element-based overlay
        },

        addColumnHandlers: function () {
            for (var id in this.attrList)
                GetDBView().addColumnHandler(id, new SenderName.ColumnHandler(this.attrList[id]));
        }
    },

    Observer: {
        // Implement nsIObserver interface
        observe: function (subject, topic, data) {
            SenderName.ThreadPane.addColumnHandlers();
        },

        register: function () {
            if (gSearchView)
                SenderName.ThreadPane.addColumnHandlers();
            else {
                SenderNameLibs.getService("observer-service;1", "nsIObserverService")
                .addObserver(this, "MsgCreateDBView", false);
            }
        }
    },

    init: function () {
        SenderNameLibs.init();
        this.ColumnHandler_init();
        this.AddressBook.init();
        this.Formatter.init();
        this.ThreadPane.init();
        this.Observer.register();
    },
};

window.addEventListener("load", function () { SenderName.init(); }, false);
