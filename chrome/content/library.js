/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        
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
            getDefaultBranch: function (key) { return this.prefs.getDefaultBranch(this.prefix + key); },
        };

        SenderName.Preference = {
            branch: PreferenceRoot.getBranch(""),
            default_branch: PreferenceRoot.getDefaultBranch(""),

            getBranch: function (key) { return PreferenceRoot.getBranch(key); },
            getBoolPref: function (key) { return this.branch.getBoolPref(key); },
            setBoolPref: function (key, value) { return this.branch.setBoolPref(key, value); },
            getCharPref: function (key) { return this.branch.getCharPref(key); },
            setCharPref: function (key, value) { return this.branch.setCharPref(key, value); },
            getIntPref: function (key) { return this.branch.getIntPref(key); },
            setIntPref: function (key, value) { return this.branch.setIntPref(key, value); },
            prefHasUserValue: function(key) { return this.branch.prefHasUserValue(key); },
            getPrefType: function (key) { return this.branch.getPrefType(key);  },
            clearUserPref: function (key) { return this.branch.clearUserPref(key);  },

            getLocalizedString: function (key) {
                return this.branch.getComplexValue(key, Components.interfaces.nsIPrefLocalizedString).data;
            },

            getUnicodePref: function (key) {
                return this.branch.getComplexValue(key, Components.interfaces.nsISupportsString).data;
            },

            getDefaultLocalizedString: function (key) {
                return this.default_branch.getComplexValue(key, Components.interfaces.nsIPrefLocalizedString).data;
            },

            addObserver: function (key, observer) {
                this.branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this.branch.addObserver(key, observer, false);      
            },

        };

        SenderName.Property = {
            prefix: "extensions.sender_name.",
            bundle: Service.getService("intl/stringbundle;1", "nsIStringBundleService")
                           .createBundle("chrome://sender_name/locale/sender_name.properties"),

            getFormattedString: function (key, array) {
                return this.bundle.formatStringFromName(this.prefix + key, array, array.length);
            },
        };

        SenderName.Log = {
            console: Service.getService("consoleservice;1", "nsIConsoleService"),

            put: function (str) {
                this.console.logStringMessage(str);
            },
        };

    } // end namespace

})();
