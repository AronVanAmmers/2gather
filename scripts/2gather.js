angular.module('2gather', ['data', 'ngRoute', 'tgAnimations'])

  .constant('TPL_PATH', './templates')

  .run(['$rootScope', 'TPL_PATH', 'Transaction', function($rootScope,   TPL_PATH, Transaction) {
    $rootScope.tpl = function(file) {
      return TPL_PATH + '/' + file + '.html';
    };

    function promptUsername() {
      return prompt('User not found. Please enter a username to create a new user') || promptUsername();
    }

    Transaction('GET', 'session').then(function(user){
        $rootScope.user = user;
      }, function(error){
        Transaction('POST', 'user',{user_name: promptUsername()}).then(function(res){
          $rootScope.user = res;
        });
    });


    $rootScope.$on('$routeChangeStart', function() {
      $rootScope.$broadcast('ntLoadingStart');
    });
  }])


  .factory('getSet', function() {
    return function() {
      var val;
      return function(data) {
        return arguments.length ? (val = data) : val;
      };
    };
  })

  .value('appCategories', [
    'decerver','thelonius', 'web development',
    'blockchains', 'ethereum'
  ])

  .config(function($routeProvider, TPL_PATH) {
    $routeProvider.when('/',{
      controller : 'HomeCtrl',
      templateUrl : TPL_PATH + '/home.html',
      reloadOnSearch : false
    }).when('/watch/:id',{
      controller : 'WatchCtrl',
      templateUrl : TPL_PATH + '/watch.html',
      resolve: {
        VideoInstance: ['Video', '$location', function(Video, $location) {
          //match the ID with a regex instead of using route params
          //since the route has not fully changed yet
          var id = $location.path().match(/watch\/([^ \/]+)(\/|$)/)[1];
          return Video(id);
        }]
      }
    });
  })

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
        NProgress.start();
      });
      scope.$on('ntLoadingEnd', function() {
        NProgress.done();
      });
    };
  })

  .factory('currentVideo', ['getSet', function(getSet) {
    return getSet();
  }])

  .controller('HomeCtrl', ['$scope', '$rootScope', '$location', 'Search', 'Feed', 'TPL_PATH',
                   function($scope,   $rootScope,   $location,   Search,   Feed,   TPL_PATH) {

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

      var c = data.c;
      if(c && c.length > 0) {
        $scope.searchTerm = c;
        $scope.searchMethod = 'category';
      } else {
        data.q = data.q || 'Eris Industries';
        $scope.searchMethod = 'query';
        $scope.searchTerm = data.q;
      }

      $rootScope.$broadcast('ntLoadingStart');

      Search(data).then(function(videos) {
        $scope.videos = videos;
        $rootScope.$broadcast('ntLoadingEnd');
      });

      Feed('most_popular').then(function(videos) {
        $scope.popularVideos = videos;
      });
    });
  }])

  .filter('limit', function() {
    return function(results, limit) {
      return results && results.slice(0, limit);
    };
  })

  .controller('CategoryListCtrl', ['$scope', 'appCategories',
                           function($scope,   appCategories) {
    $scope.categories = appCategories;
  }])

  .controller('SearchFormCtrl', ['$scope', '$location',
                         function($scope,   $location) {

    $scope.search = function() {
      var order, category, q = $scope.q;
      if($scope.advanced) {
        order = $scope.advanced.orderby;
        category = $scope.advanced.category;
      }

      $scope.advanced = false;

      $location.search({
        q : q || '',
        c : category || '',
        o : order || ''
      }).path('/');
    };

    $scope.$on('$routeChangeStart', function() {
      $scope.advanced = false;
    });

    $scope.orderingOptions = [
      'relevance',
      'published',
      'viewCount',
      'rating',
      'position',
      'commentCount',
      'published',
      'reversedPosition',
      'title',
      'viewCount'
    ];
  }])

  .controller('WatchCtrl', ['$scope', '$rootScope', '$location',  'VideoInstance', 'VideoComments', 'TPL_PATH', 'currentVideo', 'Search', 'RelatedVideos',
                    function($scope,   $rootScope,   $location,    VideoInstance,   VideoComments,   TPL_PATH,   currentVideo,   Search,   RelatedVideos) {

    var videoID = VideoInstance.id;
    $scope.video_id = videoID;
    $scope.video = VideoInstance;

    VideoComments(VideoInstance.id).then(function(comments) {
      $scope.video_comments = comments;
    });

    currentVideo(VideoInstance);

    RelatedVideos(videoID).then(function(videos) {
      $scope.relatedVideos = videos;
      $rootScope.$broadcast('ntLoadingEnd');
    });

    $scope.$on('$destroy', function() {
      currentVideo(null);
    });
  }])

  .controller('VideoPanelCtrl', ['$scope', 'currentVideo',
                         function($scope,   currentVideo) {

    $scope.video = currentVideo();
  }]);
