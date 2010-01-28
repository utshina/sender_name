/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        // Thunderbird 3 or later
        if (Version.compare("3.0") >= 0) {

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
                },

            };

        } 

        // Thunderbird 2
        else
        {

            SenderName.AddressBook = {

                getAddressBooks: function () {
                    const RDF = Service.getService("rdf/rdf-service;1", "nsIRDFService");
                    const nsIAbDirectory = Components.interfaces.nsIAbDirectory;
                    const parentDir = RDF.GetResource("moz-abdirectory://").QueryInterface(nsIAbDirectory);
                    return parentDir.childNodes;
                },

                getAddressBookURI: function (addrbook) {
                    if (typeof(addrbook.getDirUri) == "function")
                        return addrbook.getDirUri();
                    return "";
                },

                checkInterface: function (addrbook) {
                    if (addrbook instanceof Components.interfaces.nsIAbMDBDirectory)
                        return addrbook;
                    return null;
                },

                addListener: function (listener) {
                    const addrbookSession = Service.getService("addressbook/services/session;1", "nsIAddrBookSession");
                    addrbookSession.addAddressBookListener(listener, Components.interfaces.nsIAddrBookSession.all);
                },

                getAttributeFromContact: function (card, attr) {
                    if (attr.charAt(0) == '_') attr = attr.substr(1);
                    attr = attr.charAt(0).toLowerCase() + attr.substr(1);
                    return card != null ? card[attr] : null;
                },
            };

            SenderName.JSON = {

                parse: function (string) {
                    const columns = string.slice(2,-2).split("},{");
                    for (var i = 0; i < columns.length; i++) {
                        const items = columns[i].split(",");
                        const obj = new Object;
                        for (var j = 0; j < items.length; j++) {
                            const keyvalue = items[j].split(":");
                            const key = keyvalue[0].slice(1, -1);
                            var value = keyvalue[1];
                            if (value.charAt(0) == '"')
                                value = value.slice(1, -1);
                            value = value.replace('\\x2c', ',', 'g');
                            if (key == "enabled")
                                value = value == "true" ? true : false;
                            obj[key] = value;
                        }
                        columns[i] = obj;
                    }
                    return columns;
                },

                stringify: function (columns) {
                    const str = new Array;
                    for (var i = 0; i < columns.length; i++) {
                        const column = columns[i];
                        const strs = new Array;
                        for (var key in column) {
                            var value = column[key];
                            if (key != "enabled")
                                value = '"' + value.replace(',', '\\x2c', 'g') + '"';
                            strs.push('"' + key + '":' + value);
                        }
                        str.push('{' + strs.join(',') + '}');
                    }
                    const string = '[' + str.join(',') + ']';
                    return string;
                },
            };

        } // end Thunderbird 2

    } // end namespace

})();
