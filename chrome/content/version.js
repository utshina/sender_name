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
                }

            };

        } 

    } // end namespace

})();
