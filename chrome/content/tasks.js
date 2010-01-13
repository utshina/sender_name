/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        SenderName.Tasks = {
            openDialog: function () {
                const optionsURL = "chrome://sender_name/content/options.xul";
                const wm = Service.getService("appshell/window-mediator;1", "nsIWindowMediator");
                const windows = wm.getEnumerator(null);
                while (windows.hasMoreElements()) {
                    var win = windows.getNext();
                    if (win.document.documentURI == optionsURL) {
                        win.focus();
                        return;
                    }
                }

                // var instantApply = gPref.getBoolPref("browser.preferences.instantApply");
                openDialog(optionsURL, "Preferences", "chrome,titlebar,toolbar,centerscreen");
            },
        };
    }

})();
