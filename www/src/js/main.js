/// <reference path="../../lib/angular/angular.min.js" />
/// <reference path="../../src/js/initialize.js" />
/// <reference path="../../src/js/tools.js" />
/// <reference path="../../src/js/models.js" />
/// <reference path="../../src/js/material-design.js" />

var app = angular.module('AnimeCheck', ['ui.router']);

// GLOBALS
var CONFIG = {
    enableDebug: true,
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

    $rootScope.cardHeight = 275; // altura do card com base na largura da janela padrão
    $rootScope.calcCardHeight = function () {
        // 360 = largura da janela padrão
        // 275 = altura do card com base na largura da janela padrão
        $rootScope.cardHeight = (window.innerWidth * 275) / 360;
        $rootScope.$apply();
    };

    window.addEventListener('resize', $rootScope.calcCardHeight);

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
	        },
	        'filmes@home': {
	            templateUrl: 'view/series.html',
	            controller: 'HomeTabMoviesCtrl'
	        }
	    }
	})
	.state('category', {
	    url: '/category/:title/:name',
	    views: {
	        '': {
	            templateUrl: 'view/category.html',
	            controller: 'CategoryCtrl'
	        },
	        'category@main': {
	            templateUrl: 'view/series.html'
	        }
	    }
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
                        function(data, status, headers, config) {
                            callback(data);
                            //console.log(data);
                        },
                        function(data, status, headers, config) {
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
                $state.go('home');
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

        if ($scope.password !== $scope.rePassword) {
            status = false;
            msg += 'As senhas não conferem.';
        }

        if ($scope.email == undefined || $scope.email.indexOf('@') == 1) {
            status = false;
            msg += '\nE-mail inválido.';
        }

        if (status) {
            AC.Db.query(sql, function (res) {
                AC.Tools.toast('Salvo com sucesso.', 'showShortBottom');
                $state.go('home');
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
        hideSearchField;

    $scope.type = 'anime';

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

        $acApi.search('anime', $scope.searchQuery, function (data) {
            $scope.list = data;

            AC.loading.hide();
        });
    };

    AC.initialize($scope, function () {
        var searchField = document.getElementById('searchField'),
            searchText = document.getElementById('searchText'),
            header = document.getElementById('header'),
            icons = header.getElementsByClassName('icon-btn'),
            searchClose = document.getElementById('searchClose'),
            searchButton = document.getElementById('searchButton'),
            searchBack = document.getElementById('searchBack');

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
            header.style.background = '#FFF';
            searchField.style.display = 'block';
            searchButton.style.display = 'none';

            for (var i = 0; i < icons.length; i++) {
                icons[i].style.color = '#09314B';
            }

            searchField.focus();
        };

        hideSearchField = function () {
            searchClose.style.display = 'none';
            searchBack.style.display = 'block';
            searchText.style.display = 'block';
            header.style.background = '#09314B';
            searchField.style.display = 'none';
            searchButton.style.display = 'block';

            for (var i = 0; i < icons.length; i++) {
                icons[i].style.color = '#FFF';
            }

            if (!$scope.searchQuery || $scope.searchQuery == '') {
                $scope.searchQuery = 'Buscar';
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
                $state.go('search', { term: $scope.searchQuery });

                requestSearch();
                hideSearchField();
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

app.controller('SearchTabAnimesCtrl', function ($scope, $rootScope, $acApi) {
    $scope.type = 'anime';
});

app.controller('SearchTabMangasCtrl', function ($scope, $rootScope, $acApi) {
    document.getElementById('tab2').addEventListener('tabFocused', function (e) {
        AC.loading.show();
        $scope.type = 'manga';
        $scope.list = [];

        $acApi.search('manga', $scope.searchQuery, function (data) {
            $scope.list = data;

            AC.loading.hide();
        });
    });
});

app.controller('SerieCtrl', function ($scope, $rootScope, $acApi, $stateParams, $Cache) {
    var header,
        serieContent,
        serieContentNum,
        dialogListCancel,
        dialogCreateCancel,
        dialogCreateSave;

    $scope.lists = [];

    AC.loading.show();

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        serieContent = document.getElementById('serie-content');
        serieContentNum = document.getElementById('serie-content-num');

        listActions();
        //createListActions();
    });

    $scope.serie = {};
    $scope.translation = AC.Models.translation;

    $scope.selectList = function () {
        AC.Db.query("SELECT * FROM AC_SERIE_LIST WHERE SL_SERIE_ID = " + $stateParams.id, function (res) {
            if (res.length == 0) {
                AC.Dialog.show('choose-list');
            } else {
                AC.Tools.toast('Anime já está em uma lista.', 'showShortBottom');
            }
        });
    };

    var listActions = function () {
        // Cancel action button
        dialogListCancel = document.getElementById('dialog-list-cancel');
        dialogListCancel.addEventListener('click', function () {
            AC.Dialog.hide('choose-list');
        });

        AC.Db.query("SELECT * FROM AC_LIST", function (res) {
            $scope.lists = res;
        });
    };

    $scope.addToList = function (listId) {
        AC.Db.query("INSERT INTO AC_SERIE_LIST (SL_SERIE_ID, SL_LIST_ID, SL_TYPE, SL_DTEDITION) VALUES (" + $stateParams.id + ", " + listId + ", '" + $stateParams.type + "', '" + moment().format() + "')", function () {
            $Cache.saveAnime($rootScope.showing, function () {
                AC.Dialog.hide('choose-list');

                header.style.height = (window.innerHeight - 100) + 'px';
                serieContent.style.top = (window.innerHeight - 100) + 'px';
                serieContentNum.style.height = '101px';
            });
        });
    };

    $scope.createNewList = function() {
        AC.Dialog.show('create-list');
        AC.Dialog.hide('choose-list');
    };

    var createListActions = function () {
        // Cancel action button
        dialogCreateSave = document.getElementById('dialog-create-save');
        dialogCreateSave.addEventListener('click', function () {
            AC.Dialog.hide('create-list');
        });

        // Cancel action button
        dialogCreateCancel = document.getElementById('dialog-create-cancel');
        dialogCreateCancel.addEventListener('click', function () {
            AC.Dialog.hide('create-list');
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

    $scope.inList = false;

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        serieContent = document.getElementById('serie-content');
        serieContentNum = document.getElementById('serie-content-num');
        fab = document.getElementById('fab');

        AC.Db.query('SELECT * FROM AC_SERIE_LIST LEFT JOIN AC_SERIE ON SERIE_EXT_ID = SL_SERIE_ID WHERE SL_SERIE_ID = ' + $stateParams.id + ' ORDER BY SERIE_DTEDITION DESC LIMIT 1', function (res) {
            if (res.length > 0) {
                if (res[0].SERIE_EXT_ID != null) {
                    $scope.currentSeason = res[0].SERIE_SEASON;
                    $scope.currentEpisode = res[0].SERIE_NUM;
                } else {
                    $scope.currentSeason = 1;
                    $scope.currentEpisode = 0;
                }

                $scope.$apply();

                header.style.height = (window.innerHeight - 100) + 'px';
                serieContent.style.top = (window.innerHeight - 100) + 'px';

                setTimeout(function () {
                    serieContentNum.style.height = '101px';
                }, 1000);

                //fab.className = 'fab btn-wave --hidden';
            } else {
                $scope.currentSeason = 1;
                $scope.currentEpisode = 0;

                header.style.height = window.innerHeight + 'px';
                serieContent.style.top = window.innerHeight + 'px';

                $scope.$apply();
            }
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
            $scope.serie.status = data.airing_status;
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
            $scope.serie.status = data.publishing_status;
            $scope.serie.genres = AC.Tools.translateList(AC.Models.translation.genres, data.genres);
            $scope.serie.chapters = AC.Tools.toInt(data.total_chapters);
            $scope.serie.volumes = AC.Tools.toInt(data.total_volumes);
            $scope.serie.synonyms = data.synonyms.join(', ');

            header.style.backgroundImage = 'url(' + data.image_url_lge + ')';

            $rootScope.showing = data;

            mangaType = data.type;
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

        AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_EXT_ID = ' + $stateParams.id + ' ORDER BY SERIE_DTEDITION DESC LIMIT 1', function (res) {
            if (res.length > 0) {
                $scope.currentChapter = res[0].SERIE_NUM;
                $scope.updateChapter = res[0].SERIE_NUM;

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
            }
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

app.controller('MenuCtrl', function ($scope, $state) {
    document.addEventListener('dbReady', function () {
        AC.Db.query("SELECT * FROM AC_LIST ORDER BY LIST_ID", function (res) {
            $scope.menuLists = res;
        });
    });

    $scope.openList = function (id) {
        $state.go('list', {
            id: id
        });

        AC.TouchMenu.close();
    };
});

app.controller('ListCtrl', function ($scope, $state, $stateParams) {
    AC.loading.show();

    var sql = "SELECT *";
    sql += " FROM AC_LIST";
    sql += " WHERE LIST_ID = " + $stateParams.id;

    AC.Db.query(sql, function (res) {
        $scope.listName = res[0].LIST_NAME;
    });

    AC.initialize($scope, function () {
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

app.controller('ListSeriesCtrl', function ($scope, $stateParams) {
    var sql = "SELECT AC_SERIE_LIST.*, ";
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