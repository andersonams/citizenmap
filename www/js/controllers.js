angular.module('citizenmap.controllers', [])
  
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

.controller("cadastroCtrl", function(Auth, Utils, $location, $scope, $state) {
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

})

.controller('firebaseCtrl', function(FBURL, $firebaseArray, $scope) {
    var firebaseRef = new Firebase(FBURL);
    
    //Iterador, devendo ser usado com o $firebaseArray:
    $scope.avlsIterator = $firebaseArray(firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Beira Mar'));
    
    // Metódos dos Objetos de Query do Firebase:
    // on() Fica escutando qualquer alteração daquele nó, chamando a si mesmo toda vez que o nó é alterado.
    // once() Lê o nó somente no momento da excução da função.
    
    // Para cada um dos métodos acima, são passados Tipos de Eventos:
    // child_added
    // child_changed
    // child_removed
    // child_moved
    // value
    
    $scope.forEach = function () {
        // Pesquisando todas as avaliações:
        $scope.avls = firebaseRef.child('avaliacoes');
        $scope.avls.once("value", function (avls) {
            avls.forEach(function (servicos) {        
                servicos.forEach(function (cidades) {
                    cidades.forEach(function (bairros) {
                        bairros.forEach(function (avl) {  
                        // Usando o hasChildren() para mostrar somente as avaliações, pois neste nó, bairros, há atributos que não são chaves contendo as avaliações:
                        if (avl.hasChildren()){
                            console.log(avl.key());
                        }
                        });
                    });
                });
            });
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }
    
    $scope.forEachPersonalizado = function () {
        $scope.avls = firebaseRef.child('avaliacoes');
        $scope.avls.once("value", function (avls) {
            avls.forEach(function (servicos) {
                // Pesquisando uma cidade Especifica:
                if (servicos.hasChild("Duque de Caxias")){
                    var duqueDeCaxias = servicos.child("Duque de Caxias");
                    console.log(duqueDeCaxias.val());
                }
                servicos.forEach(function (cidades) {
                    cidades.forEach(function (bairros) {
                        bairros.forEach(function (avl) {
                            // Pesquisando um perfil específico:
                            if(avl.val().perfil == 'Anderson'){
                                console.log(avl.key());
                                // console.log(avl.val());
                                // console.log(avl.numChildren());
                            }
                        });
                    });
                });
            });
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }
    
    $scope.child_added = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Beira Mar');
        $scope.avls.on("child_added", function (snapshot) {
            console.log(snapshot.val());
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }
    
    $scope.value = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Beira Mar');
        $scope.avls.on("value", function (snapshot) {
            console.log(snapshot.val());
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    }
    
    $scope.range = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Parque Beira Mar');
        $scope.avls.orderByChild("perfil").startAt('Anderson').endAt('Anderson').on("child_added", function (snapshot) {
            console.log(snapshot.key())
            console.log(snapshot.val())
        });
    }
    
    // Formulário:
    $scope.form = function (avl) {
        if (avl.tipo == 'child_added') {
            $scope.avls = firebaseRef.child('avl').child(avl.servico).child(avl.tipoLocal).child(avl.local);
            $scope.avls.on("child_added", function (snapshot) {
                console.log(snapshot.val());
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }

        if (avl.tipo == 'value') {
            $scope.avls = firebaseRef.child('avl').child(avl.servico).child(avl.tipoLocal).child(avl.local);
            $scope.avls.on("value", function (snapshot) {
                console.log(snapshot.val());
            }, function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
        }

        if (avl.tipo == 'range') {
            $scope.avls = firebaseRef.child('avl').child(avl.servico).child(avl.tipoLocal).child(avl.local);
             $scope.avls.orderByChild("perfil").startAt('Anderson').endAt('Anderson').on("child_added", function (snapshot) {
                console.log(snapshot.key())
                console.log(snapshot.val())
            });
        }
    }
});