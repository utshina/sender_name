/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: library file
 *
 */

(function () {
    // I propose to use this format as the namespaces for extensions
    const namespace = "extensions.{52b8c721-5d3a-4a2b-835e-d3f044b74351}";

    // define the namespace (generic enough to define any dot-separated namespace)
    var domains = namespace.split(".");
    var subdomain = this; // top-level domain
    for (var d; d = domains.shift(); subdomain = subdomain[d])
        if (typeof(subdomain[d]) == "undefined")
            subdomain[d] = new Object;

    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        
        SenderName.ID = "{52b8c721-5d3a-4a2b-835e-d3f044b74351}";

        SenderName.Components = Components; // cache

        SenderName.Service = {
            getService: function (class, interface) {
                var class = Components.classes["@mozilla.org/" + class];
                if (class)
                    return class.getService(Components.interfaces[interface]);
                else
                    return null;
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
            defaultBranch: PreferenceRoot.getDefaultBranch(""),
            nsISupportsString: Components.interfaces.nsISupportsString,
            nsIPrefLocalizedString: Components.interfaces.nsIPrefLocalizedString,

            getBranch: function (key) { return PreferenceRoot.getBranch(key); },
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

            getDefaultLocalizedString: function (key) {
                return this.defaultBranch.getComplexValue(key, this.nsIPrefLocalizedString).data;
            },

            getLocalizedString: function (key) {
                return this.branch.getComplexValue(key, this.nsIPrefLocalizedString).data;
            },

            getDefaultUnicodePref: function (key) {
                return this.defaultBranch.getComplexValue(key, this.nsISupportsString).data;
            },

            getUnicodePref: function (key) {
                return this.branch.getComplexValue(key, this.nsISupportsString).data;
            },

            setUnicodePref: function (key, value) {
                var str = Service.getService("supports-string;1", "nsISupportsString");
                str.data = value;
                this.branch.setComplexValue(key, this.nsISupportsString, str);
            },



            addObserver: function (key, observer) {
                this.branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
                this.branch.addObserver(key, observer, false);      
            }
        };

        SenderName.Property = {
            bundle: Service.getService("intl/stringbundle;1", "nsIStringBundleService")
                           .createBundle("chrome://sender_name/locale/sender_name.properties"),

            getString: function (key) { return this.bundle.GetStringFromName(key); },
            getFormattedString: function (key, array) {
                return this.bundle.formatStringFromName(key, array, array.length);
            },
        };

        SenderName.LocalStore = {
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
                var RDF = Service.getService("rdf/rdf-service;1", "nsIRDFService");
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
        };

    } // end namespace

})();
