'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})

.controller('principalCtrl', function(avaliacaoService, FBURL, $firebaseArray, $scope, $state) {
    var servicosRef = new Firebase(FBURL).child('servicos');
    $scope.servicos = $firebaseArray(servicosRef);

    $scope.definirServico = function (servico) {
        avaliacaoService.servicoSelecionado = servico;
        $state.go('menu.avaliacao');
    }
})

.controller('avaliacaoCtrl', function(Localizacao, avaliacaoService, FBURL, $firebaseArray, $localStorage, $scope, Utils) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.servico = avaliacaoService.servicoSelecionado;
        $scope.bairro = $localStorage.bairro;
        $scope.cidade = $localStorage.cidade;
        
                Localizacao.obterLocalizacao().then(function (promise) {
                    //console.log("Geolozalização Apache Cordova: " + promise.toString());
                    $localStorage.latLng = promise;

                    Localizacao.obterRegiao(promise).then(function (promise) {
                        console.log(promise.cidade + "/" + promise.bairro);
                        $localStorage.latLngBairro = promise.latLngBairro;
                        $localStorage.latLngCidade = promise.latLngCidade;
                        $localStorage.bairro = promise.bairro;
                        $localStorage.cidade = promise.cidade;
                        
                    }, function (error) {
                        console.log("Não foi possível obter a região: " + error.message);
                    });

                }, function (error) {
                    console.log("Não foi possível obter a localização: " + error.message);
                });
    });
    
    $scope.salvarAvaliacao = function (servico) {
        var avaliacaoesRef = new Firebase(FBURL).child('avaliacoes').child(servico.nome).child($scope.cidade).child($scope.bairro);
        var mediasBairroRef = new Firebase(FBURL).child('medias').child(servico.nome).child($scope.cidade).child($scope.bairro);
        var mediasCidadeRef = new Firebase(FBURL).child('medias').child(servico.nome).child($scope.cidade);
        var latLngUsuario = $localStorage.latLng.toString().replace("(", "").replace(")", "").split(',', 2);
        var avaliacao = {};
        
        avaliacao.data = Date();
        avaliacao.nota = $scope.nota;
        avaliacao.perfil = $localStorage.chaveUsuario;
        avaliacao.lat = parseFloat(latLngUsuario[0]);
        avaliacao.lng = parseFloat(latLngUsuario[1]);

        //Criar avaliação:
        avaliacaoesRef = $firebaseArray(avaliacaoesRef);
        avaliacaoesRef.$add(avaliacao).then(function (avaliacao) {
            console.log("Avaliação criada: " + avaliacao.key());

            //Obter a soma de todas as avaliações do servico do bairro:
            avaliacaoesRef.$loaded().then(function () {
                var mediaAvaliacoes = 0;
                var soma = 0;
                var totalAvaliacoesBairro = avaliacaoesRef.length;             

                angular.forEach(avaliacaoesRef, function (avl) {
                    soma += parseInt(avl.nota);
                });
                
                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesBairro);
                
                var latLngBairro = $localStorage.latLngBairro.toString().replace('(', '').replace(')', '').split(',', 2);
                var mediaBairro = {};
                
                mediaBairro.lat = parseFloat(latLngBairro[0]);
                mediaBairro.lng = parseFloat(latLngBairro[1]);
                mediaBairro.media = mediaAvaliacoes.toFixed(2);
                
                var latLngCidade = $localStorage.latLngCidade.toString().replace('(', '').replace(')', '').split(',', 2);
                var mediaCidade ={};
                
                mediaCidade.lat = parseFloat(latLngCidade[0]);
                mediaCidade.lng = parseFloat(latLngCidade[1]);

                var onComplete = function (error) {
                    if (error) {
                        console.log('Erro ao Sincronizar: ' + error.message);
                    }
                };
                
                //Atualizar a média no banco:
                mediasBairroRef.update(mediaBairro, onComplete);
                mediasCidadeRef.update(mediaCidade, onComplete);
                
            });
        },
        function (error) {
            Utils.alertshow("Não foi possível registrar a avaliação: " + error.message);
            console.log("Não foi possível registrar a avaliação: " + error.message);
        });
    };
    
    $scope.ratingsObject = {
        iconOn: 'ion-ios-star',
        iconOff: 'ion-ios-star-outline',
        iconOnColor: 'rgb(200, 200, 100)',
        iconOffColor: 'rgb(200, 100, 100)',
        rating: 1,
        minRating: 0,
        callback: function (rating) {
            $scope.ratingsCallback(rating);
        }
    };

    $scope.ratingsCallback = function (rating) {
        $scope.nota = rating;
    };
})

.controller('mapaCtrl', function(FBURL, $localStorage, $ionicLoading, $scope) {
    $scope.map = new google.maps.Map(document.getElementById('map'), {center: {lat: -34.397, lng: 150.644}, zoom: 15, mapTypeId: google.maps.MapTypeId.ROADMAP});
    $scope.map.setCenter($localStorage.latLng);
    //$scope.infoWindow = new google.maps.InfoWindow({map: $scope.map});
    //$scope.infoWindow.setPosition($localStorage.latLng);
    //$scope.infoWindow.setContent('Geolocalização Apache Cordova');
    
//    var mediasRef = new Firebase(FBURL).child('medias').child('Saúde');
//    mediasRef = $firebaseArray(mediasRef);
//
//    mediasRef.$loaded().then(function () {
//        angular.forEach(mediasRef, function (cidade) {
//           angular.forEach(cidade, function (bairro) {
//               console.log(bairro);
//           });
//        });
//    });

    //Adicionando Círculos (Bairros):
    var radiusMaximo = 500;
    var citymapteste = [];
    var mediasRef = new Firebase(FBURL);
    var mediasRef = mediasRef.child('medias').child('Saúde');
    mediasRef.once("value", function (cidade) {
        cidade.forEach(function (bairro) {
            bairro.forEach(function (snapshot) {
                if (snapshot.hasChildren()) {
                    var bairro = {
                        center: {lat: snapshot.val().lat, lng: snapshot.val().lng},
                        media: snapshot.val().media
                    };
                    citymapteste.push(bairro)
                }
            });
        });
        
        citymapteste.forEach(function (bairro) {
            if(bairro.media <= 1.00){
                var color = "#FF0000"
            }
            else if(bairro.media >= 1.00 && bairro.media <= 2.00) {
                var color = "#FA8072"
            }
            else if(bairro.media >= 2.00 && bairro.media <= 3.00) {
                var color = "#FFFF00"
            }
            else if(bairro.media >= 3.00 && bairro.media <= 4.00) {
                var color = "#FFD700"
            }
            else if(bairro.media >= 4.00 && bairro.media <= 5.00) {
                var color = "#90EE90"
            }
                  
            var cityCircle = new google.maps.Circle({
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: 0.35,
                map: $scope.map,
                center: bairro.center,
                radius: radiusMaximo / Math.sqrt(bairro.media)
            });
            
            var mapLabel = new MapLabel({
                text: bairro.media,
                position: new google.maps.LatLng(bairro.center.lat, bairro.center.lng),
                map: $scope.map,
                fontSize: 15,
                align: 'center',
                strokeColor: '#FFFFFF',
                fontColor: '#000000',
                minZoom: 15
            });         
        });
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

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
        $scope.rootRef = new Firebase(FBURL);
        $scope.chaveUsuario = $localStorage.chaveUsuario;
        $scope.chaveEndereco = $localStorage.chaveEndereco;
        $scope.chaveConfiguracao = $localStorage.chaveConfiguracao;
       
        $scope.perfil = {};
        $scope.usuario = {};
        $scope.endereco = {};
        $scope.configuracao = {};

        $scope.rootRef.child('perfis').child($scope.chaveUsuario).on("value", function(snapshot) {
            $scope.perfil.nome = snapshot.val().nome;
            $scope.perfil.sobrenome = snapshot.val().sobrenome;
            $scope.usuario.email = snapshot.val().email;       
        });
                     
        $scope.rootRef.child('enderecos').child($scope.chaveEndereco).on("value", function(snapshot) {
            $scope.endereco.bairro = snapshot.val().bairro;
            $scope.endereco.cidade = snapshot.val().cidade;
        });

        $scope.rootRef.child('configuracoes').child($scope.chaveConfiguracao).on("value", function(snapshot) {
            $scope.configuracao.email = snapshot.val().email;
        });
    });
    
    $scope.salvar = function (usuario, perfil, endereco, configuracao) {
        Utils.show();
        
        if (angular.isDefined(perfil)) {
            console.log($scope.chaveUsuario);
            var perfilRef = $scope.rootRef.child('perfis').child($scope.chaveUsuario);
            perfilRef.update({nome: perfil.nome, sobrenome: perfil.sobrenome});
        }
        if (angular.isDefined(endereco)) {
            console.log($scope.chaveEndereco);
            var enderecoRef = $scope.rootRef.child('enderecos').child($scope.chaveEndereco);
            enderecoRef.update({bairro: endereco.bairro, cidade: endereco.cidade});
        }
        if (angular.isDefined(configuracao)) {
            console.log($scope.chaveConfiguracao);
            var configuracaoRef = $scope.rootRef.child('configuracoes').child($scope.chaveConfiguracao);
            configuracaoRef.update({email: configuracao.email});
        }
        
        Utils.hide();
        Utils.alertshow("Sucesso", "Seu perfil foi alterado com sucesso!"); 
    };
    
    $ionicModal.fromTemplateUrl('modalalteracaosenha.html', {
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
      
.controller("loginCtrl", function(Auth, FBURL, Localizacao, Utils, $firebaseObject, $localStorage, $scope, $state) {
    var rootRef = new Firebase(FBURL);
    
    // Login Comum:
    $scope.login = function (usuario) {
        if (angular.isDefined(usuario)) {
            Utils.show();
            Auth.login(usuario).then(function (authData) {
                console.log("Authenticated successfully with payload:", authData);
                rootRef.child('perfis').orderByChild("id_firebase").equalTo(authData.uid).on("child_added", function (snapshot) {
                    var chaveUsuario = snapshot.key();
                    var objUsuario = $firebaseObject(rootRef.child('perfis').child(chaveUsuario));

                    objUsuario.$loaded().then(function (data) {
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

                Localizacao.obterLocalizacao().then(function (promise) {
                    console.log("Geolozalização Apache Cordova: " + promise.toString());
                    $localStorage.latLng = promise;
                    
                    Localizacao.obterRegiao(promise).then(function (promise) {
                        console.log(promise.cidade + "/" + promise.bairro);
                        $localStorage.latLngBairro = promise.latLngBairro;
                        $localStorage.latLngCidade = promise.latLngCidade;
                        $localStorage.bairro = promise.bairro;
                        $localStorage.cidade = promise.cidade;
                        
                    }, function (error) {
                        console.log("Não foi possível obter a região: " + error.message);
                    });

                }, function (error) {
                    console.log("Não foi possível obter a localização: " + error.message);
                });
            },
            function (error) {
                Utils.hide();
                Utils.errMessage(error);
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

.controller('administracaoCtrl', function($ionicModal, $scope) {
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