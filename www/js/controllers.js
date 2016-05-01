angular.module('app.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})
   
.controller('mapaCtrl', function($scope) {

})
   
.controller('configuracoesCtrl', function($scope) {

})
      
.controller("loginCtrl", function($scope, Auth, FBURL, Utils, $location, $state) {
    var ref = new Firebase(FBURL);
    var userkey = "";
    
    // Iniciar com um objeto de usuário nulo:
    $scope.user = null;
    
    // Chama $authWithOAuthPopup da $firebaseAuth;
    // Processado pelo InAppBrowser plugin na emulação;
    // Pode-se adiocionar o usuário em $scope aqui ou em $onAuth;
    $scope.loginFacebook = function scopeLogin(provider) {
      Auth.loginFacebook(provider).then(function(authData){
        console.log('Usuário Logado!', authData);
      })
      .catch(function(error) {
        if (error.code === "TRANSPORT_UNAVAILABLE") {
            Auth.$authWithOAuthPopup(provider).then(function(authData) {
            console.log('Usuário Logado!', authData);
            });
        } 
        else {
        console.log(error);
        }
      });
    };
    
    $scope.loginComum = function (usuario) {
        console.log("Formulário enviado!");
        if(angular.isDefined(usuario)){
            Utils.show();
            Auth.loginComum(usuario).then(function(authData) {
               console.log("ID do Usuário:" + JSON.stringify(authData));
               Utils.hide();
               $state.go('menu.principal');
//                ref.child('profile').orderByChild("id").equalTo(authData.uid).on("child_added", function(snapshot) {
//                    console.log(snapshot.key());
//                    userkey = snapshot.key();
//                    var obj = $firebaseObject(ref.child('profile').child(userkey));
//
//                    obj.$loaded().then(function(data) {
//                        //console.log(data === obj);
//                        //console.log(obj.email);
//                        $localStorage.email = obj.email;
//                        $localStorage.userkey = userkey;
//                        Utils.hide();
//                        //$state.go('home');
//                        //console.log("Starter page","Home");
//
//                      })
//                      .catch(function(error) {
//                        console.error("Error:", error);
//                      });
//              });

            }, 
            function(err) {
              Utils.hide();
              Utils.errMessage(err);
            });
        }
    };
    
    //Deslogar:
    $scope.logOut = function () {
        Auth.logout();
        console.log("Usuário deslogado!");
        $location.path("/login");
    }
    
    // Mudança no estado de login, quando um outro usuário logar, carregar em $escope:
    Auth.onAuth(function(authData) {
      $scope.user = authData;
    });
})

.controller('cadastroCtrl', function($scope) {

})
   
.controller('principalCtrl', function($scope) {

})
