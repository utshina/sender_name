/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

(function () {

    const SenderName = window["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.ColumnInfo = {
            list: null,
            hash: null,

            loadPreference: function () {
                this.list = new Array;
                this.hash = new Object;
                const pref = Preference.getLocalizedString("columns");
                const columns = eval(pref);
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    column.id = (column.field == "custom") ? column.format : column.field + "." + column.attr;
                    column.index = i;
                    this.list[i] = column;
                    this.hash[column.id] = column;
                }
            },

            getColumns: function () {
                this.loadPreference();
                return this.hash;
            },

            getColumnList: function () {
                this.loadPreference();
                return this.list;
            },

        };

    }

})();
