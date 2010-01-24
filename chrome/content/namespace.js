/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function (namespace) {

    // define a namespace (dot-separated)
    const domains = namespace.split(".");
    var subdomain = window; // top-level domain
    for (var d; d = domains.shift(); subdomain = subdomain[d])
        if (!subdomain.hasOwnProperty(d))
            subdomain[d] = new Object;

})("{52b8c721-5d3a-4a2b-835e-d3f044b74351}");

// window.GUID is currently used for the namespace of this extension
