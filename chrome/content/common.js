/* -*- Mode: JavaScript; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

// common
(function () {

    // begin the namespace
    const SenderName = extensions["{52b8c721-5d3a-4a2b-835e-d3f044b74351}"];
    with (SenderName) {

        SenderName.ColumnInfo = {
            list: null,
            hash: null,

            prefs: [
                { name: "enabled", type: "bool", },
                { name: "field",   type: "char", },
                { name: "attr",    type: "char", },
                { name: "label",   type: "wstring", },
                { name: "format",  type: "wstring", },
            ],

            createColumn: function (i) {
                const column = new Object;
                const prefix = "column" + i;
                for each (var pref in this.prefs) {
                    var key = prefix + "." + pref.name;
                    column[pref.name] = Preference.getPref(key, pref.type);
                }
                column.id = (column.field == "free") ? column.format : column.field + "." + column.attr;
                column.index = i;
                return column;
            },

            loadPreference2: function () {
                this.list = new Array;
                this.hash = new Object;
	            const n = Preference.getIntPref("colnum");
                for (var i = 0; i < n; i++) {
                    const column = this.createColumn(i);
                    this.list[i] = column;
                    this.hash[column.id] = column;
                }
                for (; ; i++) {
                    var branch = Preference.getBranch("column" + i);
                    if (branch.getChildList("", {}).length == 0)
                        break;
                    branch.deleteBranch("");
                }
            },

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

    } // end namespace

})();
