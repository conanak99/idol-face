const app = angular.module('jav-idol-face',
['angular-loading-bar', 'angularUtils.directives.dirPagination', 'toastr']);

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

app.config(['paginationTemplateProvider',function(paginationTemplateProvider) {
    paginationTemplateProvider.setPath('/js/templates/dirPagination.tpl.html');
}]);

app.factory('idolService',['$http', function($http) {

  function nameToLink(name) {
    // Generate thumbnail link based on name
    var lowerCaseName = name.trim().split(' ')
    .map(n => n.toLowerCase()).join('-');
    return `http://www.japanesebeauties.net/japanese/${lowerCaseName}/1/cute-${lowerCaseName}-1.jpg`;
  }

  return {
    loadIdols() {
      return $http({
        method: 'GET',
        url: 'https://s3-ap-southeast-1.amazonaws.com/linhtinh-hoangph/topIdols.json'
      }).then(result => result.data.map(idol => {
        return {
          id: idol.ID,
          name: idol.Name,
          link: `http://www.jjgirls.com${idol.Link}`,
          thumbnail : nameToLink(idol.Name),
          bigThumb: nameToLink(idol.Name).replace('cute-', '')
        };
      }));
    },
  }
}]);

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
                                    'line-height': `${fontSize - 2}px`,
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
    'idolService',
    'toastr',
    ($scope, recognizeService, idolService, toastr) => {
        $scope.input = {
            source: 'link',
            imageLink: ""
        };

        idolService.loadIdols().then(result => {
            $scope.idols = result;
        });

        // Reset image link when change sourcesource
        $scope.$watch('input.source', (newVal, oldVal) => {
            $scope.input.imageLink = "";
        });

        $scope.$watch('input.imageLink', (newVal, oldVal) => {
            $scope.faces = [];
        });

        $scope.recognize = () => {
            if ($scope.btnDisable) return;

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
