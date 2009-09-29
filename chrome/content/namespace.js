/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name: namespace file
 *
 */

(function (namespace) {

    // define the namespace (generic enough to define any dot-separated namespace)
    var domains = namespace.split(".");
    var subdomain = this; // top-level domain
    for (var d; d = domains.shift(); subdomain = subdomain[d])
        if (typeof(subdomain[d]) == "undefined")
            subdomain[d] = new Object;

})("extensions.{52b8c721-5d3a-4a2b-835e-d3f044b74351}");
