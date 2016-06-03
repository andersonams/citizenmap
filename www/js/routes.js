angular.module('citizenmap.routes', [])

.config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('menu', {
        url: '/menu',
        templateUrl: 'templates/menu.html',
        controller: 'menuCtrl',
        abstract: false
      })
      
      .state('entrada', {
        url: '/entrada',
        templateUrl: 'templates/entrada.html'
      })
      
      .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      })
      
      .state('cadastro', {
        url: '/cadastro',
        templateUrl: 'templates/cadastro.html',
        controller: 'cadastroCtrl'
      })
      
      .state('firebase', {
        url: '/firebase',
        templateUrl: 'templates/firebase.html',
        controller: 'firebaseCtrl'
      })

      .state('menu.mapa', {
        url: '/mapa',
        views: {
          'menuview': {
            templateUrl: 'templates/mapa.html'
          }
        }
      })

      .state('menu.perfil', {
        url: '/perfil',
        views: {
          'menuview': {
            templateUrl: 'templates/perfil.html',
            controller: 'perfilCtrl'
          }
        }
      })

      .state('menu.principal', {
        url: '/principal',
        views: {
          'menuview': {
            templateUrl: 'templates/principal.html',
            controller: 'principalCtrl'
          }
        }
      })

      .state('menu.avaliacao', {
        url: '/avaliacao',
        views: {
          'menuview': {
            templateUrl: 'templates/avaliacao.html',
            controller: 'avaliacaoCtrl'
          }
        }
      })

    $urlRouterProvider.otherwise('entrada')

  });