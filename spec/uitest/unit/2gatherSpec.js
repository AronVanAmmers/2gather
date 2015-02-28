describe('2gather', function() {

  beforeEach(module('2gather'));

  describe('tgAnimations', function() {
    it('2gather should depend on the tgAnimations app', function() {
      var m = angular.module('2gather');
      expect(m.value('appName').requires).toContain('tgAnimations');
    });

    it('should depend on ngAnimate', function() {
      var m = angular.module('tgAnimations');
      expect(m.value('appName').requires).toContain('ngAnimate');
    });
  });

  describe('.tg-fade animation', function() {
    it('should inject and use the tgAnimator service', function() {
      var injectSpy = jasmine.createSpy();
      module(function($provide) {
        $provide.factory('tgAnimator', function() {
          injectSpy();
          return { fadeIn : angular.noop, fadeOut : angular.noop }; 
        });
      });
      inject(function($compile, $rootScope, $animate, $rootElement) {
        $rootScope.$apply();

        var scope = $rootScope.$new();
        var element = $compile('<div class="tg-fade"></div>')(scope);
        $animate.enter(element, $rootElement);
        scope.$apply();

        expect(injectSpy).toHaveBeenCalled();
      });
    });

    it('should call tgAnimator.fadeIn on enter', function() {
      var enterSpy = jasmine.createSpy();
      module(function($provide) {
        $provide.value('tgAnimator', {
          fadeIn : enterSpy 
        });
      });
      inject(function($compile, $rootScope, $animate, $rootElement) {
        $rootScope.$apply();

        var scope = $rootScope.$new();
        var element = $compile('<div class="tg-fade"></div>')(scope);

        expect(enterSpy).not.toHaveBeenCalled();
        $animate.enter(element, $rootElement);
        scope.$apply();
        expect(enterSpy).toHaveBeenCalled();
      });
    });

    it('should call tgAnimator.fadeOut on leave', function() {
      var leaveSpy = jasmine.createSpy();
      module(function($provide) {
        $provide.value('tgAnimator', {
          fadeOut : leaveSpy 
        });
      });
      inject(function($compile, $rootScope, $animate, $rootElement) {
        $rootScope.$apply();

        var scope = $rootScope.$new();
        var element = $compile('<div class="tg-fade"></div>')(scope);
        $rootElement.append(element);

        expect(leaveSpy).not.toHaveBeenCalled();
        $animate.leave(element);
        scope.$apply();
        expect(leaveSpy).toHaveBeenCalled();
      });
    });
  });

  describe('tgAnimator service', function() {
    it('should call element.fadeOut on fadeOut and provide a done function',
      inject(function(tgAnimator) {

      var doneFn = function() {};
      var animationSpy = jasmine.createSpy();
      var element = angular.element('<div></div>');

      element.fadeOut = animationSpy;
      tgAnimator.fadeOut(element, doneFn);

      expect(animationSpy).toHaveBeenCalledWith(doneFn);
    }));

    it('should call element.fadeIn on fadeIn and provide a done function',
      inject(function(tgAnimator) {

      var doneFn = function() {};
      var animationSpy = jasmine.createSpy();
      var element = angular.element('<div></div>');

      element.fadeIn = animationSpy;
      tgAnimator.fadeIn(element, doneFn);

      expect(animationSpy).toHaveBeenCalledWith(doneFn);
    }));
  });
});
