/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.Config = {

            loadColumns: function () {
                var string = Preference.getLocalizedString("columns");
                return JSON.parse(string);
            },

            loadDefaultColumns: function () {
                var string = Preference.getDefaultLocalizedString("columns");
                return JSON.parse(string);
            },

            saveColumns: function (columns) {
                return JSON.stringify(columns);
            }

        };

    }

})();
