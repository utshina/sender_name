/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        // Thunderbird 3
        SenderName.Addressbook = {

            getAddressbooks: function () {
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                return abManager.directories;
            },

            getAddressbookURI: function (addrbook) {
                return addrbook.URI;
            },

            addListener: function (listener) {
                const abManager = Service.getService("abmanager;1", "nsIAbManager");
                abManager.addAddressBookListener(listener, Components.interfaces.nsIAbListener.all);
            },

            getAttributeFromContact: function (card, attr) {
                if (card != null)
                    dump(attr + ": " + card.getProperty(attr, null) + "\n");
                return card != null ? card.getProperty(attr, null) : null;
            },

        };

    } // end namespace

})();
