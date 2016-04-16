(function () {
    var Db = function () {
        var self;

        var constructor = function () {
            self = this;
            this.db = null;
            this.dbEvent = new Event('dbReady');
            //this.dbEvent.initEvent('dbReady', true, true);
        };

        constructor.prototype.onReady = function() {
            //dbEvent.initEvent('tabFocused', true, true);
            //tabContents[self.currentTab - 1].dispatchEvent(tabEvent);
        };

        constructor.prototype.initialize = function (callback) {
            if (window.Cordova != undefined) {
                document.addEventListener('deviceready', function () {
                    self.db = window.sqlitePlugin.openDatabase({ name: "animecheck.db" });

                    if ( typeof callback == 'function' ) {
                        callback();
                    }

                    self.createTables(function() {
                        self.initializeData(function() {
                            document.dispatchEvent(self.dbEvent);
                        });
                    });
                }, false);
            } else {
                self.db = window.openDatabase('animecheck', '1.0', 'animecheck', 2 * 1024 * 1024);

                if (typeof callback == 'function') {
                    callback();
                }

                self.createTables(function () {
                    self.initializeData(function () {
                        document.dispatchEvent(self.dbEvent);
                    });
                });
            }
        };

        constructor.prototype.resToArray = function(rows) {
            var newRows = [];

            for (var i = 0; i < rows.length; i++) {
                if (window.Cordova != undefined) {
                    newRows.push(rows.item(i));
                } else {
                    newRows.push(rows[i]);
                }
            }

            return newRows;
        };

        constructor.prototype.query = function (sql, callback) {
            self.db.transaction(function (tx) {
                tx.executeSql(sql, [], function (tx, res) {
                    if (typeof callback == 'function') {
                        callback( self.resToArray(res.rows) );
                    }
                });
            });
        };

        constructor.prototype.executeBatch = function (list, callback) {
            var executed = 1;
            for (var i = 0; i < list.length; i++) {
                self.query(list[i], function() {
                    executed++;

                    if (executed == list.length) {
                        if (typeof callback == 'function') {
                            callback();
                        }
                    }
                });
            }
        };

        constructor.prototype.dropTables = function () {
            var batchList = [];

            batchList.push('DROP TABLE AC_INFO');
            batchList.push('DROP TABLE AC_SERIE');
            batchList.push('DROP TABLE AC_LIST');
            batchList.push('DROP TABLE AC_SERIE_LIST');

            self.executeBatch(batchList);
        };

        constructor.prototype.createTables = function (callback) {
            var batchList = [],
                prefix = 'CREATE TABLE IF NOT EXISTS ';

            batchList.push(prefix + 'AC_INFO (APP_VERSION real, APP_DT_INSTALL text, DEVICE_UUID text, DEVICE_MODEL text, DEVICE_PLATFORM text, DEVICE_VERSION real)');
            batchList.push(prefix + 'CREATE TABLE IF NOT EXISTS AC_SERIE_CACHE (CACHE_ID integer primary key, CACHE_TITLE text, CACHE_TITLE_JP text, CACHE_IMG text, CACHE_SCORE real, CACHE_STATUS text, CACHE_GENRES text, CACHE_EPI_CHA integer, CACHE_SEASON_VOL integer, CACHE_SYNONYMS text)');
            batchList.push(prefix + 'AC_SERIE (SERIE_ID integer primary key autoincrement, SERIE_EXT_ID integer, SERIE_TYPE text, SERIE_SEASON integer, SERIE_NUM integer, SERIE_DTEDITION text)');
            batchList.push(prefix + 'AC_LIST (LIST_ID integer primary key autoincrement, LIST_NAME text, LIST_DTEDITION text)');
            batchList.push(prefix + 'AC_SERIE_LIST (SL_ID integer primary key autoincrement, SL_SERIE_ID integer, SL_LIST_ID integer, SL_TYPE, SL_DTEDITION text)');

            self.executeBatch(batchList, callback);
        };

        constructor.prototype.initializeData = function (callback) {
            var batchList = [],
                prefix = 'INSERT INTO ';

            self.query('SELECT COUNT(*) AS "count" FROM AC_INFO', function(res) {
                if (res[0].count == 0) {
                    batchList.push(prefix + "AC_INFO (APP_VERSION, APP_DT_INSTALL, DEVICE_UUID, DEVICE_MODEL, DEVICE_PLATFORM, DEVICE_VERSION) VALUES ('1.0', '" + moment().format() + "', '" + device.uuid + "', '" + device.model + "', '" + device.platform + "', " + device.version + ")");

                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Assistindo', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Para Assistir', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Finalizados', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Dropados', '" + moment().format() + "')");

                    self.executeBatch(batchList, callback);
                } else {
                    if (typeof callback == 'function') {
                        callback();
                    }
                }
            });
        };

        // CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)

        return new constructor();
    };

    AC.Db = new Db();
}());