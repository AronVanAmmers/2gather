requirejs.config({

    baseUrl: 'js/lib',

    paths: {
      app: '../app'
    }
});

requirejs(['jquery'], function ($) {

  require(["bootstrap.min"], function() {});
  require(["treeview"], function() {});
  require(["enscroll-0.6.1.min"], function(){});
  require(["app/rpc"], function(){});
  require(["app/ponosrpc"], function() {});
  require(["app/ponos_eventhandlers"], function() {});
  require(["app/ponos"], function() {});

});
