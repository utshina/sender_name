/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {
        SenderName.Tasks = {
            id: "sender_name_options",
            pref_key: "others.append_menu_item",
            enabled: false,

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
                openDialog(optionsURL, "Preferences", "chrome,titlebar,toolbar,centerscreen");
            },

            appendMenuItem: function () {
                const menuitem = document.createElement("menuitem");
                menuitem.setAttribute("id", this.id);
                menuitem.setAttribute("label", Property.getString("options_title"));
                // menuitem.setAttribute("oncommand", "window['{52b8c721-5d3a-4a2b-835e-d3f044b74351}'].Tasks.openDialog();");
                menuitem.addEventListener("command", function () { window['{52b8c721-5d3a-4a2b-835e-d3f044b74351}'].Tasks.openDialog(); }, false);
                const taskPopup = document.getElementById("taskPopup");
                const separator = document.getElementById("devToolsSeparator");
                taskPopup.insertBefore(menuitem, separator);
                this.enabled = true;
            },

            removeMenuItem: function () {
                const menuitem = document.getElementById(this.id);
                const taskPopup = document.getElementById("taskPopup");
                taskPopup.removeChild(menuitem);
                this.enabled = false;
            },

            setMenuItem: function () {
                const appendMenuItem = Preference.getBoolPref(this.pref_key);
                if (appendMenuItem && !this.enabled)
                    this.appendMenuItem();
                else if (!appendMenuItem && this.enabled)
                    this.removeMenuItem();
            },

            observe: function (subject, topic, data) {
                if(topic != "nsPref:changed") return;
                this.setMenuItem();
            },

            init: function () {
                this.setMenuItem();
                Preference.addObserver(this.pref_key, this);
                return;
            }
        };
    }

})();
