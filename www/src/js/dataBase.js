(function () {
    var Db = function () {
        var self;

        var constructor = function () {
            self = this;
            this.db = null;
            this.dbEvent = new Event('dbReady');
            //this.dbEvent.initEvent('dbReady', true, true);
        };

        constructor.prototype.onReady = function () {
            //dbEvent.initEvent('tabFocused', true, true);
            //tabContents[self.currentTab - 1].dispatchEvent(tabEvent);
        };

        constructor.prototype.initialize = function (callback) {
            if (window.Cordova != undefined) {
                document.addEventListener('deviceready', function () {
                    self.db = window.sqlitePlugin.openDatabase({ name: "animecheck.db" });

                    if (typeof callback == 'function') {
                        callback();
                    }

                    self.modifications(function () {
                        self.createTables(function () {
                            self.initializeData(function () {
                                document.dispatchEvent(self.dbEvent);
                            });
                        });
                    });
                }, false);
            } else {
                self.db = window.openDatabase('animecheck', '1.0', 'animecheck', 2 * 1024 * 1024);

                if (typeof callback == 'function') {
                    callback();
                }

                self.modifications(function () {
                    self.createTables(function () {
                        self.initializeData(function () {
                            document.dispatchEvent(self.dbEvent);
                        });
                    });
                });
            }
        };

        constructor.prototype.resToArray = function (rows) {
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
                        callback(self.resToArray(res.rows), res.rowsAffected);
                    }
                });
            });
        };

        constructor.prototype.debug = function (query) {
            self.query(query, function (res) {
                console.log(res);
            });
        };

        constructor.prototype.executeBatch = function (list, callback) {
            var executed = 1;
            for (var i = 0; i < list.length; i++) {
                self.query(list[i], function () {
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
            batchList.push('DROP TABLE AC_USER');
            batchList.push('DROP TABLE AC_SERIE_CACHE');
            batchList.push('DROP TABLE AC_SERIE');
            batchList.push('DROP TABLE AC_LIST');
            batchList.push('DROP TABLE AC_SERIE_LIST');

            self.executeBatch(batchList);
        };

        constructor.prototype.modifications = function (callback) {
            //self.query('DROP TABLE AC_INFO', function () {
            //    self.query('CREATE TABLE AC_INFO ( APP_VERSION text, APP_DT_INSTALL text, DEVICE_UUID text, DEVICE_MODEL text, DEVICE_PLATFORM text, DEVICE_VERSION real )', callback);
            //});
            callback();
        };

        constructor.prototype.createTables = function (callback) {
            var batchList = [],
                prefix = 'CREATE TABLE IF NOT EXISTS ';

            batchList.push(prefix + 'AC_INFO ( APP_VERSION text, APP_DT_INSTALL text, DEVICE_UUID text, DEVICE_MODEL text, DEVICE_PLATFORM text, DEVICE_VERSION text )');
            batchList.push(prefix + 'AC_USER ( USER_ID integer primary key autoincrement, USER_NAME text, USER_EMAIL text, USER_PASSWORD text, USER_PHOTO text, USER_DTEDITION text )');
            batchList.push(prefix + 'AC_SERIE_CACHE ( CACHE_ID integer, CACHE_TYPE text, CACHE_TITLE text, CACHE_TITLE_JP text, CACHE_IMG text, CACHE_SCORE real, CACHE_STATUS text, CACHE_DTEND text, CACHE_DTSTART text, CACHE_YOUTUBEID text, CACHE_GENRES text, CACHE_DURATION text, CACHE_EPISODES text, CACHE_CHAPTERS text, CACHE_VOLUMES text, CACHE_SYNONYMS text, CACHE_DTEDITION )');
            batchList.push(prefix + 'AC_SERIE ( SERIE_ID integer primary key autoincrement, SERIE_EXT_ID integer, SERIE_TYPE text, SERIE_SEASON integer, SERIE_NUM integer, SERIE_DTEDITION text )');
            batchList.push(prefix + 'AC_LIST ( LIST_ID integer primary key autoincrement, LIST_NAME text, LIST_DTEDITION text )');
            batchList.push(prefix + 'AC_SERIE_LIST ( SL_ID integer primary key autoincrement, SL_SERIE_ID integer, SL_LIST_ID integer, SL_TYPE, SL_DTEDITION text )');

            self.executeBatch(batchList, callback);
        };

        constructor.prototype.initializeData = function (callback) {
            var batchList = [],
                prefix = 'INSERT INTO ';

            self.query('SELECT COUNT(*) AS "count" FROM AC_INFO', function (res) {
                if (res[0].count == 0) {
                    batchList.push(prefix + "AC_INFO (APP_VERSION, APP_DT_INSTALL, DEVICE_UUID, DEVICE_MODEL, DEVICE_PLATFORM, DEVICE_VERSION) VALUES ('0.1.5', '" + moment().format() + "', '" + device.uuid + "', '" + device.model + "', '" + device.platform + "', '" + device.version + "')");

                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Assistindo', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Para Assistir', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Animes Finalizados', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Animes Dropados', '" + moment().format() + "')");

                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Lendo', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Para Ler', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Mangás Finalizados', '" + moment().format() + "')");
                    batchList.push(prefix + "AC_LIST (LIST_NAME, LIST_DTEDITION) VALUES ('Mangás Dropados', '" + moment().format() + "')");

                    self.executeBatch(batchList, callback);
                } else {
                    if (typeof callback == 'function') {
                        callback();

                        self.update('AC_INFO', '', {
                            APP_VERSION: '0.1.5'
                        });
                    }
                }
            });
        };

        constructor.prototype.mountInsert = function (table, data) {
            var sql = 'INSERT INTO ' + table,
                fields = '',
                values = '';

            for (var key in data) {
                if (data[key] != null && data[key] != undefined) {
                    fields += key + ', ';

                    if (typeof data[key] == 'string') {
                        values += "'" + data[key] + "', ";
                    } else if (typeof data[key] == 'number') {
                        values += data[key] + ", ";
                    }
                }
            }

            fields = fields.substr(0, fields.length - 2);
            values = values.substr(0, values.length - 2);

            sql += ' (' + fields + ') VALUES (' + values + ')';

            return sql;
        };

        constructor.prototype.mountUpdate = function (table, condition, data) {
            var sql = 'UPDATE ' + table + ' SET ',
                fieldsValues = '';

            for (var key in data) {
                if (data[key] != null && data[key] != undefined) {
                    fieldsValues += key + ' = ';

                    if (typeof data[key] == 'string') {
                        fieldsValues += "'" + data[key] + "', ";
                    } else if (typeof data[key] == 'number') {
                        fieldsValues += data[key] + ", ";
                    }
                }
            }

            fieldsValues = fieldsValues.substr(0, fieldsValues.length - 2);

            sql += fieldsValues;

            if (condition != undefined && condition != '' && condition != null && condition != false) {
                sql += ' WHERE ' + condition;
            }

            return sql;
        };

        constructor.prototype.insert = function (table, data, callback) {
            var sql = self.mountInsert(table, data);

            self.query(sql, callback);
        };

        constructor.prototype.update = function (table, condition, data, callback) {
            var sql = self.mountUpdate(table, condition, data);

            self.query(sql, callback);
        };

        constructor.prototype.remove = function (table, condition, callback) {
            var sql = 'DELETE FROM ' + table;

            if (condition != undefined && condition != '' && condition != null && condition != false) {
                sql += ' WHERE ' + condition;
            }

            self.query(sql, callback);
        };

        constructor.prototype.delete = constructor.prototype.remove;

        return new constructor();
    };

    AC.Db = new Db();
}());