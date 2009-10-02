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

