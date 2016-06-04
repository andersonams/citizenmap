'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})

.controller('mapaCtrl', function($ionicLoading, $scope, $state, $cordovaGeolocation) {
    var options = {timeout: 10000, enableHighAccuracy: true};
    $scope.map = new google.maps.Map(document.getElementById('map'), {center: {lat: -34.397, lng: 150.644}, zoom: 15, mapTypeId: google.maps.MapTypeId.ROADMAP});
    $scope.infoWindow = new google.maps.InfoWindow({map: $scope.map});

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            console.log("Geolozalização por HTML5: " + latLng.toString());
            
            $scope.infoWindow .setPosition(latLng);
            $scope.infoWindow .setContent('Localização encontrada.');
            $scope.map.setCenter(latLng);
        }, function () {
            handleLocationError(true, $scope.infoWindow , $scope.map.getCenter());
        });
    } else {
        $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            console.log("Geolozalização por Cordova Geolocation: " + latLng.toString());
            
            $scope.infoWindow .setPosition(latLng);
            $scope.infoWindow .setContent('Localização encontrada.');
            $scope.map.setCenter(latLng);
        }, function (error) {
            console.log("Não foi possível obter a localização." + error.message);
        });
    }
    
    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ? 'Erro: O serviço de geolocalização falhou.' : 'Erro: Seu navegador não suporta geolozalização.');
    }
    
    $scope.ondeEstou = function () {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });
        
        navigator.geolocation.getCurrentPosition(function (position) {
            $scope.map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
            $ionicLoading.hide();
        }, function (error) {
            alert('Unable to get location: ' + error.message);
        });
    };
})
   
.controller('perfilCtrl', function(FBURL, Utils, $ionicModal, $localStorage, $scope) {
   $scope.$on('$ionicView.beforeEnter', function(){
        var rootRef = new Firebase(FBURL);
        var chaveUsuario = $localStorage.chaveUsuario;
        var chaveEndereco = $localStorage.chaveEndereco;
        var chaveConfiguracao = $localStorage.chaveConfiguracao;
       
        $scope.perfil = {};
        $scope.usuario = {};
        $scope.endereco = {};
        $scope.configuracao = {};

        rootRef.child('perfis').child(chaveUsuario).on("value", function(snapshot) {
            $scope.perfil.nome = snapshot.val().nome;
            $scope.perfil.sobrenome = snapshot.val().sobrenome;
            $scope.usuario.email = snapshot.val().email;       
        });
                     
        rootRef.child('enderecos').child(chaveEndereco).on("value", function(snapshot) {
            $scope.endereco.bairro = snapshot.val().bairro;
            $scope.endereco.cidade = snapshot.val().cidade;
        });

        rootRef.child('configuracoes').child(chaveConfiguracao).on("value", function(snapshot) {
            $scope.configuracao.email = snapshot.val().email;
        });
    });
    
    $scope.salvar = function (usuario, perfil, endereco, configuracao) {
        Utils.show();
        var rootRef = new Firebase(FBURL);
        var chaveUsuario = $localStorage.chaveUsuario;
        var chaveEndereco = $localStorage.chaveEndereco;
        var chaveConfiguracao = $localStorage.chaveConfiguracao;
        
        if (angular.isDefined(perfil)) {    
            console.log(chaveUsuario);
            var perfilRef = rootRef.child('perfis').child(chaveUsuario);
            perfilRef.update({nome: perfil.nome, sobrenome: perfil.sobrenome});
        }
        if (angular.isDefined(endereco)) {
            console.log(chaveEndereco);
            var enderecoRef = rootRef.child('enderecos').child(chaveEndereco);
            enderecoRef.update({bairro: endereco.bairro, cidade: endereco.cidade});
        }
        if (angular.isDefined(configuracao)) {
            console.log(chaveConfiguracao);
            var configuracaoRef = rootRef.child('configuracoes').child(chaveConfiguracao);
            configuracaoRef.update({email: configuracao.email});
        }
        
        Utils.hide();
        Utils.alertshow("Sucesso", "Seu perfil foi alterado com sucesso!"); 
    };
    
    $ionicModal.fromTemplateUrl('modalexclusaoperfil.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function () {
        $scope.modal.show();
    };

    $scope.closeModal = function () {
        $scope.modal.hide();
    };

    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });

    // Execute action on hide modal:
    $scope.$on('modal.hidden', function () {
    });

    // Execute action on remove modal:
    $scope.$on('modal.removed', function () {
    });
})

.controller('menuCtrl', function(Auth, $localStorage, $location, $scope) {
    // $scope.email = function(){ return  $localStorage.email; }
    $scope.$on('$ionicView.beforeEnter', function(){
        $scope.nome = $localStorage.nome;
        $scope.email = $localStorage.email;
        $scope.gravatar = $localStorage.gravatar;
    });
    
    // Sair:
    $scope.sair = function() {
        Auth.logout();
        console.log("Usuário deslogado!");
        $location.path("/login");
    }
})
      
.controller("loginCtrl", function(Auth, FBURL, Utils, $firebaseObject, $localStorage, $location, $scope, $state) {
    var rootRef = new Firebase(FBURL);
    
    // Login Comum:
    $scope.login = function(usuario) {
        if(angular.isDefined(usuario)){
            Utils.show();
            Auth.login(usuario).then(function(authData) {
                console.log("Authenticated successfully with payload:", authData);
                rootRef.child('perfis').orderByChild("id_firebase").equalTo(authData.uid).on("child_added", function(snapshot) {
                    var chaveUsuario = snapshot.key();
                    var objUsuario = $firebaseObject(rootRef.child('perfis').child(chaveUsuario));

                    objUsuario.$loaded().then(function(data) {
                        // console.log(data === objUsuario);
                        // console.log(objUsuario);
                        $localStorage.chaveUsuario = chaveUsuario;
                        $localStorage.chaveEndereco = objUsuario.endereco;
                        $localStorage.chaveConfiguracao = objUsuario.configuracao;
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
})

.controller("cadastroCtrl", function(Auth, Utils, $location, $scope) {
    $scope.cadastrar = function (usuario, perfil, endereco, configuracao) {
        if (angular.isDefined(usuario, perfil, endereco, configuracao)) {
            Utils.show();
            Auth.cadastrar(usuario, perfil, endereco, configuracao).then(function() {
                Utils.hide();
                Utils.alertshow("Sucesso", "Seu perfil foi criado com sucesso!");
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