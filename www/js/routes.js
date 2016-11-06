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
    
    .state('recuperar', {
        url: '/recuperar',
        templateUrl: 'templates/recuperar.html',
        controller: 'loginCtrl'
    })

    .state('cadastrar', {
        url: '/cadastrar',
        templateUrl: 'templates/cadastrar.html',
        controller: 'cadastroCtrl'
    })

    .state('firebase', {
        url: '/firebase',
        templateUrl: 'templates/firebase.html',
        controller: 'firebaseCtrl'
    })

    .state('menu.perfil', {
        url: '/perfil',
        abstract: true,
        views: {
            'menuview': {
                template: '<ui-view/>',
            }
        }
    })

    .state('menu.perfil.editar', {
        url: '/editar',
        views: {
            'menuview@menu': {
                templateUrl: 'templates/perfil/editar.html',
                controller: 'perfilCtrl'
            }
        }
    })
    
    .state('menu.avaliacao', {
        url: '/avaliacao',
        views: {
            'menuview': {
                templateUrl: 'templates/avaliacao/index.html',
                controller: 'principalCtrl'
            }
        }
    })

    .state('menu.avaliacao.avaliar', {
        url: '/avaliar',
        views: {
            'menuview@menu': {
                templateUrl: "templates/avaliacao/avaliar.html",
                controller: 'avaliacaoCtrl'
            }
        }
    })

    .state('menu.avaliacao.finalizar', {
        url: '/finalizar',
        views: {
            'menuview@menu': {
                templateUrl: "templates/avaliacao/finalizar.html",
                controller: 'conclusaoCtrl'
            }
        }
    })

    .state('menu.mapa', {
        url: '/mapa',
        views: {
            'menuview': {
                templateUrl: 'templates/mapa/index.html',
                controller: 'mapasCtrl'
            }
        }
    })
    
    .state('menu.mapa.media', {
        url: '/media',
        views: {
            'menuview@menu': {
                templateUrl: 'templates/mapa/media.html',
                controller: 'mapasCtrl'
            }
        }
    })

    .state('menu.mapa.visualizar', {
        url: '/visualizar',
        views: {
            'menuview@menu': {
                templateUrl: 'templates/mapa/visualizar.html',
                controller: 'mapaCtrl'
            }
        }
    })

    .state('menu.servico', {
        url: '/servico',
        views: {
            'menuview': {
                templateUrl: 'templates/servico/index.html',
                controller: 'servicoIndexCtrl'
            }
        }
    })

    .state('menu.servico.cadastrar', {
        url: '/cadastrar',
        parent: 'menu.servico',
        views: {
            'menuview@menu': {
                templateUrl: "templates/servico/cadastrar.html",
                controller: 'servicoCtrl'
            }
        }
    })
    
    .state('menu.servico.editar', {
        url: '/editar',
        parent: 'menu.servico',
        views: {
            'menuview@menu': {
                templateUrl: "templates/servico/editar.html",
                controller: 'servicoCtrl'
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