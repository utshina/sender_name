            // Text-based overlay
            createColumnXML: function (id, attr) {
                var treecol = '<splitter class="tree-splitter" />' + 
                    '<treecol id="%id%" persist="hidden ordinal width" flex="2" label="%label%" tooltiptext="%tooltip%" />';
                var label = Preference.getLocalizedString("attr.label." + attr);
                var tooltip = Property.getFormattedString("tooltip", [label]);

                treecol = treecol.replace("%id%", id);
                treecol = treecol.replace("%label%", label);
                treecol = treecol.replace("%tooltip%", tooltip);
                return treecol;
            },

            loadOverlay: function () {
                var xml = '<?xml version="1.0"?>' + 
                    '<!DOCTYPE overlay SYSTEM "chrome://messenger/locale/addressbook/abCardOverlay.dtd">' + 
                    '<overlay id="sender_name" xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">' +
                    '<tree id="threadTree"><treecols id="threadCols">';
                var tail = '</treecols></tree></overlay>';

                for (var id in this.attrList)
                    xml += this.createColumnXML(id, this.attrList[id]);
                xml += tail;
                var uri = "data:application/vnd.mozilla.xul+xml," + xml;
                document.loadOverlay(uri, null);
            },

