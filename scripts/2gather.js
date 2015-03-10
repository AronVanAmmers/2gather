angular.module('2gather', ['ngRoute', 'tgAnimations', 'naif.base64'])

.constant('TPL_PATH', './templates')

.constant('API_BASE_URL', 'http://' + location.hostname + ':3000/apis/2gather')

.config(['$sceDelegateProvider',
    function ($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://ipfs:8080/**']);
  }])

.run(['$rootScope', 'Transaction',
    function ($rootScope, Transaction) {
        function promptUsername() {
            return prompt('User not found. Please enter a username to create a new user') || promptUsername();
        }
        Transaction('GET', 'session').then(function (user) {
            $rootScope.user = user;
        }, function (error) {
            Transaction('POST', 'users', {
                user_name: promptUsername()
            }).then(function (res) {
                Transaction('GET', 'session').then(function (user) {
                    $rootScope.user = user;
                });
                $rootScope.user = res;
            });
        });


        $rootScope.$on('$routeChangeStart', function () {
            $rootScope.$broadcast('tgLoadingStart');
        });
  }])

.config(function ($routeProvider, TPL_PATH) {
    $routeProvider.when('/', {
        controller: 'HomeCtrl',
        templateUrl: TPL_PATH + '/home.html',
        reloadOnSearch: false
    }).when('/watch/:id', {
        controller: 'WatchCtrl',
        templateUrl: TPL_PATH + '/watch.html',
        resolve: {
            Video: ['Transaction', '$location', '$rootScope', '$q',
                function (Transaction, $location, $rootScope, $q) {
                    if (!$rootScope.user) $location.path('/');
                    else {
                        var defer = $q.defer();
                        //match the ID with a regex instead of using route params
                        //since the route has not fully changed yetd
                        var id = $location.path().match(/watch\/([^ \/]+)(\/|$)/)[1];
                        Transaction('GET', 'users/' + $rootScope.user.user_name + '/videos/' + id).then(function (res) {
                            defer.resolve(res);
                        });
                        return defer.promise;
                    }
        }]
        }
    });
})

.directive('ntScrollToTop', ['$window', '$rootScope',
    function ($window, $rootScope) {
        return function () {
            $rootScope.$on('$routeChangeStart', function () {
                $window.scrollTo(0, 0);
            });
        };
  }])

.directive('tgLoadingIndicator', function () {
    return function (scope) {
        NProgress.configure({
            ease: 'ease',
            speed: 500
        });
        NProgress.start();
        scope.$on('tgLoadingStart', function () {
            console.log('loading start');
            NProgress.start();
        });
        scope.$on('tgLoadingEnd', function () {
            NProgress.done();
            console.log('loading end');
        });
    };
})

.controller('HomeCtrl', ['$scope', '$rootScope', '$location',
    function ($scope, $rootScope, $location) {

  }])

.filter('limit', function () {
    return function (results, limit) {
        return results && results.slice(0, limit);
    };
})

.controller('HeaderCtrl', ['$scope', '$location', '$rootScope', 'Transaction',
                         function ($scope, $location, $rootScope, Transaction) {

        $scope.uploadVideo = function (video) {
            var username = $scope.user.user_name;
            Transaction('POST', 'users/' + username + '/videos', {
                name: video.name,
                base64: video.file.base64
            }).then(function () {
                $scope.addingVideo = false;
                Transaction('GET', 'users/' + username + '/videos').then(function (user) {
                    $rootScope.videos = user.videos;
                });
            });
        };

        $scope.search = function () {
            var q = $scope.q;

            $location.search({
                user: q || ''
            }).path('/');
        };

        $scope.$watch(function () {
            return $location.search().user;
        }, function (newValue, oldValue) {
            if (newValue === oldValue) return;
            Transaction('GET', 'users/' + newValue)
                .then(function (user) {
                        $rootScope.videos = user.videos;
                    },
                    function () {});
        });

        $scope.$on('$routeChangeStart', function () {
            $scope.newVideo = undefined;
        });
}])

.controller('WatchCtrl', ['$scope', '$rootScope', '$location', 'Video',
                    function ($scope, $rootScope, $location, Video) {

        $scope.video = Video;

        $scope.delete = function (video) {
            Transaction('DELETE', 'users/' + $rootScope.user.username + '/video/' + video.id)
                .then(function () {
                    $location.path('/');
                });
        };
  }]);