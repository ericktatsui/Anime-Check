(function() {
    var SpinnerLoading = function() {
        var self;

        var constructor = function() {
            self = this;

            this.isVisible = false;
            this.spinner = null;
            this.getSpinnerElem();
        };

        constructor.prototype.getSpinnerElem = function () {
            self.spinner = document.getElementById('spinner-content');
        };

        constructor.prototype.show = function () {
            self.spinner.style.display = 'block';
        };

        constructor.prototype.hide = function () {
            self.spinner.style.display = 'none';
        };

        return new constructor();
    };

    window.AC.loading = new SpinnerLoading();
}());