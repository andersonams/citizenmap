'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('citizenMapCtrl', function($scope) {

})

.controller('principalCtrl', function (avaliacaoService, FBURL, $firebaseArray, $localStorage, $scope, $state, Utils) {   
    $scope.$on('$ionicView.beforeEnter', function () {
        Utils.show();
        
        definirServicosView().then(function (servicosView) {
            $scope.servicosView = servicosView;
            
            definirServicosAvaliaveis(servicosView).then(function () {
                Utils.hide();
                
            }, function (error) {
                Utils.hide();
                Utils.errMessage(error);
            });
        }, function (error) {
            Utils.hide();
            Utils.errMessage(error);
        });
    });
    
    $scope.definirServico = function (servico) {
        avaliacaoService.setServico(servico);
        $state.go('menu.avaliacao');
    }
    
    function definirServicosView() {
        var servicosRef;
        var servicosView = [];
        
        servicosRef = new Firebase(FBURL).child('servicos');
        servicosRef = $firebaseArray(servicosRef);

        return new Promise(function (resolve, reject) {
            servicosRef.$loaded().then(function () {
                servicosRef.forEach(function (servico) {
                    var servicoT = {nome: servico.nome, descricao: servico.descricao, img: servico.img, disponibilidade: servico.disponibilidade, detalhes: servico.detalhes};
                    servicosView.push(servicoT);
                })

                resolve(servicosView);
            }, function (errorObject) {
                reject(errorObject);
                console.log(errorObject.message);
            });
        });
    }
    
    function definirServicosAvaliaveis(servicosView) {
        var avaliacaoesRef = new Firebase(FBURL).child('avaliacoes');
        var tipoUsuario = $localStorage.tipoUsuario;
        
        return new Promise(function (resolve, reject) {
            if (tipoUsuario == 'cmn') {
                servicosView.forEach(function (servico) {
                    avaliacaoesRef.once("value", function (avaliacoes) {
                        if (avaliacoes.child(servico.nome).exists()) {
                            var datas = [];
                            var avaliacaoesCidadeRef = avaliacaoesRef.child(servico.nome);

                            avaliacaoesCidadeRef.once("value", function (cidades) {
                                cidades.forEach(function (bairros) {
                                    bairros.forEach(function (avls) {
                                        avls.forEach(function (avl) {
                                            if (avl.val().perfil == $localStorage.chaveUsuario) {
                                                datas.push(new Date(avl.val().data));
                                            }
                                        });
                                    });
                                });

                                var data1 = new Date(Math.max.apply(null, datas));
                                var data2 = new Date();

                                var timeDiff = Math.abs(data2.getTime() - data1.getTime());
                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                if (diffDays < 30) {
                                    servico.disponibilidade = false;
                                }
                                
                                resolve();
                            }, function (errorObject) {
                                reject(errorObject);
                                console.log(errorObject.message);
                            });
                        }
                    }, function (errorObject) {
                        reject(errorObject);
                        console.log(errorObject.message);
                    });
                })
            } else {
                resolve();
            }
        });
    }
})

.controller('avaliacaoCtrl', function(LocalizacaoFactory, localizacaoService, avaliacaoService, FBURL, Utils, $firebaseArray, $localStorage, $scope, $state) {  
    $scope.model = {
        detalhe: '',
        nota: 1
    };
               
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.servico = avaliacaoService.getServico();
        $scope.bairro = $localStorage.bairro;
        $scope.cidade = $localStorage.cidade;
     
        // Temporário:
        localizacaoService.setLocalizacao(LocalizacaoFactory, $localStorage).then(function () {
            console.log("Geolozalização Apache Cordova: " + $localStorage.latLng.toString());
            console.log($localStorage.cidade + "/" + $localStorage.bairro);
        }, function (error) {
            console.log("Não foi possível obter a localização: " + error.message);
        });
    });
    
    $scope.salvarAvaliacao = function (avaliacaoForm) {
        if (avaliacaoForm.$valid) {
            Utils.show();

            var avaliacaoesCidadeRef = new Firebase(FBURL).child('avaliacoes').child($scope.servico.nome).child($scope.cidade);
            var avaliacaoesBairroRef = new Firebase(FBURL).child('avaliacoes').child($scope.servico.nome).child($scope.cidade).child($scope.bairro);
            var mediasBairroRef = new Firebase(FBURL).child('medias').child($scope.servico.nome).child($scope.cidade).child($scope.bairro);
            var mediasCidadeRef = new Firebase(FBURL).child('medias').child($scope.servico.nome).child($scope.cidade);

            var latLngUsuario = $localStorage.latLng.toString().replace("(", "").replace(")", "").split(',', 2);
            var avaliacao = {};

            avaliacao.data = Date();
            avaliacao.nota = $scope.model.nota;
            avaliacao.detalhe = $scope.model.detalhe;
            avaliacao.perfil = $localStorage.chaveUsuario;
            avaliacao.lat = parseFloat(latLngUsuario[0]);
            avaliacao.lng = parseFloat(latLngUsuario[1]);

            avaliacaoesBairroRef = $firebaseArray(avaliacaoesBairroRef);

            avaliacaoesBairroRef.$add(avaliacao).then(function (avaliacao) {
                updateMediaCidade(avaliacaoesCidadeRef, mediasCidadeRef).then(function () {
                    updateMediaBairro(avaliacaoesBairroRef, mediasBairroRef).then(function () {
                        Utils.hide();
                        Utils.alertshow("Avaliação Registrada com Sucesso!");
                        $state.go('menu.posavaliacao');
                        console.log("Avaliação criada: " + avaliacao.key());
                    }, function (error) {
                        Utils.hide();
                        Utils.errMessage(error);
                        console.log("Não foi possível atualizar a média do bairro: " + error.message);
                    });
                }, function (error) {
                    Utils.hide();
                    Utils.errMessage(error);
                    console.log("Não foi possível atualizar a média da cidade: " + error.message);
                });
            }, function (error) {
                Utils.hide();
                Utils.errMessage(error);
                console.log("Não foi possível registrar a avaliação: " + error.message);
            });
        }
    };
    
    function updateMediaBairro(avaliacaoesBairroRef, mediasBairroRef) {
        return new Promise(function (resolve, reject) {
            
            avaliacaoesBairroRef.$loaded().then(function () {
                var soma = 0;
                var mediaAvaliacoes = 0;
                var totalAvaliacoesBairro = avaliacaoesBairroRef.length;
                var detalhe;
                var detalheMax;
                var detalhes = {};
                
                avaliacaoesBairroRef.forEach(function (avaliacao) {
                    if (!angular.isDefined(detalhes[avaliacao.detalhe])) {
                        detalhes[avaliacao.detalhe] = 1;
                    } else {
                        detalhes[avaliacao.detalhe] += 1;
                    }
                    soma += parseInt(avaliacao.nota);
                })

               //Definir o detalhe mais escolhido: 
               detalhe = Object.keys(detalhes).reduce(function(a, b){ return detalhes[a] > detalhes[b] ? a : b });
               detalheMax = Object.keys(detalhes).reduce(function(m, k){ return detalhes[k] > m ? detalhes[k] : m }, -Infinity);

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesBairro);

                var mediaBairro = {};

                mediaBairro.lat = $localStorage.latLngBairro.lat;
                mediaBairro.lng = $localStorage.latLngBairro.lng;
                mediaBairro.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaBairro.detalhe = detalhe;
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
            var detalhe;
            var detalheMax;
            var detalhes = {};
                
            avaliacaoesCidadeRef.once("value", function (cidade) {
                cidade.forEach(function (bairro) {
                    bairro.forEach(function (avaliacao) {
                        if (!angular.isDefined(detalhes[avaliacao.val().detalhe])) {
                            detalhes[avaliacao.val().detalhe] = 1;
                        } else {
                            detalhes[avaliacao.val().detalhe] += 1;
                        }
                        soma += parseInt(avaliacao.val().nota);
                        totalAvaliacoesCidade += 1;
                    });
                });
                
               //Definir o detalhe mais ecolhido: 
               detalhe = Object.keys(detalhes).reduce(function(a, b){ return detalhes[a] > detalhes[b] ? a : b });
               detalheMax = Object.keys(detalhes).reduce(function(m, k){ return detalhes[k] > m ? detalhes[k] : m }, -Infinity);

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesCidade);

                var mediaCidade = {};

                mediaCidade.lat = $localStorage.latLngCidade.lat;
                mediaCidade.lng = $localStorage.latLngCidade.lng;
                mediaCidade.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaCidade.detalhe = detalhe;
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
        $scope.model.nota = rating;
    };
})

.controller('posAvaliacaoCtrl', function () {
    
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

.controller('mapaCtrl', function(FBURL, LocalizacaoFactory, localizacaoService, Utils, $firebaseArray, $localStorage, mapaService, $scope, $state) {   
    $scope.$on('$ionicView.enter', function () {
        $scope.servico = mapaService.getServico();
        $scope.tipoLocal = mapaService.getTipo();
        
        if (!angular.isDefined($scope.servico) || !angular.isDefined($scope.tipoLocal)) {
            $state.go('menu.principal');
        } else {
            putMapa();
            putAvaliacoes($scope.tipoLocal, $scope.servico);
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
        var mediasRef = new Firebase(FBURL).child('medias').child(servico.nome);
        var detalhesRef = new Firebase(FBURL).child('servicos').child(servico.$id).child('detalhes');
        var detalhesRef = $firebaseArray(detalhesRef);

        return new Promise(function (resolve, reject) {
            mediasRef.once("value", function (cidade) {
                cidade.forEach(function (snapshot) {
                    var cidade = {
                        nome: snapshot.key(),
                        media: snapshot.val().media,
                        detalhe: detalhesRef.$getRecord(snapshot.val().detalhe).$value,
                        polygon: snapshot.val().polygon,
                        center: {lat: snapshot.val().lat, lng: snapshot.val().lng},
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
        var mediasRef = new Firebase(FBURL).child('medias').child(servico.nome);
        var detalhesRef = new Firebase(FBURL).child('servicos').child(servico.$id).child('detalhes');
        var detalhesRef = $firebaseArray(detalhesRef);
              
        return new Promise(function (resolve, reject) {
            mediasRef.once("value", function (cidade) {
                cidade.forEach(function (bairro) {
                    bairro.forEach(function (snapshot) {
                        if (snapshot.hasChildren() && snapshot.key() != 'polygon') {                        
                            var bairro = {
                                nome: snapshot.key(),
                                media: snapshot.val().media,
                                detalhe: detalhesRef.$getRecord(snapshot.val().detalhe).$value,
                                polygon: snapshot.val().polygon,
                                center: {lat: snapshot.val().lat, lng: snapshot.val().lng}
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
                addClickHandler(polygons, local);
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
    
    function addClickHandler(componente, local) {
        componente.addListener('click', function (event) {
            var contentString;

            contentString = '<b>' + local.nome + '</b><br>';
            contentString += 'Média: <b>' + local.media + '</b><br>';
            contentString += 'Crítica: <b>' + local.detalhe + '</b><br>';

            $scope.infoWindow.setContent(contentString);
            $scope.infoWindow.setPosition(event.latLng);
            $scope.infoWindow.open($scope.map);
        }, false);
    }

    $scope.ondeEstou = function () {
        if (!$scope.map) {
            return;
        } else {
            Utils.show();
            localizacaoService.setLocalizacao(LocalizacaoFactory, $localStorage).then(function () {
                console.log("Geolozalização Apache Cordova: " + $localStorage.latLng.toString());
                console.log($localStorage.cidade + "/" + $localStorage.bairro);

                $scope.map.setCenter($localStorage.latLng);
                Utils.hide();
            }, function (error) {
                console.log("Não foi possível obter a localização: " + error.message);
            });
        }
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
      
.controller("loginCtrl", function(Auth, FBURL, LocalizacaoFactory, localizacaoService, $firebaseObject, $localStorage, $scope, $state, Utils) {
    $scope.usuario = {
        email: '',
        password: ''
    };
  
    $scope.login = function (loginForm) {
        var rootRef = new Firebase(FBURL).child('perfis');
        
        if (loginForm.$valid) {
            Utils.show();
            
            Auth.login($scope.usuario).then(function (authData) {
                console.log("Authenticated successfully with payload:", authData);
            
                rootRef.orderByChild("id_firebase").equalTo(authData.uid).on("child_added", function (perfil) {
                    $localStorage.chaveUsuario = perfil.key();
                    $localStorage.chaveEndereco = perfil.val().endereco;
                    $localStorage.chaveConfiguracao = perfil.val().configuracao;
                    $localStorage.nome = perfil.val().nome;
                    $localStorage.email = perfil.val().email;
                    $localStorage.gravatar = perfil.val().gravatar;
                    $localStorage.tipoUsuario = perfil.val().tipo;                   
                });
                
                localizacaoService.setLocalizacao(LocalizacaoFactory, $localStorage).then(function () {
                    console.log("Geolozalização Apache Cordova: " + $localStorage.latLng.toString());
                    console.log($localStorage.cidade + "/" + $localStorage.bairro);
                    
                    Utils.hide();
                    $state.go('menu.principal');
                }, function (error) {
                    Utils.hide();
                    Utils.errMessage(error);
                    console.log("Não foi possível obter a localização: " + error.message);
                });
            }, function (error) {
                Utils.hide();
                Utils.errMessage(error);
                console.log("Não foi possível efetuar a autenticação: " + error.message);
            });
       }
    };
    
    // Método para login através de alguma rede social:
    $scope.loginProvider = function (provider) {
        Auth.loginProvider(provider).then(function (authData) {
            console.log('Usuário Logado!', authData);
            $state.go('menu.principal');
        }).catch(function (error) {
            if (error.code === "TRANSPORT_UNAVAILABLE") {
                Auth.$authWithOAuthPopup(provider).then(function (authData) {
                    console.log('Usuário Logado!', authData);
                    $state.go('menu.principal');
                });
            } else {
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

.controller('firebaseCtrl', function(FBURL, $firebaseArray, $firebaseObject, $scope) {
    var firebaseRef = new Firebase(FBURL);
  
    // Métodos Firebase:
    // Primeiros a serem chamados para a referência do banco.
    // 
    // .child() Retorna a chave informada por parâmetro, usado para acessar os nós e navegar pelo banco.
    
    
    // Metódos de Query do Firebase:
    // São chamados logos após os métodos do Firebase.
    // 
    // orderByChild() Ordenação por nós filhos.
    // equalTo() Filtro que retorna o objeto informado por parâmetro.
    // on() Fica escutando qualquer alteração daquele nó, chamando a si mesmo toda vez que o nó é alterado.
    // once() Lê o nó somente no momento da excução da função.
    
    // Para os métodos on() e once(), são passados Tipos de Eventos:
    // 
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
    
    // Usando $firebaseArray e $firebaseObject (Biblioteca AngularFire)
    //
    // $firebaseArray
    // Matriz sincronizada que deve ser usada para qualquer lista de objetos que serão ordenadas, iteradas, e que têm identificações exclusivas. Usados para iterar nós que tem chaves únicas. Possue métodos de inserção que automaticamente incluem uma chave primária ao item adicionado.
    $scope.perfis = $firebaseArray(firebaseRef.child('perfis'));
    
    $scope.perfis.$loaded().then(function (avlsIterator) {
        console.log(avlsIterator);
    }, function (errorObject) {
        reject(errorObject);
        console.log("The read failed: " + errorObject.code);
    });

    $scope.perfis.$add({perfil: "Teste"}).then(function (ref) {
        console.log("added record with id " + ref.key());
    }, function (errorObject) {
        reject(errorObject);
        console.log("The read failed: " + errorObject.code);
    });
    
    // $firebaseObject
    // São úteis para armazenar pares de chave ou valor e registros singulares que não são utilizados como uma coleção.
    $scope.objPerfil = $firebaseObject(firebaseRef.child('perfis').child('-KJMqzNbtyNAx72Fh8vm'));
    
    $scope.objPerfil.$loaded().then(function (objPerfil) {
        console.log(objPerfil);
    }).catch(function (error) {
        console.error("Erro:", error);
    });
});