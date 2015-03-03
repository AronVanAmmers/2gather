angular.module('2gather', ['ngRoute', 'tgAnimations', 'naif.base64'])

  .constant('TPL_PATH', './templates')

  .run(['$rootScope', 'TPL_PATH', 'Transaction', function($rootScope,   TPL_PATH, Transaction) {
    $rootScope.tpl = function(file) {
      return TPL_PATH + '/' + file + '.html';
    };

    function promptUsername() {
      return prompt('User not found. Please enter a username to create a new user') || promptUsername();
    }
    $rootScope.$broadcast('ntLoadingStart');
    Transaction('GET', 'session').then(function(user) {
      $rootScope.user = user;
      $rootScope.$broadcast('ntLoadingEnd');
      }, function(error) {
        Transaction('POST', 'user',{user_name: promptUsername()}).then(function(res){
          Transaction('GET', 'session').then(function(user){
            $rootScope.user = user;
            $rootScope.$broadcast('ntLoadingEnd');
          });
          $rootScope.user = res;
        });
      });


    $rootScope.$on('$routeChangeStart', function() {
      $rootScope.$broadcast('ntLoadingStart');
    });
  }])

  .directive('ntScrollToTop', ['$window', '$rootScope', function($window, $rootScope) {
    return function() {
      $rootScope.$on('$routeChangeStart', function() {
        $window.scrollTo(0, 0);
      });
    };
  }])

  .directive('ntLoadingIndicator', function() {
    return function(scope) {
      NProgress.configure({ ease: 'ease', speed: 500 });

      scope.$on('ntLoadingStart', function() {
        console.log('loding start');
        NProgress.start();
      });
      scope.$on('ntLoadingEnd', function() {
        NProgress.done();
        console.log('loding end');
      });
    };
  })

  .controller('HomeCtrl', ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {

    var layout;
    $scope.setLayout = function(l) {
      layout = l;
    };

    $scope.isLayout = function(l) {
      return layout == l;
    };

    function hasLocationChanged() {
      return $location.path().indexOf('watch') >= 0;
    };

    $scope.$watchCollection(function() {
      return $location.search();
    }, function(data) {

      //do not reload the results if the location changed to
      //the watch page
      if(hasLocationChanged()) return;

      $scope.setLayout('pictures');

      $rootScope.$broadcast('ntLoadingStart');

      Search(data).then(function(videos) {
        $scope.videos = videos;
        $rootScope.$broadcast('ntLoadingEnd');
      });

    });
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
      Transaction('POST', username + '/video', {
        name: video.name,
        data: video.file.base64
      }).then(function(){
        console.log('video uploaded')
      });
    };

    $scope.search = function() {
      var order, category, q = $scope.q;

      $location.search({
        q : q || '',
        c : category || '',
        o : order || ''
      }).path('/');
    };

    $scope.$on('$routeChangeStart', function() {
      $scope.newVideo = undefined;
    });
  }])

  .controller('WatchCtrl', ['$scope', '$rootScope', '$location',
                    function($scope,   $rootScope,   $location){

  }]);
