// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'firebase', 'ngMessages', 'app.controllers', 'app.routes', 'app.services', 'app.directives'])

.constant('FBURL', 'https://luminous-torch-2885.firebaseio.com/')
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

//Serviço para fornecer a base de dados do Firebase, definida anteriormente:
.service('Root', ['FBURL', Firebase])

//Constroi o objeto Auth para ser usado no controlador de login:
.factory('Auth', function($firebaseAuth, FBURL, $timeout, Utils){
    var ref = new Firebase(FBURL);
    var auth = $firebaseAuth(ref);
    
    return {
        user: {},
        // Método para auxiliar o login com múltiplos fornecedores:
        loginProvider: function loginProvider(provider) {
          return auth.$authWithOAuthPopup(provider);
        },
        // Método para login com o facebook (opcional):
        loginFacebook: function login() {
          return this.loginProvider("facebook");
        },
        // Wrapping unauth:
        logout: function logout() {
          auth.$unauth();
        },
        // Wrap a função $onAuth com $timeout para ser processada no loop:
        onAuth: function onLoggedIn(callback) {
          auth.$onAuth(function(authData) {
            $timeout(function() {
              callback(authData);
            });
          });
        },
        //Login comum:
        loginComum: function(usuario) {
          return auth.$authWithPassword(
            {email: usuario.email, password: usuario.password}
          );
        }, 
    };
})

.factory('Utils', function($ionicLoading,$ionicPopup) {
    
    var Utils = {
        show: function() {
          $ionicLoading.show({
                animation: 'fade-in',
                showBackdrop: false,
                maxWidth: 200,
                showDelay: 500,
                template: '<p class="item-icon-left">Careggando...<ion-spinner icon="lines"/></p>'
          });
        },

        hide: function(){
          $ionicLoading.hide();
        },

        alertshow: function(tit,msg){
                var alertPopup = $ionicPopup.alert({
                        title: tit,
                        template: msg
                });
                alertPopup.then(function(res) {
                        //console.log('Registrado corretamente.');
                });
        },

        errMessage: function(err) {
            var msg = "Erro desconhecido...";

            if(err && err.code) {
              switch (err.code) {
                case "EMAIL_TAKEN":
                  msg = "E-mail já utilizado."; break;
                case "INVALID_EMAIL":
                  msg = "E-mail Inválido"; break;
                case "NETWORK_ERROR":
                  msg = "Erro de rede."; break;
                case "INVALID_PASSWORD":
                  msg = "Senha inválida."; break;
                case "INVALID_USER":
                  msg = "Usuário inválido."; break;
              }
            }

            Utils.alertshow("Erro!",msg);
        },
    };
  
    return Utils;
})