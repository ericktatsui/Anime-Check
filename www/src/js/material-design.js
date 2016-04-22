(function () {
    var Dialog = function () {
        var self;

        var constructor = function () {
            self = this;
        };

        constructor.prototype.createShadow = function (fatherName) {
            var shadow = document.createElement('div');
            shadow.className = 'dialog-shadow';

            document.getElementById(fatherName).parentNode.appendChild(shadow);

            shadow.addEventListener('click', function () {
                self.hide(fatherName);
            });

            return shadow;
        };

        constructor.prototype.show = function (id) {
            var dialog = document.getElementById(id),
                content = dialog.getElementsByClassName('dialog-content')[0],
                shadow = self.createShadow(id),
                viewIndex = document.getElementById('view-index'),
                lastScrollTop = 0;

            viewIndex.style.overflowY = 'hidden';

            if (dialog != undefined) {
                dialog.style.display = 'block';
                dialog.style.marginTop = '-' + (dialog.offsetHeight / 2) + 'px';
            }

            if (shadow != undefined) {
                shadow.style.opacity = '0.5';
                shadow.style.display = 'block';
            }

            if (content.scrollHeight > 250) {
                content.style.borderBottom = '1px #E0E0E0 solid';

                content.addEventListener('scroll', function (e) {
                    if (e.target.scrollTop == 0) {
                        content.style.borderTop = '';
                    } else {
                        content.style.borderTop = '1px #E0E0E0 solid';
                    }

                    if (e.target.scrollTop >= (content.scrollHeight - content.offsetHeight)) {
                        content.style.borderBottom = '';
                    } else {
                        content.style.borderBottom = '1px #E0E0E0 solid';
                    }
                });
            }
        };

        constructor.prototype.hide = function (id) {
            var shadow = document.querySelector('.dialog-shadow'),
                dialog = document.getElementById(id),
                viewIndex = document.getElementById('view-index');

            viewIndex.style.overflowY = 'auto';

            if (dialog != undefined) {
                dialog.style.display = 'none';
            }

            if (shadow != undefined) {
                shadow.style.opacity = '0';
                shadow.style.display = 'none';
                shadow.remove();
            }
        };

        return new constructor();
    };

    AC.Dialog = new Dialog();
}());