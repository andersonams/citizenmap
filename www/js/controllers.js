'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})

.controller('principalCtrl', function(avaliacaoService, FBURL, $firebaseArray, $scope, $state) {
    var servicosRef = new Firebase(FBURL).child('servicos');
    $scope.servicos = $firebaseArray(servicosRef);

    $scope.definirServico = function (servico) {
        avaliacaoService.setServico(servico);
        $state.go('menu.avaliacao');
    }
})

.controller('avaliacaoCtrl', function(avaliacaoService, FBURL, $firebaseArray, Localizacao, $localStorage, $scope, Utils) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.servico = avaliacaoService.getServico();
        $scope.bairro = $localStorage.bairro;
        $scope.cidade = $localStorage.cidade;
        
                Localizacao.obterLocalizacao().then(function (promise) {
                    console.log("Geolozalização Apache Cordova: " + promise.toString());
                    $localStorage.latLng = promise;
                    
                    Localizacao.obterRegiaoWikiMapia(promise).then(function (promise) {
                        console.log(promise.cidade.nome + "/" + promise.bairro.nome);
                        $localStorage.latLngBairro = promise.bairro.latLng;
                        $localStorage.latLngCidade = promise.cidade.latLng;
                        $localStorage.bairro = promise.bairro.nome;
                        $localStorage.cidade = promise.cidade.nome; 
                        $localStorage.polygonsBairro = promise.bairro.polygons;
                        $localStorage.polygonsCidade = promise.cidade.polygons;

                    }, function (error) {
                        console.log("Não foi possível obter a região: " + error.message);
                    });
                          
                }, function (error) {
                    console.log("Não foi possível obter a localização: " + error.message);
                });
    });
    
    $scope.salvarAvaliacao = function (servico) {
        Utils.show();
        
        var avaliacaoesCidadeRef = new Firebase(FBURL).child('avaliacoes').child(servico.nome).child($scope.cidade);
        var avaliacaoesBairroRef = new Firebase(FBURL).child('avaliacoes').child(servico.nome).child($scope.cidade).child($scope.bairro);
        var mediasBairroRef = new Firebase(FBURL).child('medias').child(servico.nome).child($scope.cidade).child($scope.bairro);
        var mediasCidadeRef = new Firebase(FBURL).child('medias').child(servico.nome).child($scope.cidade);
        
        var latLngUsuario = $localStorage.latLng.toString().replace("(", "").replace(")", "").split(',', 2);
        var avaliacao = {};
        
        avaliacao.data = Date();
        avaliacao.nota = $scope.nota;
        avaliacao.perfil = $localStorage.chaveUsuario;
        avaliacao.lat = parseFloat(latLngUsuario[0]);
        avaliacao.lng = parseFloat(latLngUsuario[1]);
        
        avaliacaoesBairroRef = $firebaseArray(avaliacaoesBairroRef);
   
        avaliacaoesBairroRef.$add(avaliacao).then(function (avaliacao) {
            updateMediaCidade(avaliacaoesCidadeRef, mediasCidadeRef).then(function () {
                updateMediaBairro(avaliacaoesBairroRef, mediasBairroRef).then(function () {
                    Utils.hide();
                    Utils.alertshow("Avaliação Registrada com Sucesso!");
                    console.log("Avaliação criada: " + avaliacao.key());
                }, function (error) {
                    Utils.hide();
                    console.log("Não foi possível obter a região: " + error.message);
                });
            }, function (error) {
                Utils.hide();
                console.log("Não foi possível obter a região: " + error.message);
            });
        }, function (error) {
            Utils.hide();
            Utils.alertshow("Não foi possível registrar a avaliação: " + error.message);
            console.log("Não foi possível registrar a avaliação: " + error.message);
        });
    };
    
    function updateMediaBairro(avaliacaoesBairroRef, mediasBairroRef) {
        return new Promise(function (resolve, reject) {

            avaliacaoesBairroRef.$loaded().then(function () {
                var mediaAvaliacoes = 0;
                var soma = 0;
                var totalAvaliacoesBairro = avaliacaoesBairroRef.length;
                
                avaliacaoesBairroRef.forEach(function (avaliacao) {
                    soma += parseInt(avaliacao.nota);
                });

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesBairro);

                var mediaBairro = {};

                mediaBairro.lat = $localStorage.latLngBairro.lat;
                mediaBairro.lng = $localStorage.latLngBairro.lng;
                mediaBairro.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaBairro.polygon = $localStorage.polygonsBairro;

                mediasBairroRef.update(mediaBairro, onComplete);

                resolve();
            }, function (errorObject) {
                reject(errorObject);
                console.log("The read failed: " + errorObject.code);
            });
        });
    }

    function updateMediaCidade(avaliacaoesCidadeRef, mediasCidadeRef) {
        return new Promise(function (resolve, reject) {

            var soma = 0;
            var mediaAvaliacoes = 0;
            var totalAvaliacoesCidade = 0;              
                
            avaliacaoesCidadeRef.once("value", function (cidade) {
                cidade.forEach(function (bairro) {
                    bairro.forEach(function (avaliacao) {
                        soma += parseInt(avaliacao.val().nota);
                        totalAvaliacoesCidade += 1;
                    });
                });

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesCidade);

                var mediaCidade = {};

                mediaCidade.lat = $localStorage.latLngCidade.lat;
                mediaCidade.lng = $localStorage.latLngCidade.lng;
                mediaCidade.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaCidade.polygon = $localStorage.polygonsCidade;

                mediasCidadeRef.update(mediaCidade, onComplete);

                resolve();
            }, function (errorObject) {
                reject(errorObject);
                console.log("The read failed: " + errorObject.code);
            });
        });
    }
    
    var onComplete = function (error) {
        if (error) {
            console.log('Erro ao Sincronizar: ' + error.message);
        }
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

.controller('mapasCtrl', function (FBURL, $firebaseArray, $ionicModal, mapaService, $scope, $state) {
    var servicosRef = new Firebase(FBURL).child('servicos');
    $scope.servicos = $firebaseArray(servicosRef);
    
    $scope.definirTipo = function (tipo) {
        mapaService.setTipo(tipo);
    }
     
    $scope.definirServico = function (servico) {
        mapaService.setServico(servico);
        $state.go('menu.mapa');
    }
    
    $ionicModal.fromTemplateUrl('modalselecionarservico.html', {
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

.controller('mapaCtrl', function(FBURL, $localStorage, $ionicLoading, mapaService, $scope, $state) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.servico = mapaService.getServico();
        $scope.tipoLocal = mapaService.getTipo();

        if (typeof $scope.servico == 'undefined' || $scope.tipoLocal == 'undefined') {
            $state.go('menu.mapas');
        } else {
            putMapa();
            putAvaliacoes($scope.tipoLocal, $scope.servico.nome);
        }
    });
    
    function putMapa() {
        $scope.map = new google.maps.Map(document.getElementById('map'), {center: {lat: -34.397, lng: 150.644}, zoom: 15, mapTypeId: google.maps.MapTypeId.ROADMAP});
        $scope.map.setCenter($localStorage.latLng);
        $scope.infoWindow = new google.maps.InfoWindow;
    }
    
    function putAvaliacoes(tipo, servico) {
        if (tipo == "Cidade") {
            carregarCidades(servico).then(function (cidades) {
                putFronteiras(cidades);
            }, function (error) {
                console.log(error.message);
            });
        } else if (tipo == "Bairro") {
            carregarBairros(servico).then(function (bairros) {
                putFronteiras(bairros);
            }, function (error) {
                console.log(error.message);
            });
        }
    }
    
    function carregarCidades(servico) {
        var cidades = [];
        var mediasRef = new Firebase(FBURL).child('medias').child(servico);

        return new Promise(function (resolve, reject) {
            mediasRef.once("value", function (cidade) {
                cidade.forEach(function (snapshot) {
                    var cidade = {
                        center: {lat: snapshot.val().lat, lng: snapshot.val().lng},
                        media: snapshot.val().media,
                        polygon: snapshot.val().polygon
                    };
                    cidades.push(cidade)
                });

                resolve(cidades);
            }, function (errorObject) {
                reject(errorObject);
                console.log("The read failed: " + errorObject.code);
            });
        });
    }
    
    function carregarBairros(servico) {
        var bairros = [];
        var mediasRef = new Firebase(FBURL).child('medias').child(servico);

        return new Promise(function (resolve, reject) {
            mediasRef.once("value", function (cidade) {
                cidade.forEach(function (bairro) {
                    bairro.forEach(function (snapshot) {
                        if (snapshot.hasChildren()) {
                            var bairro = {
                                center: {lat: snapshot.val().lat, lng: snapshot.val().lng},
                                media: snapshot.val().media,
                                polygon: snapshot.val().polygon
                            };
                            bairros.push(bairro)
                        }
                    });
                });

                resolve(bairros);
            }, function (errorObject) {
                reject(errorObject);
                console.log("The read failed: " + errorObject.code);
            });
        });
    }
    
    function putFronteiras(locais) {
        locais.forEach(function (local) {
            if (local.polygon) {
                var coordenadas = [];

                local.polygon.forEach(function (polygon) {
                    var ponto = {lat: polygon.y, lng: polygon.x};
                    coordenadas.push(ponto);
                })

                var polygons = new google.maps.Polygon({
                    paths: coordenadas,
                    strokeColor: getCor(local.media),
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: getCor(local.media),
                    fillOpacity: 0.35,
                });

                polygons.setMap($scope.map);
                polygons.addListener('click', showArrays);                               
            }
        });
    }

    function putCirculos(bairros) {
        bairros.forEach(function (bairro) {
            var cityCircle = new google.maps.Circle({
                strokeColor: getCor(bairro.media),
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: getCor(bairro.media),
                fillOpacity: 0.35,
                map: $scope.map,
                center: bairro.center,
                radius: 500 / Math.sqrt(bairro.media)
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
    }
    
    function getCor(media) {
        if (media <= 1.00) {
            return "#FF0000"
        } else if (media >= 1.00 && media <= 2.00) {
            return "#FFA07A"
        } else if (media >= 2.00 && media <= 3.00) {
            return "#FFD700"
        } else if (media >= 3.00 && media <= 4.00) {
            return "#ADFF2F"
        } else if (media >= 4.00 && media <= 5.00) {
            return "#90EE90"
        }
    }
    
    /** @this {google.maps.Polygon} */
    function showArrays(event) {
        // var latLng = new google.maps.LatLng(bairro.center.lat, bairro.center.lng);
        // Since this polygon has only one path, we can call getPath() to return the MVCArray of LatLngs.
        var contentString = '<b>Bermuda Triangle Polygon</b><br>' + 'Clicked location: <br>' + 1 + ',' + 2 + '<br>';

        $scope.infoWindow.setContent(contentString);
        $scope.infoWindow.setPosition(event.latLng);
        $scope.infoWindow.open($scope.map);
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
   
.controller('perfilCtrl', function(FBURL, $ionicModal, $localStorage, $scope, Utils) {
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
      
.controller("loginCtrl", function(Auth, FBURL, Localizacao, $firebaseObject, $localStorage, $scope, $state, Utils) {
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
                    })
                    .catch(function(error) {
                        console.error("Erro:", error);
                    });
                });

                Localizacao.obterLocalizacao().then(function (promise) {
                    console.log("Geolozalização Apache Cordova: " + promise.toString());
                    $localStorage.latLng = promise;
                    
                    Localizacao.obterRegiaoWikiMapia(promise).then(function (promise) {
                        console.log(promise.cidade.nome + "/" + promise.bairro.nome);
                        $localStorage.latLngBairro = promise.bairro.latLng;
                        $localStorage.latLngCidade = promise.cidade.latLng;
                        $localStorage.bairro = promise.bairro.nome;
                        $localStorage.cidade = promise.cidade.nome;
                        $localStorage.polygonsBairro = promise.bairro.polygons;
                        $localStorage.polygonsCidade = promise.cidade.polygons;
                        
                        Utils.hide();
                        $state.go('menu.principal');
                    }, function (error) {
                        Utils.hide();
                        console.log("Não foi possível obter a região: " + error.message);
                    });
                }, function (error) {
                    Utils.hide();
                    console.log("Não foi possível obter a localização: " + error.message);
                });
            }, function (error) {
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

.controller("cadastroCtrl", function(Auth, $location, $scope, Utils) {
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
                // Pesquisando uma Cidade Específica:
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