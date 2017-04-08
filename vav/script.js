// Code goes here
var app = angular.module('app', []);

app.factory('recognizeService', function($http) {
    return {
        recognize: function(imgLink) {
            var url = 'https://wt-huyhoang8a5-gmail-com-0.run.webtask.io/idol-recognize';
            return $http({
                method: 'POST',
                url,
                data: {
                    url: imgLink
                }
            });
        }
    }
});

app.controller('mainCtrl', function($scope, recognizeService) {
    $scope.isLoading = false;

    $scope.$watch('imageLink', function(oldValue, newValue) {
        $scope.faces = [];
        $scope.faceDisplay = [];
    });

    // Gọi hàm này khi người dùng click button "Nhận diện"
    $scope.recognize = function() {
        if ($scope.isLoading)
            return;

        $scope.isLoading = true;
        // Gọi hàm recognize của service
        recognizeService.recognize($scope.imageLink).then(result => {
            $scope.faces = result.data;

            // Dựa vào kết quả trả về để set style động cho class idol-face
            $scope.faceDisplay = result.data.map(rs => {
                return {
                    style: {
                        top: rs.face.top + 'px',
                        left: rs.face.left + 'px',
                        width: rs.face.width + 'px',
                        height: rs.face.height + 'px'
                    },
                    name: rs.idol.name
                }
            });
            $scope.isLoading = false;
        });
    }

    // Danh sách ảnh để test
    $scope.testImages = ["http://tse3.mm.bing.net/th?id=OIP.M62d737028ee51f22482fab76bdfe112do1&pid=15.1", "http://tse4.mm.bing.net/th?id=OIP.M93d1646690a0f345e561a80523529bb2o1&pid=15.1", "http://media.ngoisao.vn/resize_580/news/2014/11/30/miu-le-20.jpg", "http://static.giaoducthoidai.vn/uploaded/hainv/2016_01_27/images16422691452168028hotgirlhaiphongxinhnhumong191657_uzve.jpg?width=500"];

    // Danh sách idol
    $scope.idols = [
        "Ngọc Trinh",
        "Bà tưng",
        "Hường Hana",
        "Hoàng Thùy Linh",
        "Elly Trần",
        "Thuỷ Top",
        "Tâm Tít",
        "Midu",
        "Miu Lê",
        "Chi Pu",
        "Khả Ngân",
        "Angela Phương Trinh"
    ];
});
