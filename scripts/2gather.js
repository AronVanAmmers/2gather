angular.module('2gather', ['ngRoute', 'tgAnimations', 'naif.base64'])

  .constant('TPL_PATH', './templates')

  .run(['$rootScope', 'TPL_PATH', 'Transaction', function($rootScope,   TPL_PATH, Transaction) {
    $rootScope.tpl = function(file) {
      return TPL_PATH + '/' + file + '.html';
    };

    function promptUsername() {
      return prompt('User not found. Please enter a username to create a new user') || promptUsername();
    }
    $rootScope.$broadcast('tgLoadingStart');
    Transaction('GET', 'session').then(function(user) {
      $rootScope.user = user;
      $rootScope.$broadcast('tgLoadingEnd');
      }, function(error) {
        Transaction('POST', 'user',{user_name: promptUsername()}).then(function(res){
          Transaction('GET', 'session').then(function(user){
            $rootScope.user = user;
            $rootScope.$broadcast('tgLoadingEnd');
          });
          $rootScope.user = res;
        });
      });


    $rootScope.$on('$routeChangeStart', function() {
      $rootScope.$broadcast('tgLoadingStart');
    });
  }])

  .directive('ntScrollToTop', ['$window', '$rootScope', function($window, $rootScope) {
    return function() {
      $rootScope.$on('$routeChangeStart', function() {
        $window.scrollTo(0, 0);
      });
    };
  }])

  .directive('tgLoadingIndicator', function() {
    return function(scope) {
      NProgress.configure({ ease: 'ease', speed: 500 });
      NProgress.start();
      scope.$on('tgLoadingStart', function() {
        console.log('loading start');
        NProgress.start();
      });
      scope.$on('tgLoadingEnd', function() {
        NProgress.done();
        console.log('loading end');
      });
    };
  })

  .controller('HomeCtrl', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {

  }])

  .filter('limit', function() {
    return function(results, limit) {
      return results && results.slice(0, limit);
    };
  })

  .controller('HeaderCtrl', ['$scope', '$location', 'Transaction',
                         function($scope,   $location, Transaction) {

    $scope.uploadVideo = function(video){
      var username = $scope.user.user_name;
      Transaction('POST', 'user/' + username + '/videos', {
        name: video.name,
        base64: video.file.base64
      }).then(function(){
        console.log('video uploaded')
      });
    };

    $scope.search = function() {
      var q = $scope.q;

      $location.search({
        user : q || ''
      }).path('/');
    };

    $scope.$on('$routeChangeStart', function() {
      $scope.newVideo = undefined;
    });
  }])

  .controller('WatchCtrl', ['$scope', '$rootScope', '$location',
                    function($scope,   $rootScope,   $location){

  }]);
