(function () {
    var Tools = function () {
        var self;

        var constructor = function () {
            self = this;
        };

        constructor.prototype.querySelector = function (selector) {
            var el = null;

            if (selector.indexOf(' ') == -1) {
                if (selector.substr(0, 1) == '.') {
                    el = document.getElementsByClassName(selector.replace('.', ''));
                } else if (selector.substr(0, 1) == '#') {
                    el = document.getElementById(selector.replace('#', ''));
                }
            } else {
                el = document.querySelectorAll(selector);

                if (el.length == 1) {
                    el = el[0];
                }
            }

            return el;
        };

        constructor.prototype.hasClass = function (elem, className) {
            return elem.classList.contains(className);
        };

        constructor.prototype.getColorByClass = function (className) {
            var colorRtn = null;

            for (var color in AC.Models.mainColors) {
                if (className.indexOf(color) != -1) {
                    colorRtn = AC.Models.mainColors[color];

                    break;
                }
            }

            if (!colorRtn) {
                colorRtn = "#FFF";
            }

            return colorRtn;
        };

        constructor.prototype.translateList = function (list, toTranslate) {
            var translated = [];

            for (var i = toTranslate.length; i--;) {
                translated.push(list[toTranslate[i].toLowerCase().replace(/( )/g, '_')]);
            }

            return translated;
        };

        return new constructor();
    };

    AC.Tools = new Tools();
}());