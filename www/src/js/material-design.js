(function() {
    var Dialog = function() {
        var self;

        var constructor = function() {
            self = this;
        };

        constructor.prototype.createShadow = function (fatherName) {
            var shadow = document.createElement('div');
            shadow.className = 'dialog-shadow';

            document.getElementById(fatherName).parentNode.appendChild(shadow);

            shadow.addEventListener('click', function() {
                self.hide(fatherName);
            });

            return shadow;
        };

        constructor.prototype.show = function (id) {
            var dialog = document.getElementById(id),
                shadow = self.createShadow(id);

            dialog.style.display = 'block';
            dialog.style.marginTop = '-' + (dialog.offsetHeight / 2) + 'px';

            shadow.style.opacity = '0.5';
            shadow.style.display = 'block';
        };

        constructor.prototype.hide = function (id) {
            var shadow = document.querySelector('.dialog-shadow'),
                dialog = document.getElementById(id);

            dialog.style.display = 'none';

            shadow.style.opacity = '0';
            shadow.style.display = 'none';

            shadow.remove();
        };

        return new constructor();
    };

    AC.Dialog = new Dialog();
}());