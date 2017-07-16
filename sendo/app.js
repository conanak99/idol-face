const app = angular.module('sendo-app', ['angular-loading-bar', 'toastr']);
app.filter('dateFromNow', function() {
    return function(date) {
        if (!moment) {
            console.log('Error: momentJS is not loaded as a global');
            return '!momentJS';
        }
        return moment(date).fromNow();
    }
});

app.directive("fileread", [() => ({
        scope: {
            fileread: "="
        },

        link(scope, element, attributes) {
            element.bind("change", changeEvent => {
                const reader = new FileReader();
                reader.onload = loadEvent => {
                    scope.$apply(() => {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    })]);

app.directive('time', [
    '$timeout',
    '$filter',
    function($timeout, $filter) {

        return function(scope, element, attrs) {
            var time = attrs.time;
            var intervalLength = 1000 * 10; // 10 seconds
            var filter = $filter('dateFromNow');

            function updateTime() {
                element.text(filter(time));
            }

            function updateLater() {
                timeoutId = $timeout(function() {
                    updateTime();
                    updateLater();
                }, intervalLength);
            }

            element.bind('$destroy', function() {
                $timeout.cancel(timeoutId);
            });

            updateTime();
            updateLater();
        };

    }
]);

app.config([
    'toastrConfig', toastrConfig => {
        angular.extend(toastrConfig, {timeOut: 5000});
    }
]);

app.factory('clarifaiService', [
    '$http',
    function($http) {

        return {
            recogniseImage(url) {
                return clarifai.inputs.search({ input: {url: url} });
            }
        }
    }
]);

app.factory('recognizeService', [
    '$q',
    '$http',
    'toastr',
    ($q, $http, toastr) => ({
        uploadImage(imgBase64) {
            toastr.info("Đang up ảnh");
            const url = 'https://api.cloudinary.com/v1_1/hoangcloud/image/upload';

            return $http({
                method: 'POST',
                url,
                data: {
                    upload_preset: 'jav-idols',
                    file: imgBase64
                }
            });
        },

        uploadImageImgur(imgBase64) {
            toastr.info("Đang up ảnh");
            const url = 'https://api.imgur.com/3/image';
            var base = imgBase64.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '').replace('data:image/gif;base64,', '');

            return $http({
                method: 'POST',
                url,
                headers: {
                    'Authorization': 'Client-ID 56e948d072dfed8'
                },
                data: {
                    image: base
                }
            });
        }
    })
]);

app.controller('mainCtrl', [
    '$scope',
    'toastr',
    'clarifaiService',
    ($scope, toastr, clarifaiService) => {

        $scope.input = {
            source: 'link',
            imageLink: ""
        };
        $scope.oldImgLink = "";
        $scope.isLoading = false;

        // Reset image link when change sourcesource
        $scope.$watch('input.source', (newVal, oldVal) => {
            $scope.input.imageLink = "";
        });
        $scope.$watch('input.imageLink', (newVal, oldVal) => {
            $scope.faces = [];
        });

        $scope.recognize = () => {
            if (!isImageValid() || $scope.isLoading)
                return;

            $scope.isLoading = true;

            if ($scope.input.source == 'link') {
              clarifaiService
              .recogniseImage($scope.input.imageLink)
              .then(displayResult)
              .catch(displayError);

            } else {
                recognizeService.uploadImageImgur($scope.input.imageLink)
                .then(result => {
                    let url = result.data.data.link;
                    $scope.input.imageLink = url;
                    return url;
                })
                .then(clarifaiService.recogniseImage)
                .then(displayResult)
                .catch(displayError);
            }
        }

        function displayResult(result) {
            let hits = result.hits;
            let products = hits.map(h => h.input.data.metadata);

            $scope.result = products;
            $scope.isLoading = false;
            $scope.$digest();
            toastr.success('Xong rồi ahihi');
            console.log(products);
        }

        function displayError(error) {
            console.log(error);
            toastr.warning('Có lỗi xảy ra, bạn quay lại sau nhé.');
            $scope.isLoading = false;
            $scope.$digest();
        }

        function isImageValid() {
            if ($scope.input.source == 'link') {
                var regex = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
                if (!regex.test($scope.input.imageLink)) {
                    toastr.error('URL không hợp lệ');
                    return false;
                }
            } else if ($scope.input.imageLink.indexOf('data:image') == -1) {
                toastr.error('File không hợp lệ');
                return false;
            }
            return true;
        }
    }
]);
