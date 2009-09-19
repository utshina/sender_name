/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name 0.3: main file
 *
 */

(function () {
    const namespace = "jp.ac.tsukuba.cs.shina.SenderName";

    // define the namespace
    var as = namespace.split("."); var ns = this;
    for (var a; a = as.shift(); ns = ns[a])
        if (typeof(ns[a]) == "undefined")
	        ns[a] = new Object;

    // begin the namespace
    const SenderName = jp.ac.tsukuba.cs.shina.SenderName;
    with (jp.ac.tsukuba.cs.shina.SenderName) {

	    SenderName.ID = "{52b8c721-5d3a-4a2b-835e-d3f044b74351}";

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
            format_undefined: Preference.getComplexValue("format.undefined"),
            format_separator: Preference.getComplexValue("format.separator"),
            format_insep: Preference.getComplexValue("format.insep"),

            formatUndefined: function (attr, addr, name) {
                return attr == "displayName" ?
                    this.format_undefined.replace("%s", name ? name : addr) : "";
            },

            formatInsep: function (value) {
		        return this.format_insep.replace("%s", value);
            },

            formatAttrValue: function (line, attr) {
		        var addrs = new Object; var names = new Object; var fulls = new Object;
		        var values = new Array;

		        var count = this.headerParser.parseHeadersWithArray(line, addrs, names, fulls);
		        for (var i = 0; i < count; i++) {
                    var addr = addrs.value[i];
                    var card = AddressBook.getCard(addr);
                    var value = card ? card[attr] : this.formatUndefined(attr, addr, names.value[i]);
                    if (count > 0 && value.indexOf(this.format_separator.replace(/^\s+|\s+$/g, '')) >= 0)
			            value = this.formatInsep(value);
                    values.push(value);
		        }
		        return values.join(this.format_separator);
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
            prefix: "senderNameCol",
            attrList: new Object,

            // Text-based overlay
            createColumnXML: function (id, attr) {
		        var treecol = '<splitter class="tree-splitter" />' + 
                    '<treecol id="%id%" persist="hidden ordinal width" flex="2" label="%label%" tooltiptext="%tooltip%" />';
		        var label = Preference.getComplexValue("attr.label." + attr);
		        var tooltip = Property.getFormattedString("tooltip", [label]);

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
		        var cols = Preference.getBranch("attr.enabled.").getChildList("", {});
		        for (var i in cols) {
                    var attr = cols[i];
                    var enabled = Preference.getBoolPref("attr.enabled." + attr);
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
                    GetDBView().addColumnHandler(id, new ColumnHandler(this.attrList[id]));
            }
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

	    function onLoad () {
            AddressBook.init();
	        ThreadPane.init();
            Observer.register();
	    }

	    window.addEventListener("load", onLoad, false);

    } // end namespace

})();
