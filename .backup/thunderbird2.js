/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        // Thunderbird 2.0
        SenderName.Addressbook = {

            getAddressbooks: function () {
                const RDF = Service.getService("rdf/rdf-service;1", "nsIRDFService");
                const nsIAbDirectory = Components.interfaces.nsIAbDirectory;
                const parentDir = RDF.GetResource("moz-abdirectory://").QueryInterface(nsIAbDirectory);
                return parentDir.childNodes;
            },

            getAddressbookURI: function (addrbook) {
                if (addrbook instanceof Components.interfaces.nsIAbMDBDirectory &&
                         typeof(addrbook.getDirUri) == "function")
                    return addrbook.getDirUri();
                return "";
            },

            addListener: function (listener) {
                const addrbookSession = Service.getService("addressbook/services/session;1", "nsIAddrBookSession");
                addrbookSession.addAddressBookListener(listener, Components.interfaces.nsIAddrBookSession.all);
            },

            getAttributeFromContact: function (card, attr) {
                attr = attr.charAt(0).toLowerCase() + attr.substr(1);
                return card != null ? card[attr] : null;
            },
        };

    } // end namespace

})();
