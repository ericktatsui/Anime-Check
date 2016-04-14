(function () {
    var Db = function () {
        var self;

        var constructor = function () {
            self = this;
            this.db = null;

            this.initialize(self.createTables);
        };

        constructor.prototype.initialize = function (callback) {
            if (window.Cordova != undefined) {
                document.addEventListener('deviceready', function () {
                    self.db = window.sqlitePlugin.openDatabase({ name: "animecheck.db" });

                    if ( typeof callback == 'function' ) {
                        callback();
                    }
                }, false);
            } else {
                self.db = window.openDatabase('animecheck', '1.0', 'animecheck', 2 * 1024 * 1024);

                if (typeof callback == 'function') {
                    callback();
                }
            }
        };

        constructor.prototype.resToItems = function(rows) {
            var newRows = [];

            for ( var i = 0; i < rows.length; i++ ) {
                newRows.push( rows.item(i) );
            }

            return newRows;
        };

        constructor.prototype.query = function (sql, callback) {
            self.db.transaction(function (tx) {
                tx.executeSql(sql, [], function (tx, res) {
                    if (window.Cordova != undefined && sql.toLowerCase().indexOf('select') != -1) {
                        res.rows = self.resToItems(res.rows);
                    }

                    if (typeof callback == 'function') {
                        callback(res.rows);
                    }
                });
            });
        };

        constructor.prototype.executeBatch = function (list) {
            for (var i = list.length; i--;) {
                self.query(list[i]);
            }
        };

        constructor.prototype.createTables = function () {
            var batchList = [],
                prefix = 'CREATE TABLE IF NOT EXISTS ';

            batchList.push(prefix + 'AC_SERIE (SERIE_ID integer primary key autoincrement, SERIE_ANIME_ID integer, SERIE_SEASON integer, SERIE_NUM integer, SERIE_DTEDITION text)');
            batchList.push(prefix + 'AC_LIST (LIST_ID integer primary key autoincrement, LIST_NAME text, LIST_DTEDITION text)');
            batchList.push(prefix + 'AC_SERIE_LIST (SL_ID integer primary key autoincrement, SL_NAME text, SL_DTEDITION text)');

            self.executeBatch(batchList);
        };

        // CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)

        return new constructor();
    };

    AC.Db = new Db();
}());