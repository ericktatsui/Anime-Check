/// <reference path="../../lib/angular/angular.min.js" />
/// <reference path="../../src/js/initialize.js" />
/// <reference path="../../src/js/tools.js" />
/// <reference path="../../src/js/models.js" />
/// <reference path="../../src/js/material-design.js" />

var app = angular.module('AnimeCheck', ['ui.router']);

// GLOBALS
var CONFIG = {
    enableDebug: false,
    apiUrl: 'https://anilist.co/api/',
    debugUrl: 'http://ericktatsui.com.br/anime-check/',
    currentYear: (new Date()).getFullYear()
};

// CACHE
var TEMP = {
    animeList: null,
    mangaList: null,
    movieList: null
};

app.run(function ($rootScope, $state) {
    $rootScope.cutName = function (name) {
        var newName = name;

        if (name && name.length >= 40) {
            newName = name.substr(0, 40);
            newName += "...";
        }

        return newName;
    };

    $rootScope.menuAction = function (pageName) {
        AC.TouchMenu.close();
        $state.go(pageName);
    };
});

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/splash");

    $stateProvider
    .state('splash', {
        url: '/splash',
        templateUrl: 'view/splash.html',
        controller: 'SplashCtrl'
    })
    .state('.menu', {
        templateUrl: 'view/menu.html',
        controller: 'MenuCtrl'
    })
    .state('main', {
        url: '/main',
        templateUrl: 'view/main.html'
    })
    .state('registration', {
        url: '/registration',
        templateUrl: 'view/registration.html',
        controller: 'RegistrationCtrl'
    })
	.state('home', {
	    url: '/home',
	    views: {
	        '': {
	            templateUrl: 'view/home.html',
	            controller: 'HomeCtrl'
	        },
	        'animes@home': {
	            templateUrl: 'view/series.html',
	            controller: 'HomeTabAnimesCtrl'
	        },
	        'mangas@home': {
	            templateUrl: 'view/series.html',
	            controller: 'HomeTabMangasCtrl'
	        }
	    }
	})
    .state('all-my', {
        url: '/all-my',
        views: {
            '': {
                templateUrl: 'view/all-my.html',
                controller: 'MySeriesCtrl'
            },
            'animes@all-my': {
                templateUrl: 'view/series.html',
                controller: 'MySeriesTabAnimesCtrl'
            },
            'mangas@all-my': {
                templateUrl: 'view/series.html',
                controller: 'MySeriesTabMangasCtrl'
            }
        }
    })
    .state('category', {
        url: '/category/:name',
        views: {
            '': {
                templateUrl: 'view/by-category.html',
                controller: 'CategoryCtrl'
            },
            'animes@category': {
                templateUrl: 'view/series.html',
                controller: 'CategoryTabAnimesCtrl'
            },
            'mangas@category': {
                templateUrl: 'view/series.html',
                controller: 'CategoryTabMangasCtrl'
            }
        }
    })
    .state('categoryList', {
        url: '/category-list',
        templateUrl: 'view/category-list.html',
        controller: 'CategoryListCtrl'
    })
	.state('series', {
	    url: '/series',
	    templateUrl: 'view/series.html',
	    controller: 'TabAnimesCtrl'
	})
	.state('serie', {
	    url: '/serie/:type/:id',
	    views: {
	        '': {
	            templateUrl: 'view/serie.html',
	            controller: 'SerieCtrl'
	        },
	        'include@serie': {
	            templateUrl: function (stateParams) {
	                return 'view/serie.' + stateParams.type + '.html';
	            },
	            controllerProvider: function ($stateParams) {
	                // captaliza o parametro
	                return 'Serie' + $stateParams.type.charAt(0).toUpperCase() + $stateParams.type.slice(1).toLowerCase() + 'Ctrl';
	            }
	        }
	    }
	})
    .state('list', {
        url: '/list/:id',
        views: {
            '': {
                templateUrl: 'view/list.html',
                controller: 'ListCtrl',
            },
            'series@list': {
                templateUrl: 'view/series.html',
                controller: 'ListSeriesCtrl'
            }
        }
    })
    .state('lists', {
        url: '/lists',
        templateUrl: 'view/lists.html',
        controller: 'ListsCtrl'
    })
	.state('search', {
	    url: '/search/:term?',
	    views: {
	        '': {
	            templateUrl: 'view/search.html',
	            controller: 'SearchCtrl',
	        },
	        'anime-search@search': {
	            templateUrl: 'view/series.html',
	            controller: 'SearchTabAnimesCtrl'
	        },
	        'manga-search@search': {
	            templateUrl: 'view/series.html',
	            controller: 'SearchTabMangasCtrl'
	        }
	    }
	});
});

app.service('$acRequest', function ($http) {
    this.get = function (url, success, error) {
        var requestOpt = {
            method: 'GET',
            url: url
        };

        $http(requestOpt)
			.success(success)
			.error(error);
    };

    this.post = function (url, data, success, error) {
        var requestOpt = {
            method: 'POST',
            url: url,
            //headers: {
            //    'Access-Control-Allow-Origin' : 'http://localhost:8080',
            //    'Authorization': 'Bearer access_token',
            //    'Content-Type': 'application/x-www-form-urlencoded'
            //},
            //credentials: true,
            data: data
        };

        $http(requestOpt)
			.success(success)
			.error(error);
    }

    this.custom = function (options, success, error) {
        $http(options)
			.success(success)
			.error(error);
    }
});

app.service('$acApi', function ($rootScope, $acRequest, $Cache) {
    this.getTokenApi = function (callback) {
        var accessToken = null;

        if (localStorage["accessToken"]) {
            accessToken = JSON.parse(localStorage["accessToken"]);
        }

        if (!accessToken || accessToken.date < (new Date()).getTime()) {
            $acRequest.post('https://anilist.co/api/auth/access_token', {
                'grant_type': 'client_credentials',
                'client_id': 'tatsui-rvts7',
                'client_secret': 'b9wByu0EKevXxKIecxnaenn'
            }, function (data) {
                localStorage["accessToken"] = JSON.stringify({
                    token: data.access_token,
                    date: (new Date()).setSeconds((new Date()).getSeconds() + 3600)
                });

                callback(data.access_token);
            }, function (data) {
                console.error(data);
            });
        } else {
            callback(accessToken.token);
        }
    };

    this.getToken = function (callback) {
        if (CONFIG.enableDebug) {
            callback();
        } else {
            this.getTokenApi(callback);
        }
    };

    this.fromId = function (type, id, page, callback) {
        this.getToken(function (token) {
            var url;

            if (CONFIG.enableDebug) {
                if (page) {
                    page = 'page';
                } else {
                    page = 'id';
                }

                // http://ericktatsui.com.br/anime-check/id/anime/139
                url = CONFIG.debugUrl + page + '/' + type + '/' + id;
            } else {
                if (page) {
                    page = '/page';
                } else {
                    page = '';
                }

                url = CONFIG.apiUrl + type + '/' + id + page + '/?access_token=' + token;
            }

            $Cache.getAnime(id, function (res) {
                if (res.length == 0) {
                    $acRequest.get(
                        url,
                        function (data, status, headers, config) {
                            callback(data);
                            //console.log(data);
                        },
                        function (data, status, headers, config) {
                            console.error(data);
                            callback(data);
                        }
                    );
                } else {
                    res[0].synonyms = res[0].synonyms.split(', ');
                    res[0].genres = res[0].genres.split(', ');
                    callback(res[0]);
                }
            });
        });
    };

    this.search = function (type, query, callback) {
        this.getToken(function (token) {
            var url = '';

            if (CONFIG.enableDebug) {
                // http://ericktatsui.com.br/anime-check/search/anime/hunter
                url = CONFIG.debugUrl + 'search/' + type + '/' + query;
            } else {
                url = CONFIG.apiUrl + type + '/search/' + query + '/?access_token=' + token;
            }

            $acRequest.get(
                url,
                function (data, status, headers, config) {
                    if (typeof data != 'object') {
                        data = [];
                    }

                    callback(data);
                    //console.log(data);
                },
                function (data, status, headers, config) {
                    console.error(data);
                    callback(data);
                }
            );
        });
    };

    this.list = function (query, options, callback) {
        this.getToken(function (token) {
            var paramns = '',
                url = '';

            for (var key in options) {
                paramns += '&' + key + '=' + options[key];
            }

            if (CONFIG.enableDebug) {
                // http://ericktatsui.com.br/anime-check/list/anime/?year=2016
                url = CONFIG.debugUrl + 'list/' + query + '/?' + paramns;
            } else {
                url = CONFIG.apiUrl + 'browse/' + query + '/?' + paramns + '&access_token=' + token;
            }

            $acRequest.get(
                url,
                function (data, status, headers, config) {
                    callback(data);
                    //$rootScope.resize();
                    //$rootScope.showLoading = false;
                },
                function (data, status, headers, config) {
                    console.error(data);
                    console.error(status);
                    callback(data);
                    //$rootScope.showLoading = false;
                }
            );
        });
    };
});

app.service('$Cache', function () {
    this.saveAnime = function (data, callbackSuccess, callbackError) {
        this.getAnime(data.id, function (res) {
            if (res.length == 0) {
                AC.Tools.saveFile(data.image_url_lge, function (imgPath) {
                    var cache = {
                        CACHE_ID: data.id,
                        CACHE_TYPE: data.type.toLowerCase(),
                        CACHE_TITLE: data.title_romaji,
                        CACHE_TITLE_JP: data.title_japanese,
                        CACHE_IMG: imgPath,
                        CACHE_SCORE: data.average_score,
                        CACHE_STATUS: data.airing_status || data.publishing_status,
                        CACHE_DTEND: data.end_date,
                        CACHE_DTSTART: data.start_date,
                        CACHE_YOUTUBEID: data.youtube_id,
                        CACHE_GENRES: data.genres.join(', '),
                        CACHE_DURATION: data.duration,
                        CACHE_EPISODES: data.total_episodes,
                        CACHE_CHAPTERS: data.total_chapters,
                        CACHE_VOLUMES: data.total_volumes,
                        CACHE_SYNONYMS: data.synonyms.join(', '),
                        CACHE_DTEDITION: moment().format()
                    };

                    AC.Db.insert('AC_SERIE_CACHE', cache, callbackSuccess);
                }, function () {
                    if (typeof callbackError == 'function') {
                        callbackError();
                    }
                });
            } else {
                if (typeof callbackSuccess == 'function') {
                    callbackSuccess();
                }
            }
        });
    };

    this.getAnime = function (id, callback) {
        var sql = "SELECT";
        sql += ' CACHE_ID AS "id", CACHE_TYPE AS "type", CACHE_TITLE AS "title_romaji", CACHE_TITLE_JP AS "title_japanese", CACHE_IMG AS "image_url_lge", CACHE_SCORE AS "average_score", CACHE_STATUS AS "airing_status", CACHE_DTEND AS "end_date", CACHE_DTSTART AS "start_date", CACHE_YOUTUBEID AS "youtube_id", CACHE_GENRES AS "genres", CACHE_DURATION AS "duration", CACHE_EPISODES AS "total_episodes", CACHE_CHAPTERS AS "total_chapters", CACHE_VOLUMES AS "total_volumes", CACHE_SYNONYMS AS "synonyms"';
        sql += " FROM AC_SERIE_CACHE";
        sql += " WHERE CACHE_ID = " + id;

        AC.Db.query(sql, function (res) {
            callback(res);
        });
    };
});

app.controller('SplashCtrl', function ($scope, $state) {
    document.addEventListener('dbReady', function () {
        AC.Db.query('SELECT * FROM AC_USER', function (res) {
            if (res.length > 0) {
                localStorage.setItem('user', JSON.stringify(res[0]));
                $state.go('all-my');
            } else {
                //$state.go('main');
                $state.go('registration');
            }
        });
    });

    AC.initialize(null, null, true).initDebug();
    AC.Db.initialize();
});

app.controller('RegistrationCtrl', function ($scope, $state) {
    $scope.saveUser = function () {
        var sql = "INSERT INTO AC_USER";
        sql += " (USER_NAME, USER_EMAIL, USER_PASSWORD, USER_DTEDITION)";
        sql += " VALUES (";
        sql += " '" + $scope.name + "',";
        sql += " '" + $scope.email + "',";
        sql += " '" + $scope.password + "',";
        sql += " '" + moment().format() + "'";
        sql += " )";

        var status = true,
            msg = '';

        if ($scope.password == undefined || $scope.password !== $scope.rePassword || $scope.password == '') {
            status = false;
            msg += 'As senhas não conferem.';
        }

        if ($scope.email == undefined || $scope.email.indexOf('@') == 1) {
            status = false;
            msg += '\nE-mail inválido.';
        }

        if (status) {
            AC.Db.query(sql, function (res) {
                AC.Tools.toast('Salvo com sucesso.', AC.Models.toastTypes.SHORT_BOTTOM);
                $state.go('all-my');
            });
        } else {
            AC.Tools.toast(msg, AC.Models.toastTypes.SHORT_BOTTOM);
        }
    };
});

app.controller('HomeCtrl', function ($scope, $state) {
    AC.initialize($scope, function () {
        if (TEMP.animeList) {
            AC.loading.hide();
        } else {
            AC.loading.show();
        }

        AC.SlideTabs = TouchTabsLA({
            container: document.getElementById('ttla-container'),
            content: document.getElementById('ttla-content'),
            tabs: document.getElementById('tabs'),
            header: document.getElementById('header'),
            resize: true,
            onTabChange: function () {
                //console.log(this);
            }
        });
    });

    $scope.openAnime = function (type, id) {
        var globalType = 'anime';

        type = type.toLowerCase();

        if (AC.Models.mangaTypes.indexOf(type) != -1) {
            globalType = 'manga';
        }

        $state.go('serie', {
            type: globalType,
            id: id
        });
    };
});

app.controller('HomeTabAnimesCtrl', function ($scope, $rootScope, $acApi) {
    $scope.type = 'anime'; // to state param

    if (TEMP.animeList == null) {
        $acApi.list('anime',
        {
            'year': CONFIG.currentYear
        }, function (data) {
            $scope.list = data;
            $scope.type = 'anime'; // to state param
            TEMP.animeList = data;
            AC.loading.hide();
        });
    } else {
        $scope.list = TEMP.animeList;
        AC.loading.hide();
    }
});

app.controller('HomeTabMangasCtrl', function ($scope, $rootScope, $acApi) {
    $scope.type = 'manga'; // to state param

    document.getElementById('tab2').addEventListener('tabFocused', function (e) {
        AC.loading.show();

        if (TEMP.mangaList == null) {
            $acApi.list('manga',
            {
                'year': CONFIG.currentYear
            }, function (data) {
                $scope.list = data;
                $scope.$applyAsync();
                TEMP.mangaList = data;
                AC.loading.hide();
            });
        } else {
            $scope.list = TEMP.mangaList;
            $scope.$applyAsync();

            AC.loading.hide();
        }
    });
});

app.controller('HomeTabMoviesCtrl', function ($scope, $rootScope, $acApi) {
    $scope.type = 'anime'; // to state param

    document.getElementById('tab3').addEventListener('tabFocused', function (e) {
        AC.loading.show();

        if (TEMP.movieList == null) {
            $acApi.list('anime',
            {
                'year': CONFIG.currentYear,
                'type': 'movie'
            }, function (data) {
                $scope.list = data;
                $scope.$applyAsync();

                TEMP.movieList = data;
                AC.loading.hide();
            });
        } else {
            $scope.list = TEMP.movieList;
            $scope.$applyAsync();

            AC.loading.hide();
        }
    });
});

app.controller('SearchCtrl', function ($scope, $rootScope, $acApi, $state) {
    var showSearchField,
        hideSearchField,
        searchField;

    $scope.openAnime = function (type, id) {
        var globalType = 'anime';

        type = type.toLowerCase();

        if (AC.Models.mangaTypes.indexOf(type) != -1) {
            globalType = 'manga';
        }

        $state.go('serie', {
            type: globalType,
            id: id
        });
    };

    var requestSearch = function () {
        AC.loading.show();
    };

    AC.initialize($scope, function () {
        var searchField = document.getElementById('searchField'),
            searchText = document.getElementById('searchText'),
            header = document.getElementById('header'),
            icons = header.getElementsByClassName('icon-btn'),
            searchClose = document.getElementById('searchClose'),
            searchButton = document.getElementById('searchButton'),
            searchBack = document.getElementById('searchBack');

        searchField = document.getElementById('searchField');

        AC.SlideTabs = TouchTabsLA({
            container: document.getElementById('ttla-container'),
            content: document.getElementById('ttla-content'),
            tabs: document.getElementById('tabs'),
            header: document.getElementById('header'),
            resize: true,
            onTabChange: function () {
                //console.log(this);
            }
        });

        var resizeField = function () {
            searchField.style.width = (window.innerWidth - 70) + 'px';
        };

        resizeField();
        window.addEventListener('resize', resizeField);

        showSearchField = function () {
            searchClose.style.display = 'block';
            searchBack.style.display = 'none';
            searchText.style.display = 'none';
            searchField.style.display = 'block';
            searchButton.style.display = 'none';

            searchField.value = '';
            $scope.$applyAsync();

            searchField.focus();
        };

        hideSearchField = function () {
            searchClose.style.display = 'none';
            searchBack.style.display = 'block';
            searchText.style.display = 'block';
            searchField.style.display = 'none';
            searchButton.style.display = 'block';

            if (searchField.value == '') {
                searchField.value = 'Buscar';
                $scope.$applyAsync();
            }
        };

        if ($state.params.term) {
            hideSearchField();

            $scope.searchQuery = $state.params.term;
            $scope.$applyAsync();

            requestSearch();
        } else {
            searchField.focus();
        }

        searchField.addEventListener('keypress', function (e) {
            if (e.which == 13) {
                $state.go('search', { term: searchField.value });

                requestSearch();
                hideSearchField();

                AC.TouchTabsLA.setContainerSize();
            }
        });

        searchText.addEventListener('click', showSearchField);
        searchButton.addEventListener('click', showSearchField);
        searchClose.addEventListener('click', hideSearchField);
        searchBack.addEventListener('click', function () {
            AC.loading.hide();
        });
    });
});

app.controller('SearchTabAnimesCtrl', function ($scope, $acApi, $stateParams) {
    $acApi.search('anime', $stateParams.term, function (data) {
        $scope.list = data;

        AC.loading.hide();
    });
});

app.controller('SearchTabMangasCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    document.getElementById('tab2').addEventListener('tabFocused', function (e) {
        AC.loading.show();

        if ($scope.lastMangaSearch == undefined || $scope.lastMangaSearch == null || $scope.lastMangaSearch == '') {
            $acApi.search('manga', $stateParams.term, function (data) {
                $scope.list = data;
                $scope.lastMangaSearch = data;

                AC.loading.hide();
            });
        } else {
            $scope.list = $scope.lastMangaSearch;

            AC.loading.hide();
        }

        $scope.$apply();
    });
});

app.controller('SerieCtrl', function ($scope, $rootScope, $acApi, $stateParams, $Cache) {
    var header,
        serieContent,
        serieContentNum,
        dialogListCancel;

    $scope.lists = [];

    AC.loading.show();

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        serieContent = document.getElementById('serie-content');
        serieContentNum = document.getElementById('serie-content-num');

        listActions();
    });

    $scope.serie = {};

    $scope.selectList = function () {
        AC.Db.query("SELECT * FROM AC_SERIE_LIST WHERE SL_SERIE_ID = " + $stateParams.id, function (res) {
            if (res.length == 0) {
                AC.Dialog.show('choose-list');
            } else {
                AC.Tools.toast('Anime já está em uma lista.', AC.Models.toastTypes.SHORT_BOTTOM);
            }
        });
    };

    var listActions = function () {
        // Cancel action button
        dialogListCancel = document.getElementById('dialog-list-cancel');
        dialogListCancel.addEventListener('click', function () {
            AC.Dialog.hide('choose-list');
        });

        //AC.Db.query("SELECT * FROM AC_LIST", function (res) {
        //    $scope.lists = res;
        //});

        $scope.lists = $rootScope.menuLists;
    };

    window.lockAddList = false;
    $scope.addToList = function (list) {
        if (!window.lockAddList) {
            window.lockAddList = true;
            AC.Db.query("INSERT INTO AC_SERIE_LIST (SL_SERIE_ID, SL_LIST_ID, SL_TYPE, SL_DTEDITION) VALUES (" + $stateParams.id + ", " + list.LIST_ID + ", '" + $stateParams.type + "', '" + moment().format() + "')", function () {
                AC.Dialog.hide('choose-list');

                $rootScope.currentList = list;

                $rootScope.inList = true;
                $rootScope.$apply();

                header.style.height = (window.innerHeight - 100) + 'px';
                serieContent.style.top = (window.innerHeight - 100) + 'px';
                serieContentNum.style.height = '101px';

                AC.Tools.toast('Adicionado a lista ' + list.LIST_NAME, AC.Models.toastTypes.SHORT_BOTTOM);

                $Cache.saveAnime($rootScope.showing, function () {
                    setTimeout(function () {
                        window.lockAddList = false;
                    }, 500);
                });
            });
        }
    };

    $scope.closeDialog = function (id) {
        AC.Dialog.hide(id);
    };

    $scope.dialogMoveList = function () {
        AC.Dialog.show('move-list');
    };

    $scope.moveToList = function (list) {
        AC.Db.update('AC_SERIE_LIST', 'SL_SERIE_ID = ' + $stateParams.id, {
            SL_LIST_ID: list.LIST_ID
        }, function () {
            AC.Dialog.hide('move-list');
            AC.Tools.toast('Movido para a lista ' + list.LIST_NAME, AC.Models.toastTypes.SHORT_BOTTOM);

            $rootScope.currentList = list;
            $scope.$apply();
        });
    };

    $scope.removeFromList = function () {
        AC.Db.remove('AC_SERIE_LIST', 'SL_SERIE_ID = ' + $stateParams.id, function () {
            AC.Db.remove('AC_SERIE', 'SERIE_EXT_ID = ' + $stateParams.id, function () {
                $rootScope.inList = false;

                header.style.height = window.innerHeight + 'px';
                serieContent.style.top = window.innerHeight + 'px';
                serieContentNum.style.height = '0';

                $scope.$apply();

                AC.Tools.toast('Removido da lista.', AC.Models.toastTypes.SHORT_BOTTOM);
            });
        });
    };

    $scope.createNewList = function (toHide) {
        AC.Dialog.show('create-list');
        AC.Dialog.hide(toHide);

        $scope.lastDialog = toHide;
    };

    $scope.cancelCreate = function () {
        AC.Dialog.hide('create-list');

        AC.Dialog.show($scope.lastDialog);
    };

    $scope.saveCreate = function () {
        AC.Db.insert('AC_LIST', {
            LIST_NAME: $scope.newListName,
            LIST_DTEDITION: moment().format()
        }, function () {
            var sql = 'SELECT l.*, count(s.sl_serie_id) as "count"';
            sql += ' FROM AC_LIST l ';
            sql += ' LEFT JOIN AC_SERIE_LIST s ON s.SL_LIST_ID = l.LIST_ID';
            sql += ' GROUP BY LIST_ID';
            sql += ' ORDER BY LIST_ID';

            AC.Db.query(sql, function (res) {
                $scope.lists = res;
                $rootScope.menuLists = res;

                if (!$rootScope.inList) {
                    $scope.addToList(res[res.length - 1]);
                } else {
                    $scope.moveToList(res[res.length - 1]);
                }

                $scope.$apply();

                AC.Dialog.hide('create-list');
            });
        });
    };
});

app.controller('SerieAnimeCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    var header,
        serieContent,
        serieContentNum,
        changeSeasonButton,
        dialogSeasonCancel,
        dialogSeasonSave,
        dialogEpisodeCancel,
        dialogEpisodeSave,
        fab,
        animeType = 'anime';

    $scope.currentEpisode = '--';
    $scope.currentSeason = '--';

    $scope.updateSeason = 1;
    $scope.updateEpisode = 0;

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        serieContent = document.getElementById('serie-content');
        serieContentNum = document.getElementById('serie-content-num');
        fab = document.getElementById('fab');

        var sql = "SELECT * FROM AC_SERIE_LIST ";
        sql += " LEFT JOIN AC_SERIE ON SERIE_EXT_ID = SL_SERIE_ID";
        sql += " LEFT JOIN AC_LIST ON LIST_ID = SL_LIST_ID";
        sql += " WHERE SL_SERIE_ID = " + $stateParams.id;
        sql += " ORDER BY SERIE_DTEDITION DESC LIMIT 1";

        AC.Db.query(sql, function (res) {
            if (res.length > 0) {
                $rootScope.currentList = {
                    LIST_ID: res[0].LIST_ID,
                    LIST_NAME: res[0].LIST_NAME,
                    LIST_DTEDITION: res[0].LIST_DTEDITION
                };

                if (res[0].SERIE_EXT_ID != null) {
                    $scope.currentSeason = res[0].SERIE_SEASON;
                    $scope.currentEpisode = res[0].SERIE_NUM;

                    $scope.updateSeason = res[0].SERIE_SEASON;
                    $scope.updateEpisode = res[0].SERIE_NUM;
                } else {
                    $scope.currentSeason = 1;
                    $scope.currentEpisode = 0;
                }

                $rootScope.inList = true;

                header.style.height = (window.innerHeight - 100) + 'px';
                serieContent.style.top = (window.innerHeight - 100) + 'px';

                setTimeout(function () {
                    serieContentNum.style.height = '101px';
                }, 1000);

                //fab.className = 'fab btn-wave -hidden';
            } else {
                $scope.currentSeason = 1;
                $scope.currentEpisode = 0;

                $rootScope.inList = false;

                header.style.height = window.innerHeight + 'px';
                serieContent.style.top = window.innerHeight + 'px';
            }

            $scope.$apply();
        });


        seasonActions();
        episodeActions();
    });

    $acApi.fromId('anime', $stateParams.id, false, function (data) {
        AC.loading.hide();

        if (data) {
            $scope.serie.title = data.title_romaji;
            $scope.serie.titleJp = data.title_japanese;
            $scope.serie.img = data.image_url_lge;
            $scope.serie.score = data.average_score;
            $scope.serie.status = AC.Models.translation.status[data.airing_status.toLowerCase()];
            $scope.serie.genres = AC.Tools.translateList(AC.Models.translation.genres, data.genres);
            $scope.serie.episodes = AC.Tools.toInt(data.total_episodes);
            $scope.serie.duration = AC.Tools.toInt(data.duration);
            $scope.serie.synonyms = data.synonyms.join(', ');

            header.style.backgroundImage = 'url(' + data.image_url_lge + ')';

            $rootScope.showing = data;

            $scope.$apply();
        }

        animeType = data.type;
    });

    var seasonActions = function () {
        // To open dialog
        changeSeasonButton = document.getElementById('season-button');
        changeSeasonButton.addEventListener('click', function (e) {
            $scope.updateSeason = $scope.currentSeason;
            $scope.$apply();

            AC.Dialog.show('change-season');
        });

        // Cancel action button
        dialogSeasonCancel = document.getElementById('dialog-season-cancel');
        dialogSeasonCancel.addEventListener('click', function () {
            AC.Dialog.hide('change-season');
        });

        // Save action button
        dialogSeasonSave = document.getElementById('dialog-season-save');
        dialogSeasonSave.addEventListener('click', function () {
            AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_EXT_ID = ' + $stateParams.id + ' AND SERIE_SEASON = ' + $scope.updateSeason + ' LIMIT 1', function (res) {
                if (res.length == 0) {
                    AC.Db.query("INSERT INTO AC_SERIE (SERIE_EXT_ID, SERIE_TYPE, SERIE_SEASON, SERIE_NUM, SERIE_DTEDITION) VALUES (" + $stateParams.id + ", '" + animeType + "', " + $scope.updateSeason + ", 0, '" + moment().format() + "')", function () {
                        $scope.currentSeason = $scope.updateSeason;
                        $scope.currentEpisode = 0;

                        $scope.updateSeason = $scope.updateSeason;
                        $scope.updateEpisode = 0;

                        $scope.$apply();
                    });
                }
            });

            AC.Dialog.hide('change-season');
        });
    };

    var episodeActions = function () {
        // To open dialog
        changeEpisodeButton = document.getElementById('episode-button');
        changeEpisodeButton.addEventListener('click', function (e) {
            $scope.updateEpisode = $scope.currentEpisode;
            $scope.$apply();

            AC.Dialog.show('change-episode');
        });

        // Cancel action button
        dialogEpisodeCancel = document.getElementById('dialog-episode-cancel');
        dialogEpisodeCancel.addEventListener('click', function () {
            AC.Dialog.hide('change-episode');
        });

        // Save action button
        dialogEpisodeSave = document.getElementById('dialog-episode-save');
        dialogEpisodeSave.addEventListener('click', function () {
            AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_EXT_ID = ' + $stateParams.id + ' AND SERIE_SEASON = ' + $scope.currentSeason + ' LIMIT 1', function (res) {
                if (res.length > 0) {
                    AC.Db.query("UPDATE AC_SERIE SET SERIE_NUM = " + $scope.updateEpisode + ", SERIE_DTEDITION = '" + moment().format() + "' WHERE SERIE_SEASON = " + res[0].SERIE_SEASON, function (res) {
                        $scope.currentEpisode = $scope.updateEpisode;

                        $scope.$apply();
                    });
                } else {
                    AC.Db.query("INSERT INTO AC_SERIE (SERIE_EXT_ID, SERIE_TYPE, SERIE_SEASON, SERIE_NUM, SERIE_DTEDITION) VALUES (" + $stateParams.id + ", 'manga', " + $scope.updateSeason + ", " + $scope.updateEpisode + ", '" + moment().format() + "')", function (res) {
                        $scope.currentEpisode = $scope.updateEpisode;

                        $scope.$apply();
                    });
                }
            });

            AC.Dialog.hide('change-episode');
        });
    };

    $scope.numberLess = function (scopeNum) {
        if ($scope[scopeNum] > 1) {
            $scope[scopeNum]--;
        }
    };

    $scope.numberPlus = function (scopeNum) {
        $scope[scopeNum]++;
    };
});

app.controller('SerieMangaCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    var header,
        serieContent,
        serieContentNum,
        changeChapterButton,
        dialogChapterSave,
        dialogChapterCancel,
        mangaType = 'manga';

    $acApi.fromId('manga', $stateParams.id, false, function (data) {
        AC.loading.hide();

        if (data) {
            $scope.serie.title = data.title_romaji;
            $scope.serie.titleJp = data.title_japanese;
            $scope.serie.img = data.image_url_lge;
            $scope.serie.score = data.average_score;
            $scope.serie.status = AC.Models.translation.status[(data.publishing_status || data.airing_status).toLowerCase()];
            $scope.serie.genres = AC.Tools.translateList(AC.Models.translation.genres, data.genres);
            $scope.serie.chapters = AC.Tools.toInt(data.total_chapters);
            $scope.serie.volumes = AC.Tools.toInt(data.total_volumes);
            $scope.serie.synonyms = data.synonyms.join(', ');

            header.style.backgroundImage = 'url(' + data.image_url_lge + ')';

            $rootScope.showing = data;

            mangaType = data.type;

            $scope.$apply();
        }
    });

    $scope.currentChapter = '--';

    var chapterActions = function () {
        // To open dialog
        changeChapterButton = document.getElementById('chapter-button');
        changeChapterButton.addEventListener('click', function (e) {
            $scope.updateSeason = $scope.currentChapter;
            $scope.$apply();

            AC.Dialog.show('change-chapter');
        });

        // Cancel action button
        dialogChapterCancel = document.getElementById('dialog-chapter-cancel');
        dialogChapterCancel.addEventListener('click', function () {
            AC.Dialog.hide('change-chapter');
        });

        // Save action button
        dialogChapterSave = document.getElementById('dialog-chapter-save');
        dialogChapterSave.addEventListener('click', function () {
            AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_EXT_ID = ' + $stateParams.id + ' LIMIT 1', function (res) {
                if (res.length > 0) {
                    AC.Db.query("UPDATE AC_SERIE SET SERIE_NUM = " + $scope.updateChapter + ", SERIE_DTEDITION = '" + moment().format() + "' WHERE SERIE_EXT_ID = " + $stateParams.id, function (res) {
                        $scope.currentChapter = $scope.updateChapter;

                        $scope.$apply();
                    });
                } else {
                    AC.Db.query("INSERT INTO AC_SERIE (SERIE_EXT_ID, SERIE_TYPE, SERIE_NUM, SERIE_DTEDITION) VALUES (" + $stateParams.id + ", '" + mangaType + "', " + $scope.updateChapter + ", '" + moment().format() + "')", function () {
                        $scope.currentChapter = $scope.updateChapter;
                        $scope.updateChapter = $scope.updateChapter;

                        $scope.$apply();
                    });
                }
            });

            AC.Dialog.hide('change-chapter');
        });
    };

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        serieContent = document.getElementById('serie-content');
        serieContentNum = document.getElementById('serie-content-num');

        var sql = "SELECT * FROM AC_SERIE_LIST ";
        sql += " LEFT JOIN AC_SERIE ON SERIE_EXT_ID = SL_SERIE_ID";
        sql += " LEFT JOIN AC_LIST ON LIST_ID = SL_LIST_ID";
        sql += " WHERE SL_SERIE_ID = " + $stateParams.id;
        sql += " ORDER BY SERIE_DTEDITION DESC LIMIT 1";

        AC.Db.query(sql, function (res) {
            if (res.length > 0) {
                $rootScope.currentList = {
                    LIST_ID: res[0].LIST_ID,
                    LIST_NAME: res[0].LIST_NAME,
                    LIST_DTEDITION: res[0].LIST_DTEDITION
                };

                if (res[0].SERIE_EXT_ID != null) {
                    $scope.currentChapter = res[0].SERIE_NUM;
                    $scope.updateChapter = res[0].SERIE_NUM;
                } else {
                    $scope.currentChapter = 1;
                    $scope.updateChapter = 1;
                }

                $rootScope.inList = true;

                header.style.height = (window.innerHeight - 100) + 'px';
                serieContent.style.top = (window.innerHeight - 100) + 'px';

                setTimeout(function () {
                    serieContentNum.style.height = '101px';
                }, 1000);
            } else {
                header.style.height = window.innerHeight + 'px';
                serieContent.style.top = window.innerHeight + 'px';

                $scope.currentChapter = 1;
                $scope.updateChapter = 1;

                $rootScope.inList = false;
            }

            $scope.$apply();
            $rootScope.$apply();
        });

        chapterActions();
    });

    $scope.numberLess = function (scopeNum) {
        if ($scope[scopeNum] > 1) {
            $scope[scopeNum]--;
        }
    };

    $scope.numberPlus = function (scopeNum) {
        $scope[scopeNum]++;
    };
});

app.controller('GenreListCtrl', function ($scope, $location) {
    $scope.go = function (title, name) {
        touchMenu.close();
        $location.path('/category/' + title + '/' + name);
    };
});

app.controller('CategoryCtrl', function ($scope, $acApi, $stateParams) {
    $scope.category = $stateParams.title;

    $acApi.list('list',
	{
	    'year': 2015,
	    'genres': $stateParams.name
	}, function (data) {
	    $scope.list = data;
	});
});

app.controller('MenuCtrl', function ($scope, $rootScope, $state) {
    document.addEventListener('dbReady', function () {
        var sql = 'SELECT l.*, count(s.sl_serie_id) as "count"';
        sql += ' FROM AC_LIST l ';
        sql += ' LEFT JOIN AC_SERIE_LIST s ON s.SL_LIST_ID = l.LIST_ID';
        sql += ' GROUP BY LIST_ID';
        sql += ' ORDER BY LIST_ID';

        AC.Db.query(sql, function (res) {
            $rootScope.menuLists = res;
            $scope.$apply();
        });
    });

    $scope.openList = function (id) {
        $state.go('list', {
            id: id
        });

        AC.TouchMenu.close();
    };
});

app.controller('ListCtrl', function ($scope, $rootScope, $state, $stateParams) {
    AC.loading.show();

    var sql = "SELECT *";
    sql += " FROM AC_LIST";
    sql += " WHERE LIST_ID = " + $stateParams.id;

    AC.Db.query(sql, function (res) {
        $scope.listName = res[0].LIST_NAME;
    });

    $scope.openAnime = function (type, id) {
        var globalType = 'anime';

        type = type.toLowerCase();

        if (AC.Models.mangaTypes.indexOf(type) != -1) {
            globalType = 'manga';
        }

        $state.go('serie', {
            type: globalType,
            id: id
        });
    };

    AC.initialize($scope);

    $scope.delete = function () {
        AC.Dialog.show('delete-list');
    };

    $scope.deleteList = function () {
        AC.loading.show();

        AC.Db.delete('AC_LIST', 'LIST_ID = ' + $stateParams.id, function () {
            AC.Db.delete('AC_SERIE_LIST', 'SL_LIST_ID = ' + $stateParams.id, function () {
                var sql = 'SELECT l.*, count(s.sl_serie_id) as "count"';
                sql += ' FROM AC_LIST l ';
                sql += ' LEFT JOIN AC_SERIE_LIST s ON s.SL_LIST_ID = l.LIST_ID';
                sql += ' GROUP BY LIST_ID';
                sql += ' ORDER BY LIST_ID';

                AC.Db.query(sql, function (res) {
                    $rootScope.menuLists = res;

                    AC.Tools.toast('Lista excluída com sucesso.', AC.Models.toastTypes.SHORT_BOTTOM);
                    AC.loading.hide();
                    $state.go('all-my');

                    $scope.$apply();
                });
            });
        });
    };

    $scope.closeDialog = function (id) {
        AC.Dialog.hide(id);
    };

    $scope.edit = function () {
        AC.Dialog.show('change-name');
    };

    $scope.saveName = function () {
        AC.Db.update('AC_LIST', 'LIST_ID = ' + $stateParams.id, {
            LIST_NAME: $scope.newName
        }, function () {
            AC.Dialog.hide('change-name');

            $scope.listName = $scope.newName;


            var sql = 'SELECT l.*, count(s.sl_serie_id) as "count"';
            sql += ' FROM AC_LIST l ';
            sql += ' LEFT JOIN AC_SERIE_LIST s ON s.SL_LIST_ID = l.LIST_ID';
            sql += ' GROUP BY LIST_ID';
            sql += ' ORDER BY LIST_ID';

            AC.Db.query(sql, function (res) {
                $rootScope.menuLists = res;
                $scope.$apply();
            });
        });
    };
});

app.controller('ListSeriesCtrl', function ($scope, $rootScope, $stateParams) {
    var sql = "SELECT DISTINCT SL_SERIE_ID, ";
    sql += 'CACHE_ID AS "id", CACHE_TYPE AS "type", CACHE_TITLE AS "title_romaji", CACHE_TITLE_JP AS "title_japanese", CACHE_IMG AS "image_url_lge", CACHE_SCORE AS "average_score", CACHE_STATUS AS "airing_status", CACHE_DTEND AS "end_date", CACHE_DTSTART AS "start_date", CACHE_YOUTUBEID AS "youtube_id", CACHE_GENRES AS "genres", CACHE_DURATION AS "duration", CACHE_EPISODES AS "total_episodes", CACHE_CHAPTERS AS "total_chapters", CACHE_VOLUMES AS "total_volumes", CACHE_SYNONYMS AS "synonyms"';
    sql += " FROM AC_SERIE_LIST";
    sql += " INNER JOIN AC_SERIE_CACHE ON CACHE_ID = SL_SERIE_ID";
    sql += " WHERE SL_LIST_ID = " + $stateParams.id;

    AC.Db.query(sql, function (res) {
        $scope.list = res;
        $scope.$apply();

        AC.loading.hide();
    });
});

app.controller('MySeriesCtrl', function ($scope, $rootScope, $state, $stateParams) {
    AC.loading.show();

    AC.Db.query("SELECT * FROM AC_USER", function (res) {
        $rootScope.userInfos = res[0];
        $scope.$apply();
    });

    AC.initialize($scope, function () {
        AC.SlideTabs = TouchTabsLA({
            container: document.getElementById('ttla-container'),
            content: document.getElementById('ttla-content'),
            tabs: document.getElementById('tabs'),
            header: document.getElementById('header'),
            resize: true,
            onTabChange: function () {
                //console.log(this);
            }
        });

        document.getElementsByClassName('menu-btn')[0].addEventListener('touchend', function () {
            AC.TouchMenu.open();
        });
    });

    $scope.openAnime = function (type, id) {
        var globalType = 'anime';

        type = type.toLowerCase();

        if (AC.Models.mangaTypes.indexOf(type) != -1) {
            globalType = 'manga';
        }

        $state.go('serie', {
            type: globalType,
            id: id
        });
    };
});

app.controller('MySeriesTabAnimesCtrl', function ($scope) {
    var sql = "SELECT DISTINCT SL_SERIE_ID, ";
    sql += ' CACHE_ID AS "id", CACHE_TYPE AS "type", CACHE_TITLE AS "title_romaji", CACHE_IMG AS "image_url_lge"';
    sql += " FROM AC_SERIE_LIST";
    sql += " INNER JOIN AC_SERIE_CACHE ON CACHE_ID = SL_SERIE_ID";
    //sql += " WHERE SL_LIST_ID = " + $stateParams.id;

    var animeTypes = AC.Models.animeTypes,
        where = [];

    for (var i = 0; i < animeTypes.length; i++) {
        where.push("CACHE_TYPE = '" + animeTypes[i] + "'");
    }

    sql += " WHERE " + where.join(' OR ');

    AC.Db.query(sql, function (res) {
        $scope.list = res;
        $scope.$apply();

        AC.loading.hide();
    });
});

app.controller('MySeriesTabMangasCtrl', function ($scope) {
    var sql = "SELECT DISTINCT SL_SERIE_ID, ";
    sql += ' CACHE_ID AS "id", CACHE_TYPE AS "type", CACHE_TITLE AS "title_romaji", CACHE_IMG AS "image_url_lge"';
    sql += " FROM AC_SERIE_LIST";
    sql += " INNER JOIN AC_SERIE_CACHE ON CACHE_ID = SL_SERIE_ID";
    //sql += " WHERE SL_LIST_ID = " + $stateParams.id;

    var animeTypes = AC.Models.mangaTypes,
        where = [];

    for (var i = 0; i < animeTypes.length; i++) {
        where.push("CACHE_TYPE = '" + animeTypes[i] + "'");
    }

    sql += " WHERE " + where.join(' OR ');

    AC.Db.query(sql, function (res) {
        $scope.list = res;
        $scope.$apply();

        AC.loading.hide();
    });
});

app.controller('CategoryCtrl', function ($scope, $state) {
    AC.initialize($scope, function () {
        AC.SlideTabs = TouchTabsLA({
            container: document.getElementById('ttla-container'),
            content: document.getElementById('ttla-content'),
            tabs: document.getElementById('tabs'),
            header: document.getElementById('header'),
            resize: true,
            onTabChange: function () {
                //console.log(this);
            }
        });
    });

    $scope.categoryName = AC.Models.translation.genres[$state.params.name.toLowerCase().replace(/( )/g, '_')];

    $scope.openAnime = function (type, id) {
        var globalType = 'anime';

        type = type.toLowerCase();

        if (AC.Models.mangaTypes.indexOf(type) != -1) {
            globalType = 'manga';
        }

        $state.go('serie', {
            type: globalType,
            id: id
        });
    };
});

app.controller('CategoryTabAnimesCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    AC.loading.show();

    $acApi.list('anime',
    {
        'genres': $stateParams.name,
        'year': moment().format('YYYY')
    }, function (data) {
        $scope.list = data;
        TEMP.animeList = data;
        AC.loading.hide();
    });
});

app.controller('CategoryTabMangasCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    document.getElementById('tab2').addEventListener('tabFocused', function (e) {
        AC.loading.show();

        if ($scope.temp == undefined || $scope.temp == null || $scope.temp == '') {
            $acApi.list('manga',
            {
                'genres': $stateParams.name,
                'year': moment().format('YYYY')
            }, function (data) {
                $scope.list = data;
                $scope.temp = data;

                $scope.$apply();
                AC.loading.hide();
            });
        } else {
            $scope.list = $scope.temp;
            $scope.$apply();

            AC.loading.hide();
        }
    });
});

app.controller('CategoryListCtrl', function ($scope, $state) {
    AC.initialize($scope, function () {
    });

    $scope.categories = AC.Models.translation.genres;
});

app.controller('ListsCtrl', function ($scope) {
    AC.initialize($scope, function () {
    });


    //AC.Db.query('SELECT * FROM AC_LIST', function (res) {
    //    $scope.lists = res;
    //    $scope.$apply();
    //});

    $scope.lists = $rootScope.menuLists;
});


app.directive('btn', function () {
    return {
        restrict: 'C', //E = element, A = attribute, C = class, M = comment
        link: function($scope, element, attrs) {
            element.on('touchstart', function() {
                this.className = this.className + ' -active';
            });

            element.on('touchend', function () {
                this.className = this.className.replace(' -active');
            });
        }
    }
});

app.directive('fab', function () {
    return {
        restrict: 'C', //E = element, A = attribute, C = class, M = comment
        link: function ($scope, element, attrs) {
            element.on('touchstart', function () {
                this.className = this.className + ' -active';
            });

            element.on('touchend', function () {
                this.className = this.className.replace(' -active');
            });
        }
    }
});

app.directive('ngPreload', function () {
    return {
        restrict: 'A', //E = element, A = attribute, C = class, M = comment
        scope: {
            ngPreload: '='
        },
        link: function ($scope, element, attrs) {
            var img = new Image();
            img.onload = function (e) {
                element[0].style.backgroundImage = 'url(' + this.src + ')';

            };
            img.src = $scope.ngPreload;
        }
    }
});