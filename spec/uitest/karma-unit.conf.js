module.exports = function(config) {
  config.set({
    files : [
      '../lib/jquery/dist/jquery.js',
      '../lib/angular/angular.js',
      '../lib/angular-route/angular-route.js',
      '../lib/angular-animate/angular-animate.js',
      '../lib/angular-mocks/angular-mocks.js',
      '../scripts/2gather.js',
      '../scripts/tgAnimations.js',
      '../scripts/data.js',
      './uitest/unit/**/*.js'
    ],
    basePath: '../',
    frameworks: ['jasmine'],
    reporters: ['progress'],
    browsers: ['Chrome'],
    autoWatch: false,
    singleRun: true,
    colors: true
  });
};
