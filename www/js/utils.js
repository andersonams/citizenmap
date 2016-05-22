angular.module('citizenmap.utils', [])

.factory('Utils', function($ionicLoading, $ionicPopup) {
    
    var Utils = {
        show: function() {
          $ionicLoading.show({
            animation: 'fade-in',
            showBackdrop: false,
            maxWidth: 200,
            showDelay: 500,
            template: '<ion-spinner icon="android"></ion-spinner>'
          });
        },

        hide: function(){
          $ionicLoading.hide();
        },

        alertshow: function(tit, msg){
            var alertPopup = $ionicPopup.alert({
                title: tit,
                template: msg
            });
            alertPopup.then(function(res) {
                //console.log('Registrado corretamente.');
            });
        },

        errMessage: function(err) {
            var msg = "Erro desconhecido! Favor reportá-lo à equipe!";

            if(err && err.code) {
              switch (err.code) {
                case "EMAIL_TAKEN":
                  msg = "Endereço de e-mail já utilizado!"; break;
                case "INVALID_EMAIL":
                  msg = "Endereço de e-mail ou senha inválidos!"; break;
                case "INVALID_PASSWORD":
                  msg = "Endereço de e-mail ou senha inválidos!"; break;
                case "INVALID_USER":
                  msg = "Usuário inválido."; break;
                case "NETWORK_ERROR":
                  msg = "Erro de rede."; break;
              }
            }
            Utils.alertshow("Erro!",msg);
        },
    };
    
    return Utils;
});
