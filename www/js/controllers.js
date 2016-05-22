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
    
    // Login Comum:
    $scope.login = function(usuario) {
        console.log("Formulário Enviado!");
        if(angular.isDefined(usuario)){
            Utils.show();
            Auth.login(usuario).then(function(authData) {
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
    
    // Método para login através de alguma rede social:
    $scope.loginProvider = function(provider) {
      Auth.loginProvider(provider).then(function(authData){
        console.log('Usuário Logado!', authData);
        $state.go('menu.principal');
      })
      .catch(function(error) {
        if (error.code === "TRANSPORT_UNAVAILABLE") {
            Auth.$authWithOAuthPopup(provider).then(function(authData) {
            console.log('Usuário Logado!', authData);
            $state.go('menu.principal');
            });
        } 
        else {
        console.log(error);
        }
      });
    };
    
    // Deslogar:
    $scope.logOut = function() {
        Auth.logout();
        console.log("Usuário deslogado!");
        $location.path("/login");
    }
    
    // Mudança no estado de login, quando um outro usuário logar, carregar em $escope:
    Auth.onAuth(function(authData) {
      $scope.user = authData;
    });
})

.controller("cadastroCtrl", function($scope, Auth, Utils, $location, $state) {
    $scope.cadastrar = function (usuario) {
        if (angular.isDefined(usuario)) {
            Utils.show();
            Auth.cadastrar(usuario).then(function() {
                Utils.hide();
                Utils.alertshow("Sucesso", "Seu usuário foi criado com sucesso!");
                $location.path('/');
            }, 
            function(err) {
                Utils.hide();
                Utils.errMessage(err);
            });
        }
    };
})
   
.controller('principalCtrl', function($scope) {

});