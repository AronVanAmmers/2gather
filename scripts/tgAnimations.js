angular.module('tgAnimations', ['ngAnimate'])

  .factory('tgAnimator', function() {
    return {
      fadeOut : function(element, done) {
        element.fadeOut(done);
      },
      fadeIn : function(element, done) {
        element.fadeIn(done);
      }
    };
  })

  //[M7.4] inject the tgAnimator service
  .animation('.tg-fade', function(tgAnimator) {
    return {
      enter : function(element, done) {
        tgAnimator.fadeIn(element, done);
      },
      leave : function(element, done) {
        tgAnimator.fadeOut(element, done);
      }
    }
  })

  .animation('.tg-expand', ['$route', function($route) {
    var formerRoute;
    return {
      enter : function(element, done) {
        var expectedHeight = element.height();
        element.css('left', -50);
        element.css('opacity', 0);
        element.animate({
          'left': 0,
          'opacity': 1
        }, done);
      },
      leave : function(element, done) {
        var expectedHeight = element.height();
        element.animate({
          'left': -50,
          'opacity':0
        }, done);
      }
    }
  }])
