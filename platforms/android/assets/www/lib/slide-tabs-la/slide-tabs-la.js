/// <reference path="../hammer/hammer.min.js" />

window.SlideTabsLA = function (opt) {
    var self,
        hammer,
        canSlideHorizontal = true,
        liItems = opt.target.querySelectorAll('li'),
        tabContents = opt.container.querySelectorAll('.tab-content'),
        lastTabPos = 0,
        lastScrollTop = 0,
        lastPageY = 0,
        line,
        itemsQtd = liItems.length,
        itemWidth = window.innerWidth / itemsQtd, // largura padrão dos items
        fittings = [], // Valores que a linha pode ser encaixada
        fittingPossibilitty = itemWidth * 0.70, // 70% do valor da largura dos items (possibilidade de encaixar posição na tab / aderencia)
        tabEvent = document.createEvent('Event');

    var constructor = function () {
        self = this; // para evitar problemas de escopo

        this.lastPos = 0; // última posição
        this.currentTab = 1; // posição atual da linha
        this.currentPos = 0; // posição atual, dado a cada mover do 
        this.isActive = false;

        this.initializer();
    };

    constructor.prototype.initializer = function () {
        self.createLine()
            .setWidth()
            .createFitings()
            .hammerInit()
            .setTabsClick()
            .setContainerSize()
            .onTabContentScroll()
            .onWindowResize()
            .createEvent();

        self.isActive = true;
    };

    constructor.prototype.createEvent = function () {
        tabEvent.initEvent('tabFocused', true, true);

        return self;
    };

    constructor.prototype.createLine = function () {
        var lineEl = document.createElement('div');
        lineEl.setAttribute('id', 'stla-line');

        opt.target.appendChild(lineEl);

        line = document.querySelector('#stla-line');

        return self;
    };

    constructor.prototype.setWidth = function () {
        itemWidth = window.innerWidth / itemsQtd;

        opt.container.style.width = (window.innerWidth * itemsQtd) + 'px';

        for (var i = 0; i <= itemsQtd; i++) {
            if (tabContents[i] && liItems[i]) {
                liItems[i].style.width = itemWidth + 'px';
                tabContents[i].style.width = window.innerWidth + 'px';
                tabContents[i].style.left = (window.innerWidth * i) + 'px';
            }
        }

        line.style.width = itemWidth + 'px';

        return self;
    };

    // Cria um array com as posições de encaixe da linha
    constructor.prototype.createFitings = function () {
        fittings = [];

        for (var i = 1; i <= itemsQtd; i++) {
            fittings.push({
                min: (itemWidth * i) - fittingPossibilitty,
                max: (itemWidth * i) + fittingPossibilitty,
                pos: i,
                posPx: (itemWidth * (i - 1))
            });
        }

        return self;
    };

    constructor.prototype.setContainerSize = function () {
        opt.container.style.height = (window.innerHeight - opt.target.offsetHeight) + 'px';

        return self;
    };

    constructor.prototype.onTabContentScroll = function () {
        var scrollTimeOut;

        for (var i = 0; i <= itemsQtd; i++) {
            if (tabContents[i]) {
                tabContents[i].addEventListener('scroll', function (e) {
                    opt.container.style.webkitTransition = 'none';
                    canSlideHorizontal = false;

                    if (e.srcElement.scrollTop > lastPageY) {
                        opt.target.style.webkitTransform = 'translate3d(0px, -56px, 0px)';
                        opt.container.style.webkitTransform = 'translate3d(' + lastTabPos + 'px, -56px, 0px)';
                        opt.headerContainer.style.webkitTransform = 'translate3d(0px, -56px, 0px)';
                        lastScrollTop = -56;
                    } else {
                        opt.target.style.webkitTransform = 'translate3d(0px, 0, 0px)';
                        opt.container.style.webkitTransform = 'translate3d(' + lastTabPos + 'px, 0, 0px)';
                        opt.headerContainer.style.webkitTransform = 'translate3d(0px, 0, 0px)';
                        lastScrollTop = 0;
                    }

                    clearTimeout(scrollTimeOut);
                    scrollTimeOut = setTimeout(function () {
                        clearTimeout(scrollTimeOut);

                        canSlideHorizontal = true;
                    }, 100);

                    lastPageY = e.srcElement.scrollTop;
                });

                tabContents[i].addEventListener('touchmove', function (e) {
                    if (this.scrollTop >= this.scrollHeight && e.touches[0].pageY >= this.scrollHeight) {
                        this.scrollTop = this.scrollHeight;

                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                });
            }
        }

        return self;
    };

    constructor.prototype.setTabsClick = function () {
        for (var i = 0; i < itemsQtd; i++) {
            liItems[i].addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                self.goToTab(
                    this.getElementsByTagName('a')[0]
                        .getAttribute('href')
                        .replace('#tab', '')
                );

                lastTabPos = -self.currentPos * itemsQtd;
            });
        }

        return self;
    };

    constructor.prototype.hammerInit = function () {
        hammer = new window.Hammer(opt.container);

        if (!opt.threshold) {
            opt.threshold = 0;
        }

        if (!opt.pointers) {
            opt.pointers = 1;
        }

        hammer.get('pan').set({
            threshold: opt.threshold, // A partir de quantos pixels começa o movimento
            pointers: opt.pointers, // Suporte multitouch, quantos pointeiros para fazer o movimento
            direction: window.Hammer.DIRECTION_HORIZONTAL // Somente vertical
        });

        self.setHammerEvents();

        return self;
    };

    constructor.prototype.setHammerEvents = function () {
        hammer.on('panmove', function (e) {
            self.touchMove(e);
        });

        hammer.on('panend pancancel', function (e) {
            self.touchEnd(e);
        });
    };

    constructor.prototype.moveTab = function (transition, pos) {
        line.style.webkitTransition = transition;
        line.style.webkitTransform = 'translate3d(' + pos + 'px, 0, 0)';

        opt.container.style.webkitTransition = transition;
        opt.container.style.webkitTransform = 'translate3d(' + (-pos * itemsQtd) + 'px, ' + lastScrollTop + 'px, 0)';
    };

    constructor.prototype.touchMove = function (e) {
        e.deltaX = e.deltaX / itemsQtd;

        line.style.transition = 'none';

        if (canSlideHorizontal) {
            // Se passar do limite máximo
            if ((self.currentPos + itemWidth) >= (window.innerWidth - 10)) {
                self.moveTab('transform 0.3s ease', (itemWidth * (itemsQtd - 1)));

                if (e.deltaX > 0) {
                    self.currentPos = self.lastPos - e.deltaX;
                    self.moveTab('none', self.currentPos);
                }
            } else if (self.currentPos <= 10) {
                self.moveTab('transform 0.3s ease', 0);

                if (e.deltaX < 0) {
                    self.currentPos = self.lastPos - e.deltaX;
                    self.moveTab('none', self.currentPos);
                }
            } else {
                self.currentPos = self.lastPos - e.deltaX;
                self.moveTab('none', self.currentPos);
            }
        }
    };

    constructor.prototype.touchEnd = function (e) {
        self.lastPos = self.currentPos;

        if (canSlideHorizontal) {
            if (e.velocityX > 0.3 && canSlideHorizontal) {
                self.goToTab(self.currentTab + 1);
            } else if (e.velocityX < -0.3 && canSlideHorizontal) {
                self.goToTab(self.currentTab - 1);
            } else {
                for (var i = 0; i < fittings.length; i++) {
                    if (e.deltaX < 0) {
                        if ((self.lastPos + itemWidth) <= fittings[i].max) {
                            self.currentPos = fittings[i].posPx;
                            self.currentTab = fittings[i].pos;
                            i = fittings.length;
                        }
                    } else {
                        if (self.lastPos <= fittings[i].min) {
                            self.currentPos = fittings[i].posPx;
                            self.currentTab = fittings[i].pos;
                            i = fittings.length;
                        }
                    }
                }

                self.lastPos = self.currentPos;
                self.moveTab('transform 0.3s ease', self.currentPos);
            }

            lastTabPos = -self.currentPos * itemsQtd;
            //console.log(lastTabPos);

            if (opt.onTabChange) {
                opt.onTabChange.call(self);
            }

            tabContents[self.currentTab - 1].dispatchEvent(tabEvent);
        }
    };

    constructor.prototype.onWindowResize = function () {
        if (opt.resize == true) {
            window.addEventListener('resize', function () {
                self.setWidth()
                    .createFitings()
                    .setContainerSize();

                self.moveTab('none', fittings[self.currentTab - 1].posPx);
                self.currentPos = fittings[self.currentTab - 1].posPx;
                self.lastPos = self.currentPos;
            });
        }

        return self;
    };

    constructor.prototype.goToTab = function (num, transition) {
        var transitionVal = 'transform 0.3s ease';
        if (transition == false) {
            transitionVal = 'none';
        }

        if (fittings[num - 1]) {
            self.moveTab(transitionVal, fittings[num - 1].posPx);
            self.currentPos = fittings[num - 1].posPx;
            self.currentTab = fittings[num - 1].pos;
            self.lastPos = self.currentPos;

            if (opt.ontabfocused) {
                tabContents.ontabfocused.call(self);
            }

            tabContents[self.currentTab - 1].dispatchEvent(tabEvent);
        } else {
            //console.warn('A aba ' + num + ' não existe.');
        }
    };

    return new constructor();
};