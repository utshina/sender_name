/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * Sender Name 0.3: tasks file
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
	SenderName.Tasks = {
	    openDialog: function () {
		const optionsURL = "chrome://sender_name/content/options.xul";

		var wm = Service.getService("appshell/window-mediator;1", "nsIWindowMediator");
		var windows = wm.getEnumerator(null);
		while (windows.hasMoreElements()) {
		    var win = windows.getNext();
		    if (win.document.documentURI == optionsURL) {
			win.focus();
			return;
		    }
		}

		// var instantApply = gPref.getBoolPref("browser.preferences.instantApply");
		openDialog(optionsURL, "", "chrome,titlebar,toolbar,centerscreen");
	    },
	};
    }

})();
