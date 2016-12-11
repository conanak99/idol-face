const app = angular.module('jav-idol-face', ['angular-loading-bar', 'toastr']);

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
})
]);

app.config([
    'toastrConfig',
    toastrConfig => {
        angular.extend(toastrConfig, {timeOut: 5000});
    }
]);

app.factory('recognizeService', ['$q',
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

        getImageSize(imgLink) {
            return $q((resolve, reject) => {
                const img = new Image(); // Create new img element
                img.addEventListener("load", () => {
                    resolve({width: img.width, height: img.height});
                }, false);
                img.src = imgLink; // Set source path
            });
        },

        recognizeImage(imgLink) {
            toastr.info("Đang nhận diện, có thể hơi lâu, vui lòng chờ");
            const url = 'https://jav-recognize.azurewebsites.net/api/HttpTriggerCSharp1';

            return $http({
                method: 'POST',
                url,
                headers: {
                    'x-functions-key': 'k7dgy05qyfs8uwjvjrjdobt9x17c3yu0gteqyd0qqkomeu3di60kxsrkutl9yge0s2ixiil766r'
                },
                data: {
                    url: imgLink
                }
            }).then((result) => {
                return this.getImageSize(imgLink)
                .then(size => {
                    toastr.success('Xong rồi ahihi :">"');
                    const originalWidth = size.width;
                    const currentWidth = document.querySelector('#source-image').clientWidth;
                    const ratio = currentWidth / originalWidth;
                    const faces = result.data.map(r => {
                        const face = r.Face.FaceRectangle;
                        const faceStyle = {
                            width: `${face.Width * ratio}px`,
                            height: `${face.Height * ratio}px`,
                            left: `${face.Left * ratio}px`,
                            top: `${face.Top * ratio}px`
                        };

                        let candidate = {};
                        if (r.Candidates.length > 0) {
                            const firstCandidate = r.Candidates[0];
                            let fontSize = (face.Width * ratio / 6);
                            let minFontSize = 15;
                            fontSize = Math.max(fontSize, minFontSize);

                            candidate = {
                                name: firstCandidate.Idol.Name,
                                link: firstCandidate.Idol.Link,
                                nameStyle: {
                                    width: faceStyle.width,
                                    'font-size': `${fontSize}px`,
                                    'line-height': `${fontSize - 2}px`
                                    bottom: `-${fontSize}px`,
                                }
                            };
                        };
                        return {face: faceStyle, candidate};
                    });

                    return faces;
                });
            });
        }
    })
]);

app.controller('mainCtrl', [
    '$scope',
    'recognizeService',
    'toastr',
    ($scope, recognizeService, toastr) => {
        $scope.input = {
            source: 'link',
            imageLink: ""
        };

        // Reset image link when change sourcesource
        $scope.$watch('input.source', (newVal, oldVal) => {
            $scope.input.imageLink = "";
        });

        $scope.$watch('input.imageLink', (newVal, oldVal) => {
            $scope.faces = [];
        });

        $scope.recognize = () => {
            $scope.btnDisable = true;
            if ($scope.input.source == 'link') {
                recognizeService.recognizeImage($scope.input.imageLink).then(displayResult);
            } else {
                recognizeService.uploadImage($scope.input.imageLink).then(result => {
                    const url = result.data.url;
                    return url;
                }).then(recognizeService.recognizeImage.bind(recognizeService))
                .then(displayResult);
            }
        }

        function displayResult(result) {
            $scope.btnDisable = false;
            $scope.faces = result;
        }

        function displayError(errors) {
            toastr.error('Lỗi cbnr');
            $scope.btnDisable = false;
            console.log(errors);
        }
    }
]);
