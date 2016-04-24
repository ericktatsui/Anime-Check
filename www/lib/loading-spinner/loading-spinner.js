(function() {
    var SpinnerLoading = function() {
        var self;

        var constructor = function() {
            self = this;

            this.isVisible = false;
            this.spinner = null;
            this.mask = null;
            this.getSpinnerElem();
        };

        constructor.prototype.getSpinnerElem = function () {
            self.spinner = document.getElementById('spinner-content');
            self.mask = document.getElementById('mask-spinner');
        };

        constructor.prototype.show = function () {
            self.spinner.style.display = 'block';
            self.mask.style.display = 'block';
        };

        constructor.prototype.hide = function () {
            self.spinner.style.display = 'none';
            self.mask.style.display = 'none';
        };

        return new constructor();
    };

    window.AC.loading = new SpinnerLoading();
}());