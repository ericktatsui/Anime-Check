var initialize = function ($scope, callback, splash) {
    var self;

    var constructor = function () {
        self = this;

        if ( splash != true ) {
            $scope.$on('$stateChangeSuccess', function() {
                self.menuBtnWave();
                self.menu();
                self.headerBtnWave();
                self.allBtnWave();
                self.setContainerSize();

                if (callback) {
                    callback();
                }
            });
        }
    };

    constructor.prototype.initDebug = function () {
        if (window.device == undefined) {
            window.device = {
                model: 'debug',
                platform: 'debug',
                uuid: 'debug',
                version: 1.0
            };
        }
    };

    constructor.prototype.menu = function () {
        var menuEl = document.getElementById('menu');

        if (!AC.TouchMenu) {
            AC.TouchMenu = TouchMenuLA({
                target: menuEl
            });
        }
    };

    constructor.prototype.setContainerSize = function () {
        var container = document.querySelector('.content');

        if (container && AC.Tools.hasClass(container, 'scroll')) {
            document.getElementById('view-index').style.overflow = 'hidden';
            container.style.overflow = 'auto';
        }
    };

    constructor.prototype.headerBtnWave = function () {
        var links = document.querySelectorAll('.icon-btn');

        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('touchend', function (e) {
                var hoverBall;

                hoverBall = document.createElement('div');
                hoverBall.className = 'wave-effect';
                this.appendChild(hoverBall);

                hoverBall.style.webkitTransform = 'scale(1)';
                hoverBall.style.opacity = '0.1';

                //var timeoutWave = setTimeout(function () {
                //    hoverBall.style.transition = 'none';
                //    hoverBall.style.webkitTransform = 'scale(0)';

                //    if (hoverBall.parentNode) {
                //        hoverBall.parentNode.removeChild(hoverBall);
                //    }

                //    clearTimeout(timeoutWave);
                //}, 500);

                //var timeoutWaveBg = setTimeout(function () {
                //    hoverBall.style.opacity = '0';

                //    clearTimeout(timeoutWaveBg);
                //}, 250);
            });
        }
    };

    constructor.prototype.allBtnWave = function () {
        var btnsWave = document.querySelectorAll('.btn-wave');

        for (var i = 0; i < btnsWave.length; i++) {
            btnsWave[i].addEventListener('touchend', function (e) {
                var waveEffect,
                    width,
                    bgColor;

                bgColor = AC.Tools.getColorByClass(this.className);
                waveEffect = document.createElement('div');
                waveEffect.className = 'wave-effect';
                this.appendChild(waveEffect);

                width = waveEffect.parentNode.clientWidth * 2;

                waveEffect.style.width = width + 'px';
                waveEffect.style.height = width + 'px';
                waveEffect.style.marginTop = -(width / 2) + 'px';
                waveEffect.style.marginLeft = -(width / 2) + 'px';
                waveEffect.style.top = (e.changedTouches[0].clientY - waveEffect.parentNode.getBoundingClientRect().top) + 'px';
                waveEffect.style.left = (e.changedTouches[0].clientX - waveEffect.parentNode.getBoundingClientRect().left) + 'px';
                waveEffect.style.webkitTransform = 'scale(1)';
                waveEffect.style.background = bgColor;
                waveEffect.style.opacity = '0.1';

                var timeoutWave = setTimeout(function () {
                    waveEffect.style.transition = 'none';
                    waveEffect.style.webkitTransform = 'scale(0)';

                    if (waveEffect) {
                        waveEffect.remove();
                    }

                    clearTimeout(timeoutWave);
                }, 500);

                var timeoutWaveBg = setTimeout(function () {
                    waveEffect.style.opacity = '0';

                    clearTimeout(timeoutWaveBg);
                }, 150);
            });
        }
    };

    constructor.prototype.menuBtnWave = function () {
        var btnsWave = document.querySelectorAll('.menu-items li:not(.space):not(line)');

        for (var i = 0; i < btnsWave.length; i++) {
            btnsWave[i].addEventListener('touchend', function (e) {
                var waveEffect;

                waveEffect = document.createElement('div');
                waveEffect.className = 'wave-effect';
                this.appendChild(waveEffect);

                waveEffect.style.width = '300px';
                waveEffect.style.height = '300px';
                waveEffect.style.marginTop = '-150px';
                waveEffect.style.marginLeft = '-150px';
                waveEffect.style.top = (e.changedTouches[0].clientY - waveEffect.parentNode.getBoundingClientRect().top) + 'px';
                waveEffect.style.left = (e.changedTouches[0].clientX - waveEffect.parentNode.getBoundingClientRect().left) + 'px';
                waveEffect.style.webkitTransform = 'scale(1)';
                waveEffect.style.background = '#000000';
                waveEffect.style.opacity = '0.1';

                var timeoutWave = setTimeout(function () {
                    waveEffect.style.transition = 'none';
                    waveEffect.style.webkitTransform = 'scale(0)';

                    if (waveEffect) {
                        waveEffect.remove();
                    }

                    clearTimeout(timeoutWave);
                }, 500);

                var timeoutWaveBg = setTimeout(function () {
                    waveEffect.style.opacity = '0';

                    clearTimeout(timeoutWaveBg);
                }, 100);
            });
        }
    };

    return new constructor();
};

AC.initialize = initialize;