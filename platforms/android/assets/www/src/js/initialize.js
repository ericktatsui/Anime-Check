var initialize = function ($scope, callback) {
    var self;

    var constructor = function () {
        self = this;

        $scope.$on('$stateChangeSuccess', function () {
            self.menuBtnWave();
            self.menu();
            self.headerBtnWave();
            self.allBtnWave();
            self.setContainerSize();

            if (callback) {
                callback();
            }
        });
    };

    constructor.prototype.menu = function () {
        var menuEl = document.getElementById('menu');

        if (!AC.TouchMenu) {
            AC.TouchMenu = TouchMenu({
                menu: menuEl
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
                var hoverBall,
                    bgColor;

                bgColor = AC.Tools.getColorByClass(this.className);
                hoverBall = document.createElement('div');
                hoverBall.className = 'hover-ball';
                this.appendChild(hoverBall);

                hoverBall.style.webkitTransform = 'scale(1)';
                hoverBall.style.background = bgColor;
                hoverBall.style.opacity = '0.3';

                var timeoutWave = setTimeout(function () {
                    hoverBall.style.transition = 'none';
                    hoverBall.style.webkitTransform = 'scale(0)';

                    if (hoverBall) {
                        hoverBall.remove();
                    }

                    clearTimeout(timeoutWave);
                }, 500);

                var timeoutWaveBg = setTimeout(function () {
                    hoverBall.style.opacity = '0';

                    clearTimeout(timeoutWaveBg);
                }, 150);
            });
        }
    };

    constructor.prototype.allBtnWave = function () {
        var btnsWave = document.querySelectorAll('.btn-wave');

        for (var i = 0; i < btnsWave.length; i++) {
            btnsWave[i].addEventListener('touchend', function (e) {
                var hoverBall,
                    width,
                    bgColor;

                bgColor = AC.Tools.getColorByClass(this.className);
                hoverBall = document.createElement('div');
                hoverBall.className = 'hover-ball';
                this.appendChild(hoverBall);

                width = hoverBall.parentNode.clientWidth * 2;

                hoverBall.style.width = width + 'px';
                hoverBall.style.height = width + 'px';
                hoverBall.style.marginTop = -(width / 2) + 'px';
                hoverBall.style.marginLeft = -(width / 2) + 'px';
                hoverBall.style.top = (e.changedTouches[0].clientY - hoverBall.parentNode.getBoundingClientRect().top) + 'px';
                hoverBall.style.left = (e.changedTouches[0].clientX - hoverBall.parentNode.getBoundingClientRect().left) + 'px';
                hoverBall.style.webkitTransform = 'scale(1)';
                hoverBall.style.background = bgColor;
                hoverBall.style.opacity = '0.3';

                var timeoutWave = setTimeout(function () {
                    hoverBall.style.transition = 'none';
                    hoverBall.style.webkitTransform = 'scale(0)';

                    if (hoverBall) {
                        hoverBall.remove();
                    }

                    clearTimeout(timeoutWave);
                }, 500);

                var timeoutWaveBg = setTimeout(function () {
                    hoverBall.style.opacity = '0';

                    clearTimeout(timeoutWaveBg);
                }, 150);
            });
        }
    };

    constructor.prototype.menuBtnWave = function () {
        var btnsWave = document.querySelectorAll('.menu-items li');

        for (var i = 0; i < btnsWave.length; i++) {
            btnsWave[i].addEventListener('touchend', function (e) {
                var hoverBall;

                hoverBall = document.createElement('div');
                hoverBall.className = 'hover-ball';
                this.appendChild(hoverBall);

                hoverBall.style.width = '300px';
                hoverBall.style.height = '300px';
                hoverBall.style.marginTop = '-150px';
                hoverBall.style.marginLeft = '-150px';
                hoverBall.style.top = (e.changedTouches[0].clientY - hoverBall.parentNode.getBoundingClientRect().top) + 'px';
                hoverBall.style.left = (e.changedTouches[0].clientX - hoverBall.parentNode.getBoundingClientRect().left) + 'px';
                hoverBall.style.webkitTransform = 'scale(1)';
                hoverBall.style.background = '#000000';
                hoverBall.style.opacity = '0.3';

                var timeoutWave = setTimeout(function () {
                    hoverBall.style.transition = 'none';
                    hoverBall.style.webkitTransform = 'scale(0)';

                    if (hoverBall) {
                        hoverBall.remove();
                    }

                    clearTimeout(timeoutWave);
                }, 500);

                var timeoutWaveBg = setTimeout(function () {
                    hoverBall.style.opacity = '0';

                    clearTimeout(timeoutWaveBg);
                }, 150);
            });
        }
    };

    return new constructor();
};

AC.initialize = initialize;