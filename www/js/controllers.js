'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})
   
.controller('mapaCtrl', function($scope) {

})
   
.controller('perfilCtrl', function($scope, $ionicModal) {
    $ionicModal.fromTemplateUrl('modalexclusaoperfil.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function () {
        console.log("");
        $scope.modal.show();
    };

    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });

    // Execute action on hide modal
    $scope.$on('modal.hidden', function () {
        // Execute action
    });

    // Execute action on remove modal
    $scope.$on('modal.removed', function () {
        // Execute action
    });
})

.controller('menuCtrl', function($localStorage, $scope) {
    // $scope.email = function(){ return  $localStorage.email; }
    $scope.nome = $localStorage.nome;
    $scope.email = $localStorage.email;
    $scope.gravatar = $localStorage.gravatar;
})
      
.controller("loginCtrl", function(Auth, FBURL, Utils, $firebaseObject, $localStorage, $location, $scope, $state) {
    var rootRef = new Firebase(FBURL);
    
    // Login Comum:
    $scope.login = function(usuario) {
        console.log("Formulário Enviado!");
        if(angular.isDefined(usuario)){
            Utils.show();
            Auth.login(usuario).then(function(authData) {
                console.log("Authenticated successfully with payload:", authData);
                rootRef.child('perfil').orderByChild("id_firebase").equalTo(authData.uid).on("child_added", function(snapshot) {
                    var userkey = snapshot.key();
                    var objUsuario = $firebaseObject(rootRef.child('perfil').child(userkey));

                    objUsuario.$loaded().then(function(data) {
                        // console.log(data === objUsuario);
                        // console.log(objUsuario);
                        $localStorage.userkey = userkey;
                        $localStorage.nome = objUsuario.nome;
                        $localStorage.email = objUsuario.email;
                        $localStorage.gravatar = objUsuario.gravatar;
                        
                        Utils.hide();
                        $state.go('menu.principal');
                      })
                      .catch(function(error) {
                        console.error("Erro:", error);
                      });
              });
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
    
    // Sair:
    $scope.logOut = function() {
        Auth.logout();
        console.log("Usuário deslogado!");
        $location.path("/login");
    }
})

.controller("cadastroCtrl", function(Auth, Utils, $location, $scope) {
    $scope.cadastrar = function (usuario, perfil, endereco, configuracao) {
        if (angular.isDefined(usuario, perfil, endereco, configuracao)) {
            Utils.show();
            Auth.cadastrar(usuario, perfil, endereco, configuracao).then(function() {
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
    
    // Acessar o nó para fazer a inserção, similar à tabela:
    // Iterador, devendo ser usado com o $firebaseArray:
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