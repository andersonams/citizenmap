angular.module('citizenmap.routes', [])

.config(function ($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      .state('menu', {
        url: '/menu',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'menuCtrl'
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
      
      .state('menu.mapas', {
        url: '/mapas',
        views: {
          'menuview': {
            templateUrl: 'templates/mapas.html',
            controller: 'mapasCtrl'
          }
        }
      })

      .state('menu.mapa', {
        url: '/mapa',
        views: {
          'menuview': {
            templateUrl: 'templates/mapa.html',
            controller: 'mapaCtrl'
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
      
      .state('menu.conclusao', {
        url: '/conclusao',
        views: {
          'menuview': {
            templateUrl: 'templates/conclusao.html',
            controller: 'conclusaoCtrl'
          }
        }
      })
      
      .state('menu.servicos', {
        url: '/servicos',
        views: {
          'menuview': {
            templateUrl: 'templates/servicos/index.html',
          }
        }
      })
           
      .state('menu.ajuda', {
        url: '/ajuda',
        views: {
          'menuview': {
            templateUrl: 'templates/ajuda.html'
          }
        }
      })

    $urlRouterProvider.otherwise('entrada')
  });