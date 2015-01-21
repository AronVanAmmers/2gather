var BASE_TEN = 10;

angular.module('data', [])

.constant('VIDEO_URL', 'https://gdata.youtube.com/feeds/api/videos/{ID}?v=2&alt=json&callback=JSON_CALLBACK')
    .constant('VIDEO_COMMENTS_URL', 'https://gdata.youtube.com/feeds/api/videos/{ID}/comments?v=2&alt=json&callback=JSON_CALLBACK')
    .constant('SEARCH_URL', 'https://gdata.youtube.com/feeds/api/videos/?v=2&alt=json&callback=JSON_CALLBACK')
    .constant('RELATED_URL', 'https://gdata.youtube.com/feeds/api/videos/{ID}/related?v=2&alt=json&callback=JSON_CALLBACK')

.constant('POPULAR_URL', 'https://gdata.youtube.com/feeds/api/standardfeeds/{FEED}?alt=json&callback=JSON_CALLBACK')
    .constant('EMBED_URL', 'http://www.youtube.com/embed/{ID}?autoplay=1')
    .constant('POSTER_URL', 'https://i1.ytimg.com/vi/{ID}/hqdefault.jpg')

.config(['$sceDelegateProvider',
    function ($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://www.youtube.com/**']);
  }])

.factory('Feed', ['Videos', 'POPULAR_URL',
    function (Videos, POPULAR_URL) {
        return function (feed) {
            var url = POPULAR_URL.replace('{FEED}', feed);
            return Videos(url);
        };
  }])

.value('SearchParams', function (baseUrl, params) {
    var attrs = '';
    angular.forEach(params, function (value, key) {
        if (!value || value.length === 0) {
            return;
        }
        var attr;
        switch (key) {
        case 'q':
            attr = 'q';
            break;

        case 'c':
            attr = 'category';
            break;

        case 'o':
            attr = 'orderby';
            break;

        default:
            return;
        }
        attrs += (baseUrl.indexOf('?') === -1 ? '?' : '&') + attr + '=' + value;
    });
    return baseUrl + attrs;
})

.factory('Search', ['Videos', 'SearchParams', 'SEARCH_URL',
                function (Videos, SearchParams, SEARCH_URL) {
        return function (data) {
            data = typeof data === 'string' ? {
                q: data
            } :
                data;

            var url = SearchParams(SEARCH_URL, data);
            return Videos(url);
        };
  }])

.factory('RelatedVideos', ['Videos', 'RELATED_URL',
                       function (Videos, RELATED_URL) {
        return function (videoID) {
            return Videos(RELATED_URL.replace('{ID}', videoID));
        };
  }])

.factory('Videos', ['$q', '$http', 'VideoPrepare',
                function ($q, $http, VideoPrepare) {
        return function (url) {
            var defer = $q.defer();
            $http.jsonp(url)
                .success(function (response) {
                    var results = [];
                    angular.forEach(response.feed.entry, function (entry) {
                        results.push(VideoPrepare(entry));
                    });
                    defer.resolve(results);
                })
                .error(function () {
                    return 'failure';
                });
            return defer.promise;
        };
  }])

.factory('Video', ['$q', '$http', 'VideoPrepare', 'VIDEO_URL',
               function ($q, $http, VideoPrepare, VIDEO_URL) {

        return function (id) {
            var defer = $q.defer();
            var url = VIDEO_URL.replace('{ID}', id);
            $http.jsonp(url)
                .success(function (response) {
                    defer.resolve(VideoPrepare(response.entry));
                })
                .error(function () {
                    return 'failure';
                });
            return defer.promise;
        };
  }])

.factory('VideoPrepare', ['CreateEmbedURL',
                      function (CreateEmbedURL) {
        return function (entry) {
            var $media = entry.media$group;
            var id = $media.yt$videoid.$t;
            var thumbnails = [];

            var hqVideo;
            angular.forEach($media.media$thumbnail || [], function (thumb) {
                var image = {
                    width: thumb.width,
                    height: thumb.height,
                    url: thumb.url,
                    name: thumb.$name
                };
                if (image.name === 'hqdefault') {
                    hqVideo = hqVideo || image;
                }
                thumbnails.push(image);
            });

            return {
                id: id,
                image: hqVideo || thumbnails[0],
                thumbnails: thumbnails,
                title: entry.title.$t,
                description: $media.media$description.$t,
                rating: entry.gd$rating ? parseInt(entry.gd$rating.average, BASE_TEN) : 0,
                keywords: $media.media$keywords || '',
                embedUrl: CreateEmbedURL(id)
            };
        };
  }])

.factory('VideoComments', ['$http', '$q', 'VIDEO_COMMENTS_URL',
                       function ($http, $q, VIDEO_COMMENTS_URL) {
        return function (id) {
            var url = VIDEO_COMMENTS_URL.replace('{ID}', id);
            var defer = $q.defer();
            $http.jsonp(url)
                .success(function (response) {
                    var comments = [];
                    angular.forEach(response.feed.entry, function (comment) {
                        comments.push({
                            author: comment.author[0].name.$t,
                            content: comment.content.$t
                        });
                    });
                    defer.resolve(comments);
                })
                .error(function () {
                    defer.reject();
                });
            return defer.promise;
        };
  }])

.factory('CreateEmbedURL', ['EMBED_URL',
                        function (EMBED_URL) {
        return function (id) {
            return EMBED_URL.replace('{ID}', id);
        };
  }])

.factory('CreatePosterUrl', ['POSTER_URL',
                         function (POSTER_URL) {
        return function (id) {
            return POSTER_URL.replace('{ID}', id);
        };
  }])

.directive('videoPlayer', ['CreateEmbedURL', 'CreatePosterUrl',
                       function (CreateEmbedURL, CreatePosterUrl) {
        return {
            controller: ['$scope',
                function ($scope) {
                    $scope.video_src = CreateEmbedURL($scope.video_id);
                    $scope.video_poster = CreatePosterUrl($scope.video_id);
      }],
            scope: {
                video_id: '@videoPlayer'
            },
            template: '<div class="player-container">' +
                '  <div ng-if="active">' +
                '    <iframe ng-src="{{ video_src }}" class="video-player"></iframe>' +
                '  </div>' +
                '  <div ng-click="active=true" ng-hide="active" class="video-poster">' +
                '    <img ng-src="{{ video_poster }}" />' +
                '    <span class="video-play-button fa fa-play"></span>' +
                '  </div>' +
                '</div>',
            replace: true
        };
  }]);