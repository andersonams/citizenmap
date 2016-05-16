angular.module('app.services', [])

//Serviço para fornecer a base de dados do Firebase, definida anteriormente:
.service('Root', ['FBURL', Firebase])

//Constroi o objeto Auth para ser usado no controlador de login:
.factory('Auth', function($firebaseAuth, FBURL, $timeout, Utils){
    var ref = new Firebase(FBURL);
    var auth = $firebaseAuth(ref);
    
    return {
        user: {},
        // Login Comum:
        login: function(usuario) {
          return auth.$authWithPassword(
            {email: usuario.email, password: usuario.password}
          );
        }, 
        // Método para login através de alguma rede social:
        loginProvider: function loginProvider(provider) {
          return auth.$authWithOAuthPopup(provider);
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
        // Cadastro:
        cadastro: function(user) {
            return auth.$createUser({email: user.email, password: user.password}).then(function() {
                return Auth.login(user);
            })
            .then(function(data) {
                console.log("Usuário:" + JSON.stringify(data));
                return Auth.createProfile(data.uid, user);
            });
        }
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
});
