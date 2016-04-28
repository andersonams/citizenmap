angular.module('app.routes', [])

  .config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('menu', {
        url: '/menu',
        templateUrl: 'templates/menu.html',
        abstract: false
      })

      .state('menu.citizenMap', {
        url: '/citizenMap',
        views: {
          'side-menu21': {
            templateUrl: 'templates/citizenMap.html',
            controller: 'citizenMapCtrl'
          }
        }
      })

      .state('menu.mapa', {
        url: '/mapa',
        views: {
          'menuview': {
            templateUrl: 'templates/mapa.html',
            // controller: 'mapaCtrl'
          }
        }
      })

      .state('menu.configuracoes', {
        url: '/configuracoes',
        views: {
          'menuview': {
            templateUrl: 'templates/configuracoes.html',
            controller: 'configuracoesCtrl'
          }
        }
      })

      .state('menu.login', {
        url: '/login',
        /*templateUrl: 'templates/menu.html',*/
        views: {
          'side-menu21': {
            templateUrl: 'templates/login.html',
            controller: 'loginCtrl'
          }
        }
      })

      .state('menu.cadastro', {
        url: '/cadastro',
        views: {
          'side-menu21': {
            templateUrl: 'templates/cadastro.html',
            controller: 'cadastroCtrl'
          }
        }
      })

      .state('menu.principal', {
        url: '/principal',
        views: {
          'menuview': {
            templateUrl: 'templates/principal.html',
            /*controller: 'principalCtrl'*/
          }
        }
      })

      .state('menu.avaliacao', {
        url: '/avaliacao',
        views: {
          'menuview': {
            templateUrl: 'templates/avaliacao.html',
            /*controller: 'principalCtrl'*/
          }
        }
      })

    $urlRouterProvider.otherwise('menu/principal')

  });
