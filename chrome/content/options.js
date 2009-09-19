/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name 0.3: options file
 *
 */

(function () {
    const namespace = "jp.ac.tsukuba.cs.shina.SenderName";

    // define the namespace
    var as = namespace.split("."); var ns = this;
    for (var a; a = as.shift(); ns = ns[a])
        if (typeof(ns[a]) == "undefined")
	        ns[a] = new Object;

    // begin the namespace
    const SenderName = jp.ac.tsukuba.cs.shina.SenderName;
    with (jp.ac.tsukuba.cs.shina.SenderName) {

        SenderName.Options = {
            onAccept: function () {
                var checkboxes = document.getElementsByTagName("checkbox");
                for (var i = 0; i < checkboxes.length; i++) {
                    var checkbox = checkboxes.item(i);
                    var id = checkbox.id;
                    var attr = id.split(".")[0];
                    var key = "attr.enabled." + attr;
                    if (checkbox.checked)
                        Preference.setBoolPref(key, true);
                    else
                        Preference.disableBoolPref(key);

                    var textbox = document.getElementById(attr + ".label");
                    var key = "attr.label." + attr;
                    if (textbox.value)
                        Preference.setComplexValue(key, textbox.value);
                    else
                        Preference.delUserPref(key);
                }

                var labels = document.getElementsByTagName("label");
                for (var i = 0; i < labels.length; i++) {
                    var label = labels.item(i);
                    var key = label.id.slice(0, -6);
                    var textbox = document.getElementById(key + ".string");
                    if (textbox.value)
                        Preference.setComplexValue(key, textbox.value);
                    else
                        Preference.delUserPref(key);
                    
                }

                alert(jp.ac.tsukuba.cs.shina.SenderName);

                return true;
            },

            onLoad: function () {
                // set checkboxes
                var cols = Preference.getBranch("attr.enabled.").getChildList("", {});
                cols.forEach(function (attr) {
                    var enabled = Preference.getBoolPref("attr.enabled." + attr);
                    if (enabled)
                        document.getElementById(attr + ".enabled").setAttribute("checked", true);
                });

                // set alternate strings
                var labels = Preference.getBranch("attr.label.").getChildList("", {});
                labels.forEach(function (attr) {
                    var key = "attr.label." + attr;
                    if (Preference.prefHasUserValue(key)) {
                        var label = Preference.getComplexValue(key);
                        document.getElementById(attr + ".label").setAttribute("value", label);
                    }
                });

                // set format strings
                var formats = Preference.getBranch("format.").getChildList("", {});
                formats.forEach(function (attr) {
                    var key = "format." + attr;
                    if (Preference.prefHasUserValue(key)) {
                        var string = Preference.getComplexValue(key);
                        document.getElementById(key + ".string").setAttribute("value", string);
                    }
                });


            },
        };

    } // end namespace

})();
