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

app.run(function ($rootScope) {
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
});

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/home");

    $stateProvider
	.state('home', {
	    url: '/home',
	    views: {
	        '': {
	            templateUrl: 'view/home.html',
	            controller: 'HomeCtrl',
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
	    url: '/serie/:id',
	    templateUrl: 'view/serie.html',
	    controller: 'SerieCtrl'
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

app.service('$acApi', function ($rootScope, $acRequest) {
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

    $scope.openAnime = function (id) {
        $state.go('serie', { id: id });
    };
});

app.controller('HomeTabAnimesCtrl', function ($scope, $rootScope, $acApi) {
    if (TEMP.animeList == null) {
        $acApi.list('anime',
        {
            'year': CONFIG.currentYear,
            'type': 'tv'
        }, function (data) {
            $scope.list = data;
            TEMP.animeList = data;
            AC.loading.hide();
        });
    } else {
        $scope.list = TEMP.animeList;
        AC.loading.hide();
    }
});

app.controller('HomeTabMangasCtrl', function ($scope, $rootScope, $acApi) {
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

    $scope.openAnime = function (id) {
        $state.go('serie', { id: id });
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
});

app.controller('SearchTabMangasCtrl', function ($scope, $rootScope, $acApi) {
    document.getElementById('tab2').addEventListener('tabFocused', function (e) {
        AC.loading.show();
        $scope.list = [];

        $acApi.search('manga', $scope.searchQuery, function (data) {
            $scope.list = data;

            AC.loading.hide();
        });
    });
});

app.controller('SerieCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    var header,
        changeSeasonButton,
        dialogSeasonCancel,
        dialogSeasonSave,
        dialogEpisodeCancel,
        dialogEpisodeSave,
        hasSeason = [];

    $scope.currentEpisode = '--';
    $scope.currentSeason = '--';

    AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' ORDER BY SERIE_DTEDITION DESC LIMIT 1', function (res) {
        if (res.length > 0) {
            $scope.currentSeason = res[0].SERIE_SEASON;
            $scope.currentEpisode = res[0].SERIE_NUM;
        } else {
            $scope.currentSeason = 1;
            $scope.currentEpisode = 0;
        }
    });

    $scope.updateSeason = 0;
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
            AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' AND SERIE_SEASON = ' + $scope.updateSeason + ' LIMIT 1', function (res) {
                if (res.length > 0) {
                    AC.Db.query("UPDATE AC_SERIE SET SERIE_DTEDITION = '" + moment().format() + "' WHERE SERIE_SEASON = " + res[0].SERIE_SEASON, function () {
                        $scope.currentSeason = res[0].SERIE_SEASON;
                        $scope.currentEpisode = res[0].SERIE_NUM;

                        $scope.updateSeason = res[0].SERIE_SEASON;
                        $scope.updateEpisode = res[0].SERIE_NUM;

                        $scope.$apply();
                    });
                } else {
                    AC.Db.query("INSERT INTO AC_SERIE (SERIE_ANIME_ID, SERIE_SEASON, SERIE_NUM, SERIE_DTEDITION) VALUES (" + $stateParams.id + ", " + $scope.updateSeason + ", 0, '" + moment().format() + "')", function () {
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
            AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' AND SERIE_SEASON = ' + $scope.currentSeason + ' LIMIT 1', function (res) {
                if (res.length > 0) {
                    AC.Db.query("UPDATE AC_SERIE SET SERIE_NUM = " + $scope.updateEpisode + ", SERIE_DTEDITION = '" + moment().format() + "' WHERE SERIE_SEASON = " + res[0].SERIE_SEASON, function (res) {
                        $scope.currentEpisode = $scope.updateEpisode;

                        $scope.$apply();
                    });
                } else {
                    AC.Db.query("INSERT INTO AC_SERIE (SERIE_ANIME_ID, SERIE_SEASON, SERIE_NUM, SERIE_DTEDITION) VALUES (" + $stateParams.id + ", " + $scope.updateSeason + ", " + $scope.updateEpisode + ", '" + moment().format() + "')", function (res) {
                        $scope.currentEpisode = $scope.updateEpisode;

                        $scope.$apply();
                    });
                }
            });

            AC.Dialog.hide('change-episode');
        });
    };

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        header.style.height = (window.innerHeight - 100) + 'px';

        seasonActions();
        episodeActions();


        //if (hasSerie) {
        //    AC.Db.query('UPDATE AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' LIMIT 1', function (res) {
        //        if (res.length > 0) {
        //            $scope.episodeNumber = res[0].SERIE_NUM;
        //        }
        //    });
        //} else {
        //    AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' LIMIT 1', function (res) {
        //        if (res.length > 0) {
        //            $scope.episodeNumber = res[0].SERIE_NUM;
        //        }
        //    });
        //}
    });

    AC.loading.show();

    $scope.serie = {};
    $scope.translation = AC.Models.translation;

    $acApi.fromId('anime', $stateParams.id, false, function (data) {
        AC.loading.hide();

        if (data) {
            $scope.serie.title = data.title_romaji;
            $scope.serie.titleJp = data.title_japanese;
            $scope.serie.img = data.image_url_lge;
            $scope.serie.score = data.average_score;
            $scope.serie.status = data.airing_status;
            $scope.serie.genres = AC.Tools.translateList(AC.Models.translation.genres, data.genres);
            $scope.serie.episodes = data.total_episodes;
            $scope.serie.duration = data.duration;

            header.style.backgroundImage = 'url(' + data.image_url_lge + ')';
        }
    });

    $scope.favorite = function () {
    };

    $scope.updateEpisode = 0;
    AC.Db.query('SELECT * FROM AC_SERIE WHERE SERIE_ANIME_ID = ' + $stateParams.id + ' LIMIT 1', function (res) {
        if (res.length > 0) {
            hasSeason[res[0].SERIE_SEASON] = true;
            $scope.episodeNumber = res[0].SERIE_NUM;
        } else {
            hasSeason[1] = false;
        }
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