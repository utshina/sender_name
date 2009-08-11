/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name v0.3 (by Takahiro Shinagawa)
 *
 */

var SenderNameLibs = {

    getService: function (class, interface) {
        return Components.classes["@mozilla.org/" + class].getService(Components.interfaces[interface]);
    },

    Preference: {
        prefix: "extensions.sender_name.",

        getBranch: function (key) { return this.prefs.getBranch(this.prefix + key); },
        getCharPref: function (key) { return this.branch.getCharPref(key); },
        setCharPref: function (key, value) { return this.branch.setCharPref(key, value); },
        getBoolPref: function (key) { return this.branch.getBoolPref(key); },
        setBoolPref: function (key, value) { return this.branch.setBoolPref(key, value); },
        prefHasUserValue: function(key) { return this.branch.prefHasUserValue(key); },

        delUserPref: function (key) {
            if (this.branch.prefHasUserValue(key))
                this.branch.clearUserPref(key);
        },

        disableBoolPref: function(key) {
            this.branch.setBoolPref(key, true);
            if (this.branch.prefHasUserValue(key))
                this.branch.clearUserPref(key);
            else
                this.branch.setBoolPref(key, false);
        },

        getComplexValue: function(key) {
            return this.branch.getComplexValue(key, Components.interfaces.nsIPrefLocalizedString).data;
        },

        setComplexValue: function(key, value) {
            var str = SenderNameLibs.getService("supports-string;1", "nsISupportsString");
            str.data = value;
            this.branch.setComplexValue(key, Components.interfaces.nsISupportsString, str);
        },

        init: function () {
            this.prefs = SenderNameLibs.getService("preferences-service;1", "nsIPrefService");
            this.branch = this.prefs.getBranch(this.prefix);
        },
    },

    Property: {
        getString: function (key) { return this.bundle.GetStringFromName(key); },
        getFormattedString: function (key, array) {
            return this.bundle.formatStringFromName(key, array, array.length);
        },
        init: function () {
            this.bundle = SenderNameLibs.getService("intl/stringbundle;1", "nsIStringBundleService")
            .createBundle("chrome://sender_name/locale/sender_name.properties");
        },
    },

    LocalStore: {
        nsIRDFDataSource: Components.interfaces.nsIRDFDataSource,
        nsIRDFResource: Components.interfaces.nsIRDFResource,
        nsIRDFLiteral: Components.interfaces.nsIRDFLiteral,

        setAttrToElement: function (element, resource, ds) {
            var arc = ds.ArcLabelsOut(resource);
            while (arc.hasMoreElements()) {
                var attr = arc.getNext().QueryInterface(this.nsIRDFResource);
                var target = ds.GetTargets(resource, attr, true);
                while (target.hasMoreElements()) {
                    var literal = target.getNext();
                    if (literal instanceof this.nsIRDFLiteral) {
                        var value = literal.QueryInterface(this.nsIRDFLiteral);
                        element.setAttribute(attr.Value, value.Value);
                    }
                }
            }
        },

        setAttribute: function (elements, baseURI) {
            var RDF = this.getService("rdf/rdf-service;1", "nsIRDFService");
            var DS = RDF.GetDataSource("rdf:local-store").QueryInterface(this.nsIRDFDataSource);
            var allResource = DS.GetAllResources();
            while (allResource.hasMoreElements()){
                var resource = allResource.getNext().QueryInterface(this.nsIRDFResource);
                for (var attr in elements) {
                    var e = elements[attr];
                    if (resource.Value == baseURI + "#" + e.id)
                        this.setAttrToElement(e, resource, DS);
                }
            }
        }
    },

    init: function () {
	    this.Preference.init();
	    this.Property.init();
    },
};
