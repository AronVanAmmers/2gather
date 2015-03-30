angular.module('2gather', ['ngRoute', 'tgAnimations', 'naif.base64'])

.constant('TPL_PATH', './templates')

.constant('API_BASE_URL', 'http://' + location.hostname + ':3000/apis/2gather')

.config(['$sceDelegateProvider',
    function ($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://ipfs:8080/**']);
  }])

.run(['$rootScope', 'Transaction', '$location',
    function ($rootScope, Transaction, $location) {
        $location.path('/');
        $location.search({});

        function promptUsername() {
            return prompt('User not found. Please enter a username to create a new user') || promptUsername();
        }
        Transaction('GET', 'session').then(function (user) {
            $rootScope.user = user;
            $rootScope.videos = user.videos;
        }, function (error) {
            Transaction('POST', 'users', {
                user_name: promptUsername()
            }).then(function (res) {
                Transaction('GET', 'session').then(function (user) {
                    $rootScope.user = user;
                    $rootScope.videos = user.videos;
                });
                $rootScope.user = res;
            });
        });


        $rootScope.$on('$locationChangeStart', function (ev, next) {
            $rootScope.$broadcast('tgLoadingStart');
            if (!$rootScope.user && next.indexOf('#') !== next.length - 2) ev.preventDefault();
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
            Video: ['Transaction', '$location', '$rootScope', '$q', '$sce',
                function (Transaction, $location, $rootScope, $q, $sce) {
                    if (!$rootScope.user) {
                        $location.path('/');
                        return;
                    }
                    var defer = $q.defer();
                    //match the ID with a regex instead of using route params
                    //since the route has not fully changed yetd
                    var username = currentlyViewedUser ? currentlyViewedUser.user_name : $rootScope.user.user_name;
                    var id = $location.path().match(/watch\/([^ \/]+)(\/|$)/)[1];
                    Transaction('GET', 'users/' + username + '/videos/' + id).then(function (video) {
                        Transaction('GET', 'videos/' + video.hash).then(function (base64) {
                            video.base64 = $sce.trustAsResourceUrl('data:video/mp4;base64,' + base64);
                            defer.resolve(video);
                        });
                    });
                    return defer.promise;
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

.controller('HomeCtrl', ['$scope', '$rootScope', '$location', 'Transaction',
    function ($scope, $rootScope, $location, Transaction) {
        $scope.canDelete = function () {
            return !$location.search().user; //not viewing subscription. so list of videos is user's own
        };

        $scope.addVideo = function () {
            $scope.$emit('addVideo');
        };

        $scope.delete = function (video, index) {
            Transaction('DELETE', 'users/' + $rootScope.user.user_name + '/videos/' + video.id)
                .then(function () {
                    $scope.user.videos.splice(index, 1);
                });
        };
  }])

.filter('limit', function () {
    return function (results, limit) {
        return results && results.slice(0, limit);
    };
})

.controller('HeaderCtrl', ['$scope', '$location', '$rootScope', 'Transaction',
                         function ($scope, $location, $rootScope, Transaction) {

        var currentlyViewedUser;
        $rootScope.getCurrentlyViewedUser = function () {
            return currentlyViewedUser;
        };
        $rootScope.subscribedTo = function (username) {
            return $rootScope.user.subscribers.indexOf(username) !== -1;
        };

        $rootScope.viewingUser = function () {
            if (!currentlyViewedUser) return;
            return currentlyViewedUser.user_name;
        };

        $rootScope.toggleSubscribe = function () {
            if (subscribedTo(currentlyViewedUser.user_name)) {
                Transaction('DELETE', 'users/' + $rootScope.user.user_name + '/subs/' + currentlyViewedUser.user_name)
                    .then(function () {
                        var subs = $rootScope.user.subscribers;
                        subs.splice(subs.indexOf(currentlyViewedUser.user_name), 1);
                    });
            } else {
                Transaction('POST', 'users/' + $rootScope.user.user_name + '/subs', {
                    user_name: currentlyViewedUser.user_name
                }).then(function () {
                    $rootScope.user.subscribers.push(currentlyViewedUser.user_name);
                });
            }
        };

        $scope.uploadVideo = function (video) {
            var username = $scope.user.user_name;
            Transaction('POST', 'users/' + username + '/videos', {
                name: video.name,
                base64: video.file.base64
            }).then(function () {
                $scope.addingVideo = false;
                Transaction('GET', 'users/' + username + '/videos').then(function (videos) {
                    $rootScope.videos = videos;
                    $rootScope.user.videos = videos;
                });
            });
        };



        $rootScope.$on('addVideo', function () {
            $scope.addingVideo = true;
        });

        $scope.search = function () {
            var q = $scope.q;

            $location.search({
                user: q || ''
            }).path('/');
            $scope.q = undefined;
        };

        $scope.$watch(function () {
            return $location.search().user;
        }, function (newValue, oldValue) {
            currentlyViewedUser = undefined;
            if (newValue === oldValue || $location.path() !== '/') return;
            if (!newValue)
                $rootScope.videos = $rootScope.user.videos;
            else {
                Transaction('GET', 'users/' + newValue + '/videos')
                    .then(function (videos) {
                        $rootScope.videos = videos;
                    }, function (res) {
                        alert('No such user found');
                        if (oldValue)
                            $location.search({
                                user: oldValue
                            });
                        else $location.search({});
                        $scope.videos = [];
                    });
                Transaction('GET', 'users/' + newValue).then(function (user) {
                    currentlyViewedUser = user;
                });
            }
        });

        $scope.$on('$routeChangeStart', function () {
            $scope.newVideo = undefined;
        });
            }])

.controller('WatchCtrl', ['$scope', '$rootScope', '$location', 'Video',
                    function ($scope, $rootScope, $location, Video) {
        $scope.video = Video;
  }]);