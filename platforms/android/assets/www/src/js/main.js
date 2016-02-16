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
	            controller: 'TabAnimesCtrl'
	        },
	        'mangas@home': {
	            templateUrl: 'view/series.html',
	            controller: 'TabMangasCtrl'
	        },
	        'filmes@home': {
	            templateUrl: 'view/series.html',
	            controller: 'TabMoviesCtrl'
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
	        'search-content@search': {
	            templateUrl: 'view/series.html'
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

                //$acRequest.get('https://anilist.co/api/browse/anime/?year=2016&type=tv&access_token=' + CONFIG.accessToken, function (data) {
                //    console.log(data);
                //}, function(data) {
                //    console.error(data);
                //});
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

    this.fromId = function (type, id, callback) {
        this.getToken(function (token) {
            var url;

            if (CONFIG.enableDebug) {
                url = CONFIG.debugUrl + '?typeq=' + type + '&id=' + id;
            } else {
                url = CONFIG.apiUrl + type + '/' + id + '/?access_token=' + token;
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

    this.search = function (query, callback) {
        this.getToken(function (token) {
            var url = '';

            if (CONFIG.enableDebug) {
                url = CONFIG.debugUrl + '?search=' + query;
            } else {
                url = CONFIG.apiUrl + 'anime/search/' + query + '/?access_token=' + token;
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
                url = CONFIG.debugUrl + '?list' + paramns + '&typeq=' + query;
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

        AC.SlideTabs = SlideTabsLA({
            container: document.getElementById('content'),
            target: document.getElementById('tabs'),
            headerContainer: document.getElementById('header'),
            resize: true,
            onTabChange: function () {
                //SSSconsole.log(this);
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

app.controller('TabAnimesCtrl', function ($scope, $rootScope, $acApi) {
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

app.controller('TabMangasCtrl', function ($scope, $rootScope, $acApi) {
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

app.controller('TabMoviesCtrl', function ($scope, $rootScope, $acApi) {
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

        $acApi.search($scope.searchQuery, function (data) {
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

app.controller('SerieCtrl', function ($scope, $rootScope, $acApi, $stateParams) {
    var header,
        changeSeasonButton,
        dialogSeasonButton;

    AC.initialize($scope, function () {
        header = document.querySelector('#header.header-serie');
        header.style.height = (window.innerHeight - 100) + 'px';

        changeSeasonButton = document.getElementById('season-button');
        changeSeasonButton.addEventListener('click', function (e) {
            AC.Dialog.show('change-season');
        });

        dialogSeasonButton = document.getElementById('dialog-season-button');
        dialogSeasonButton.addEventListener('click', function () {
            AC.Dialog.hide('change-season');
        });
    });

    AC.loading.show();

    $acApi.fromId('anime', $stateParams.id, function (data) {
        AC.loading.hide();

        if (data) {
            $scope.title = data.title_romaji;
            $scope.titleJp = data.title_japanese;
            $scope.img = data.image_url_lge;
            $scope.score = data.average_score;
            $scope.status = data.airing_status;
            $scope.genres = data.genres;
            $scope.episodes = data.total_episodes;

            header.style.backgroundImage = 'url(' + $scope.img + ')';
        }
    });
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