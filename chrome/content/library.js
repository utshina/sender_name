/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: library file
 *
 */

(function () {

    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        
        SenderName.ID = "{52b8c721-5d3a-4a2b-835e-d3f044b74351}";
        SenderName.Components = Components; // cache

        SenderName.Service = {
            getService: function (class, interface) {
                class = Components.classes["@mozilla.org/" + class];
                return class ? class.getService(Components.interfaces[interface]) : null;
            }
        };

        SenderName.PreferenceRoot = {
            prefix: "extensions.sender_name.",
            prefs: Service.getService("preferences-service;1", "nsIPrefService"),

            getBranch: function (key) { return this.prefs.getBranch(this.prefix + key); },
        };

        SenderName.Preference = {
            branch: PreferenceRoot.getBranch(""),

            getBranch: function (key) { return PreferenceRoot.getBranch(key); },
            getCharPref: function (key) { return this.branch.getCharPref(key); },
            setCharPref: function (key, value) { return this.branch.setCharPref(key, value); },
            getBoolPref: function (key) { return this.branch.getBoolPref(key); },
            setBoolPref: function (key, value) { return this.branch.setBoolPref(key, value); },
            prefHasUserValue: function(key) { return this.branch.prefHasUserValue(key); },

            getLocalizedString: function (key) {
                return this.branch.getComplexValue(key, Components.interfaces.nsIPrefLocalizedString).data;
            },

            getUnicodePref: function (key) {
                return this.branch.getComplexValue(key, Components.interfaces.nsISupportsString).data;
            },

            addObserver: function (key, observer) {
                this.branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this.branch.addObserver(key, observer, false);      
            }
        };

        SenderName.Property = {
            bundle: Service.getService("intl/stringbundle;1", "nsIStringBundleService")
                           .createBundle("chrome://sender_name/locale/sender_name.properties"),

            getFormattedString: function (key, array) {
                return this.bundle.formatStringFromName(key, array, array.length);
            },
        };

        SenderName.Options = {
            createDisplayNameColumn: Preference.getBoolPref("options.create_display_name_column"),
        };

    } // end namespace

})();
