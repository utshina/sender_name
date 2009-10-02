            delUserPref: function (key) {
                if (this.branch.prefHasUserValue(key))
                    this.branch.clearUserPref(key);
            },

            disableBoolPref: function(key) {
                this.branch.setBoolPref(key, true);
                if (this.branch.prefHasUserValue(key))
                    this.branch.clearUserPref(key);
                else
                    this.branch.setBoolPref(key, false);
            },

            setUnicodePref: function (key, value) {
                var str = Service.getService("supports-string;1", "nsISupportsString");
                str.data = value;
                this.branch.setComplexValue(key, this.nsISupportsString, str);
            },





            getDefaultLocalizedString: function (key) {
                return this.defaultBranch.getComplexValue(key, this.nsIPrefLocalizedString).data;
            },

            getDefaultUnicodePref: function (key) {
                return this.defaultBranch.getComplexValue(key, this.nsISupportsString).data;
            },

