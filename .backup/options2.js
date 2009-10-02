/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name 0.3: options file
 *
 */

(function () {
    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.Options = {
            onAccept: function () {
                var checkboxes = document.getElementsByTagName("checkbox");
                for (var i = 0; i < checkboxes.length; i++) {
                    var checkbox = checkboxes.item(i);
                    var id = checkbox.id;
                    var attr = id.split(".")[0];
                    var key = "attr.enabled." + attr;
                    Preference.setBoolPref(key, checkbox.checked);

                    var textbox = document.getElementById(attr + ".label");
                    var key = "attr.label." + attr;
                    if (textbox.value)
                        Preference.setUnicodePref(key, textbox.value);
                    else
                        Preference.delUserPref(key);
                }

                var labels = document.getElementsByTagName("label");
                for (var i = 0; i < labels.length; i++) {
                    var label = labels.item(i);
                    var key = label.id.slice(0, -6);
                    var textbox = document.getElementById(key + ".string");
                    if (textbox.value)
                        Preference.setUnicodePref(key, textbox.value);
                    else
                        Preference.delUserPref(key);
                    
                }

//                 var windowMediator = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
//                 var messengerWindow = windowMediator.getMostRecentWindow("mail:3pane");
//                 var selection = messengerWindow.document.getElementById("folderTree").view.selection;
//                 var index = selection.currentIndex;
//                selection.select(0);
//                selection.select(index);

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
                        var label = Preference.getLocalizedString(key);
                        document.getElementById(attr + ".label").setAttribute("value", label);
                    }
                });

                // set format strings
                var formats = Preference.getBranch("format.").getChildList("", {});
                formats.forEach(function (attr) {
                    var key = "format." + attr;
                    if (Preference.prefHasUserValue(key)) {
                        var string = Preference.getUnicodePref(key);
                        document.getElementById(key + ".string").setAttribute("value", string);
                    }
                });


            },
        };

    } // end namespace

})();
