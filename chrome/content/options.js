/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name v0.3 (by Takahiro Shinagawa)
 *
 */

var SenderNameOptions = {

    onAccept: function () {
        var checkboxes = document.getElementsByTagName("checkbox");

        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes.item(i);
            var id = checkbox.id;
            var attr = id.split(".")[0];

            var key = "attr.enabled." + attr;
            if (checkbox.checked)
                SenderNameLibs.Preference.setBoolPref(key, true);
            else
                SenderNameLibs.Preference.disableBoolPref(key);

            var textbox = document.getElementById(attr + ".label");
            var key = "attr.label." + attr;
            if (textbox.value)
                SenderNameLibs.Preference.setComplexValue(key, textbox.value);
            else
                SenderNameLibs.Preference.delUserPref(key);
        }

        return true;
    },

    setCheckBoxes: function () {
        var cols = SenderNameLibs.Preference.getBranch("attr.enabled.").getChildList("", {});
        cols.forEach(function (attr) {
            var enabled = SenderNameLibs.Preference.getBoolPref("attr.enabled." + attr);
            if (enabled)
                document.getElementById(attr + ".enabled").setAttribute("checked", true);
        });

        var labels = SenderNameLibs.Preference.getBranch("attr.label.").getChildList("", {});
        labels.forEach(function (attr) {
            var key = "attr.label." + attr;
            if (SenderNameLibs.Preference.prefHasUserValue(key)) {
                var label = SenderNameLibs.Preference.getComplexValue(key);
                document.getElementById(attr + ".label").setAttribute("value", label);
            }
        });
    },

    onLoad: function () {
        SenderNameLibs.init();
        SenderNameOptions.setCheckBoxes();
    },
};