/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.Config = {

            JSON: {

                parse: function (string) {
                    const columns = string.slice(2,-2).split("},{");
                    for (var i = 0; i < columns.length; i++) {
                        const items = columns[i].split(",");
                        const obj = new Object;
                        for (var j = 0; j < items.length; j++) {
                            const keyvalue = items[j].split(":");
                            const key = keyvalue[0].slice(1, -1);
                            var value = keyvalue[1];
                            if (value.charAt(0) == '"')
                                value = value.slice(1, -1);
                            obj[key] = value.replace('\\x2c', ',', 'g');
                        }
                        columns[i] = obj;
                    }
                    return columns;
                },

                stringify: function (columns) {
                    const str = new Array;
                    for (var i = 0; i < columns.length; i++) {
                        const column = columns[i];
                        const strs = new Array;
                        for (var key in column) {
                            var value = column[key];
                            if (key != "enabled")
                                value = '"' + value.replace(',', '\\x2c', 'g') + '"';
                            strs.push('"' + key + '":' + value);
                        }
                        str.push('{' + strs.join(',') + '}');
                    }
                    const string = '[' + str.join(',') + ']';
                    return string;
                },
            },

            loadColumns: function () {
                var string = Preference.getLocalizedString("columns");
                return this.JSON.parse(string);
            },

            loadDefaultColumns: function () {
                var string = Preference.getDefaultLocalizedString("columns");
                return this.JSON.parse(string);
            },

            stringify: function (columns) {
                return this.JSON.stringify(columns);
            },

            init: function () {
                if (window["JSON"])
                    this.JSON = JSON;
            },

        };

        Config.init();
    }

})();
