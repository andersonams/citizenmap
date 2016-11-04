'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('principalCtrl', function (AvaliacaoService, FBURL, IonicInteraction, $firebaseArray, $localStorage, $scope, $state) {
    $scope.$on('$ionicView.beforeEnter', function () {
        IonicInteraction.show();
        
        definirServicosView().then(function (servicosView) {
            $scope.servicosView = servicosView;
            
            definirServicosAvaliaveis(servicosView).then(function () {
                IonicInteraction.hide();
                
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log(error.message);
            });
        }, function (error) {
            IonicInteraction.hide();
            IonicInteraction.errMessage(error);
            console.log(error.message);
        });
    });
    
    $scope.definirServico = function (servico) {
        AvaliacaoService.setServico(servico);
        $state.go('menu.avaliacao.avaliar');
    }
    
    function definirServicosView() {
        var servicosRef;
        var servicosView = [];
        
        servicosRef = new Firebase(FBURL).child('servicos');
        servicosRef = $firebaseArray(servicosRef);

        return new Promise(function (resolve, reject) {
            servicosRef.$loaded().then(function () {
                servicosRef.forEach(function (servico) {
                    var servicoView = {id: servico.$id, nome: servico.nome, descricao: servico.descricao, imagem: servico.imagem, disponibilidade: servico.disponibilidade, detalhes: servico.detalhes};
                    servicosView.push(servicoView);
                });

                resolve(servicosView);
            }, function (errorObject) {
                reject(errorObject);
            });
        });
    }
    
    function definirServicosAvaliaveis(servicosView) {
        return new Promise(function (resolve, reject) {
            if ($localStorage.usuario.tipo == 'adm') {
                servicosView.forEach(function (servico) {
                    var datas = [];
                    var avaliacaoesServicoRef = new Firebase(FBURL).child('avaliacoes').child(servico.id);
                    var avaliacoesArray = $firebaseArray(avaliacaoesServicoRef.orderByChild("perfil").equalTo($localStorage.usuario.id));

                    avaliacoesArray.$loaded().then(function (avaliacoesUsuario) {
                        avaliacoesUsuario.forEach(function (avaliacao) {
                            datas.push(new Date(avaliacao.data));
                        });

                        var data1 = new Date(Math.max.apply(null, datas));
                        var data2 = new Date();

                        var timeDiff = Math.abs(data2.getTime() - data1.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                        if (diffDays < 30) {
                            servico.disponibilidade = false;
                        }

                        resolve();
                    }, function (error) {
                        reject(error);
                    });
                });
            } else {
                resolve();
            }
        });
    }
})

.controller('avaliacaoCtrl', function(LocalizacaoFactory, AvaliacaoService, FBURL, IonicInteraction, IonicModal, IonicRatings, $firebaseArray, $localStorage, $scope, $state) {
    IonicModal.gerarModal('templates/modals/alterarlocalizacao.html', $scope);
    IonicRatings.gerarRatings($scope);
    
    $scope.$on('$ionicView.beforeEnter', function () {
        IonicInteraction.show();
        
        $scope.model = {detalhe: 'default', nota: 1};
        $scope.servico = AvaliacaoService.getServico();
        
        LocalizacaoFactory.getLocalizacao().then(function (localizacao) {
            LocalizacaoFactory.setLocalizacao(localizacao);
            
            $scope.bairro = localizacao.bairro;
            $scope.cidade = localizacao.cidade;
            $scope.locais = localizacao.locais;
            IonicInteraction.hide();
        }, function (error) {
            IonicInteraction.hide();
            IonicInteraction.errMessage(error);
            console.log("Não foi possível obter a localização: " + error.message);
        });
    });
    
    $scope.ratingsCallback = function (rating) {
        $scope.model.nota = rating;
    };
    
    $scope.definirLocalizacao = function (local) {
        IonicInteraction.show();
        
        LocalizacaoFactory.getLocalizacaoByID(local).then(function (localizacao) {
            LocalizacaoFactory.setLocalizacao(localizacao);
            
            $scope.bairro = localizacao.bairro;
            $scope.cidade = localizacao.cidade;
            $scope.locais = localizacao.locais;
            IonicInteraction.hide();
        }, function (error) {
            IonicInteraction.hide();
            IonicInteraction.errMessage(error);
            console.log("Não foi possível obter a localização: " + error.message);
        });
    };
    
    $scope.salvarAvaliacao = function (avaliacaoForm) {
        if (avaliacaoForm.$valid) {
            IonicInteraction.show();    
            
            var avaliacoesRef = $firebaseArray(new Firebase(FBURL).child('avaliacoes').child($scope.servico.id));
            var latLngUsuario = $localStorage.latLng.toString().replace("(", "").replace(")", "").split(',', 2);
            var avaliacao = {};

            avaliacao.data = Date();
            avaliacao.nota = $scope.model.nota;
            avaliacao.detalhe = $scope.model.detalhe;
            avaliacao.perfil = $localStorage.usuario.id;
            avaliacao.lat = parseFloat(latLngUsuario[0]);
            avaliacao.lng = parseFloat(latLngUsuario[1]);
            avaliacao.cidade = $localStorage.cidade.id_firebase;
            avaliacao.bairro = $localStorage.bairro.id_firebase;
            console.log($localStorage.bairro);

            avaliacoesRef.$add(avaliacao).then(function (avaliacao) {
                updateMediaCidade($scope.servico.id, $localStorage.cidade.id_firebase).then(function () {
                    updateMediaBairro($scope.servico.id, $localStorage.bairro.id_firebase).then(function () {
                        IonicInteraction.hide();
                        IonicInteraction.alertshow("Avaliação Registrada com Sucesso!");
                        $state.go('menu.avaliacao.finalizar');
                        console.log("Avaliação criada: " + avaliacao.key());
                    }, function (error) {
                        IonicInteraction.hide();
                        IonicInteraction.errMessage(error);
                        console.log("Não foi possível atualizar a média do bairro: " + error.message);
                    });
                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.errMessage(error);
                    console.log("Não foi possível atualizar a média da cidade: " + error.message);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log("Não foi possível registrar a avaliação: " + error.message);
            });
        }
    };
    
    function updateMediaBairro(servico, bairro) {
        var avaliacoesRef = new Firebase(FBURL).child('avaliacoes').child(servico);
        var bairroRef = new Firebase(FBURL).child('bairros').child(bairro).child('medias').child(servico);
        
        var avaliacoesArray = $firebaseArray(avaliacoesRef.orderByChild("bairro").equalTo(bairro));
        
        var soma = 0;
        var mediaAvaliacoes = 0;
        var totalAvaliacoesBairro = 0;
        var detalhe = {};
        var detalhes = {};
        var mediaBairro = {};
        
        return new Promise(function (resolve, reject) {
            avaliacoesArray.$loaded().then(function (avaliacoes) {
                totalAvaliacoesBairro = avaliacoesArray.length;
                
                avaliacoes.forEach(function (avaliacao) {
                    if (angular.isUndefined(detalhes[avaliacao.detalhe])) {
                        detalhes[avaliacao.detalhe] = 1;
                    } else {
                        detalhes[avaliacao.detalhe] += 1;
                    }
                    
                    soma += parseInt(avaliacao.nota);
                });

               //Definir o detalhe mais escolhido: 
               detalhe.id = Object.keys(detalhes).reduce(function(a, b){ return detalhes[a] > detalhes[b] ? a : b; });
               detalhe.descricao = Object.keys(detalhes).reduce(function(m, k){ return detalhes[k] > m ? detalhes[k] : m; }, -Infinity);

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesBairro);

                mediaBairro.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaBairro.detalhe = detalhe.id;

                bairroRef.update(mediaBairro, onComplete);

                resolve();
            }, function (errorObject) {
                reject(errorObject);
            });
        });
    }

    function updateMediaCidade(servico, cidade) {
        var avaliacoesRef = new Firebase(FBURL).child('avaliacoes').child(servico);        
        var cidadeRef = new Firebase(FBURL).child('cidades').child(cidade).child('medias').child(servico);
        
        var avaliacoesArray = $firebaseArray(avaliacoesRef.orderByChild("cidade").equalTo(cidade));

        var soma = 0;
        var mediaAvaliacoes = 0;
        var totalAvaliacoesCidade = 0;
        var detalhe = {};
        var detalhes = {};
        var mediaCidade = {};

        return new Promise(function (resolve, reject) {
            avaliacoesArray.$loaded().then(function (avaliacoes) {
                avaliacoes.forEach(function (avaliacao) {
                    if (angular.isUndefined(detalhes[avaliacao.detalhe])) {
                        detalhes[avaliacao.detalhe] = 1;
                    } else {
                        detalhes[avaliacao.detalhe] += 1;
                    }

                    soma += parseInt(avaliacao.nota);
                    totalAvaliacoesCidade += 1;
                });

                //Definir o detalhe mais ecolhido: 
                detalhe.id = Object.keys(detalhes).reduce(function (a, b) { return detalhes[a] > detalhes[b] ? a : b; });
                detalhe.nome = Object.keys(detalhes).reduce(function (m, k) { return detalhes[k] > m ? detalhes[k] : m; }, -Infinity);

                //Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesCidade);

                mediaCidade.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaCidade.detalhe = detalhe.id;

                cidadeRef.update(mediaCidade, onComplete);

                resolve();
            }, function (errorObject) {
                reject(errorObject);
            });
        });
    }
      
    function onComplete(error) {
        if (error) {
            IonicInteraction.errMessage(error);
            console.log('Erro ao Sincronizar: ' + error.message);
        } else {
            console.log('Sincronização concluída.');
        }
    }
})

.controller('conclusaoCtrl', function () {
    
})

.controller('mapasCtrl', function (FBURL, IonicModal, MapaService, $firebaseArray, $scope, $state) {
    IonicModal.gerarModal('templates/modals/selecionarservico.html', $scope);
    
    $scope.$on('$ionicView.enter', function () {
        $scope.servicos = $firebaseArray(new Firebase(FBURL).child('servicos'));
        
        if(angular.isUndefined(MapaService.getTipoMapa())){
            $state.go('menu.mapa');
        }
    });
    
    $scope.mapaAvaliacao = function () {
         MapaService.setTipoMapa('Avaliações');
    };
    
    $scope.mapaMedia = function () {
         MapaService.setTipoMapa('Médias');
         $state.go('menu.mapa.media');
    };

    $scope.definirTipoLocal = function (tipoLocal) {
        MapaService.setTipoLocal(tipoLocal);
    };
     
    $scope.definirServico = function (servico) {
        MapaService.setServico(servico);
        $state.go('menu.mapa.visualizar');
    }
})

.controller('mapaCtrl', function(FBURL, LocalizacaoFactory, IonicInteraction, $firebaseArray, $localStorage, MapaService, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        IonicInteraction.show();
        
        $scope.servico = MapaService.getServico();
        $scope.tipoLocal = MapaService.getTipoLocal();
        $scope.tipoMapa = MapaService.getTipoMapa();        
        
        // Mapa de Avaliações
        if ($scope.tipoMapa == 'Avaliações') {
            putMapa();
            putAvaliacoes($scope.servico).then(function () {
                IonicInteraction.hide();
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log(error.message);
            }); 
        // Mapa de Médias        
        } else if ($scope.tipoMapa == 'Médias') {
                putMapa();
                putMedias($scope.tipoLocal, $scope.servico).then(function () {
                    IonicInteraction.hide();
                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.errMessage(error);
                    console.log(error.message);
                });    
        } else {
            $state.go('menu.avaliacao');
        }
    });
    
    $scope.ondeEstou = function () {
        if (!$scope.map) {
            return;
        } else {
            IonicInteraction.show();
            LocalizacaoFactory.getLocalizacao().then(function (localizacao) {
                $scope.map.setCenter(localizacao.latLng);
                
                IonicInteraction.hide();
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log("Não foi possível obter a localização: " + error.message);
            });
        }
    };
    
    function putMapa() {
        $scope.map = new google.maps.Map(document.getElementById('map'), {center: {lat: -34.397, lng: 150.644}, zoom: 15, mapTypeId: google.maps.MapTypeId.ROADMAP});
        $scope.map.setCenter($localStorage.latLng);
        $scope.infoWindow = new google.maps.InfoWindow;
    }
    
    function putAvaliacoes(servico) {
        return new Promise(function (resolve, reject) {
            carregarAvaliacoes(servico).then(function (avaliacoes) {
                putHeatMap(avaliacoes);
                resolve();
            }, function (error) {
                reject(error);
            });
        });
    }
    
    function putMedias(tipo, servico) {
        return new Promise(function (resolve, reject) {
            if (tipo == "cidade") {
                carregarCidades(servico).then(function (cidades) {
                    putFronteiras(cidades);
                    resolve();
                }, function (error) {
                    reject(error);
                });
            } else if (tipo == "bairro") {
                carregarBairros(servico).then(function (bairros) {
                    putFronteiras(bairros);
                    resolve();
                }, function (error) {
                    reject(error);
                });
            } else {
                reject("O tipo de local não foi definido.");
            }
        });
    }
    
    function carregarCidades(servico) {
        var cidadesMapa = [];

        var detalhesRef = new Firebase(FBURL).child('servicos').child(servico.$id).child('detalhes');
        var cidadesRef = new Firebase(FBURL).child('cidades');
        var detalhesArray = $firebaseArray(detalhesRef);
        var cidadesArray = $firebaseArray(cidadesRef);

        return new Promise(function (resolve, reject) {
            cidadesArray.$loaded().then(function (cidades) {
                cidades.forEach(function (cidade) {
                    if (angular.isDefined(cidade.medias)) {
                        if (angular.isDefined(cidade.medias[servico.$id])) {
                            var cidadeMapa = {
                                nome: cidade.nome,
                                media: cidade.medias[servico.$id].media,
                                detalhe: detalhesArray.$getRecord(cidade.medias[servico.$id].detalhe).$value,
                                polygon: cidade.polygon,
                                center: {lat: cidade.lat, lng: cidade.lng}
                            };

                            cidadesMapa.push(cidadeMapa);
                        }
                    }
                });

                resolve(cidadesMapa);
            }, function (error) {
                reject(error);
            });
        });
    }
    
    function carregarBairros(servico) {
        var bairrosMapa = [];
        
        var detalhesRef = new Firebase(FBURL).child('servicos').child(servico.$id).child('detalhes');
        var bairrosRef = new Firebase(FBURL).child('bairros');
        var detalhesArray = $firebaseArray(detalhesRef);
        var bairrosArray = $firebaseArray(bairrosRef);

        return new Promise(function (resolve, reject) {
            bairrosArray.$loaded().then(function (bairros) {
                bairros.forEach(function (bairro) {
                    if (angular.isDefined(bairro.medias)) {
                        if (angular.isDefined(bairro.medias[servico.$id])) {
                            var bairroMapa = {
                                nome: bairro.nome,
                                media: bairro.medias[servico.$id].media,
                                detalhe: detalhesArray.$getRecord(bairro.medias[servico.$id].detalhe).$value,
                                polygon: bairro.polygon,
                                center: {lat: bairro.lat, lng: bairro.lng}
                            };

                            bairrosMapa.push(bairroMapa);
                        }
                    }
                });

                resolve(bairrosMapa);
            }, function (error) {
                reject(error);
            });
        });
    }
    
    function carregarAvaliacoes(servico) {
        var avaliacoesMapa = [];
        var avaliacoesRef = new Firebase(FBURL).child('avaliacoes').child(servico.$id);
        var avaliacoesArray = $firebaseArray(avaliacoesRef);
        
        return new Promise(function (resolve, reject) {
            avaliacoesArray.$loaded().then(function (avaliacoes) {
                avaliacoes.forEach(function (avaliacao) {
                    avaliacoesMapa.push(new google.maps.LatLng(avaliacao.lat, avaliacao.lng));
                });

                resolve(avaliacoesMapa);
            }, function (error) {
                reject(error);
            });
        });
    }
    
    function putFronteiras(locais) {
        locais.forEach(function (local) {
            if (local.polygon) {
                var coordenadas = [];

                local.polygon.forEach(function (coordenada) {
                    var ponto = {lat: coordenada.y, lng: coordenada.x};
                    coordenadas.push(ponto);
                });

                var polygon = new google.maps.Polygon({
                    paths: coordenadas,
                    strokeColor: getCor(local.media),
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: getCor(local.media),
                    fillOpacity: 0.35
                });

                polygon.setMap($scope.map);
                addClickHandler(polygon, local);
            }
        });
    }

    function putCirculos(locais) {
        locais.forEach(function (local) {
            cityCircle = new google.maps.Circle({
                strokeColor: getCor(local.media),
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: getCor(local.media),
                fillOpacity: 0.35,
                map: $scope.map,
                center: local.center,
                radius: 500 / Math.sqrt(local.media)
            });

            mapLabel = new MapLabel({
                text: local.media,
                position: new google.maps.LatLng(local.center.lat, local.center.lng),
                map: $scope.map,
                fontSize: 15,
                align: 'center',
                strokeColor: '#FFFFFF',
                fontColor: '#000000',
                minZoom: 15
            });
        });
    }
    
    function putHeatMap(avaliacoes) {
        heatMap = new google.maps.visualization.HeatmapLayer({
            data: avaliacoes,
            map: $scope.map,
            radius: 15
        });
    }
    
    function getCor(media) {
        if (media <= 1.00) {
            return "#FF0000";
        } else if (media >= 1.00 && media <= 2.00) {
            return "#FFA07A";
        } else if (media >= 2.00 && media <= 3.00) {
            return "#FFD700";
        } else if (media >= 3.00 && media <= 4.00) {
            return "#ADFF2F";
        } else if (media >= 4.00 && media <= 5.00) {
            return "#90EE90";
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
})
   
.controller('perfilCtrl', function(FBURL, IonicInteraction, IonicModal, $localStorage, $scope) {
    IonicModal.gerarModal('templates/modals/alterarsenha.html', $scope);
    
    var perfilRef = new Firebase(FBURL).child('perfis').child($localStorage.usuario.id);
    var enderecoRef = new Firebase(FBURL).child('enderecos').child($localStorage.usuario.endereco);
    var configuracaoRef = new Firebase(FBURL).child('configuracoes').child($localStorage.usuario.configuracao);

    $scope.$on('$ionicView.beforeEnter', function () {
        IonicInteraction.show();

        $scope.perfil = {};
        $scope.usuario = {};
        $scope.endereco = {};
        $scope.configuracao = {};

        perfilRef.on("value", function (snapshot) {
            $scope.perfil.nome = snapshot.val().nome;
            $scope.perfil.sobrenome = snapshot.val().sobrenome;
            $scope.usuario.email = snapshot.val().email;

            enderecoRef.on("value", function (snapshot) {
                $scope.endereco.bairro = snapshot.val().bairro;
                $scope.endereco.cidade = snapshot.val().cidade;

                configuracaoRef.on("value", function (snapshot) {
                    $scope.configuracao.email = snapshot.val().email;
                    
                    IonicInteraction.hide();
                });
            });
        });
    });

    $scope.salvar = function (perfilForm) {
        if (perfilForm.$valid) {
            IonicInteraction.show();

            perfilRef.update({nome: $scope.perfil.nome, sobrenome: $scope.perfil.sobrenome}, onComplete);
            enderecoRef.update({bairro: $scope.endereco.bairro, cidade: $scope.endereco.cidade}, onComplete);
            configuracaoRef.update({email: $scope.configuracao.email}, onComplete);

            IonicInteraction.hide();
            IonicInteraction.alertshow("Sucesso", "Seu perfil foi atualizado com sucesso!");
        }
    };

    function onComplete(error) {
        if (error) {
            IonicInteraction.errMessage(error);
            console.log('Erro ao Sincronizar: ' + error.message);
        } else {
            console.log('Sincronização concluída.');
        }
    }
})

.controller('menuCtrl', function(AuthFactory, $localStorage, $location, $scope) {
    $scope.$on('$ionicView.beforeEnter', function(){
        $scope.nome = $localStorage.usuario.nome;
        $scope.email = $localStorage.usuario.email;
        $scope.gravatar = $localStorage.usuario.gravatar;
    });
    
    // Sair:
    $scope.sair = function() {
        AuthFactory.logout();
        console.log("Usuário deslogado!");
        $location.path("/login");
    };
})
      
.controller("loginCtrl", function(AuthFactory, FBURL, IonicInteraction, LocalizacaoFactory, $localStorage, $scope, $state) {
    $scope.usuario = {email: '', password: ''};
  
    $scope.login = function (loginForm) {
        var perfisRef = new Firebase(FBURL).child('perfis');

        if (loginForm.$valid) {
            IonicInteraction.show();

            AuthFactory.login($scope.usuario).then(function (authData) {
                console.log("Authenticated successfully with payload:", authData);

                perfisRef.orderByChild("id_firebase").equalTo(authData.uid).on("child_added", function (perfil) {
                    $localStorage.usuario = perfil.val();
                    $localStorage.usuario.id = perfil.key();                    
                });
                
                LocalizacaoFactory.getLocalizacao().then(function (localizacao) {
                    LocalizacaoFactory.setLocalizacao(localizacao);
                    console.log("Geolozalização Apache Cordova: " + $localStorage.latLng.toString());
                    console.log($localStorage.cidade.title + "/" + $localStorage.bairro.title);                    

                    IonicInteraction.hide();
                    $state.go('menu.avaliacao');
                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.errMessage(error);
                    console.log("Não foi possível obter a localização: " + error.message);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log("Não foi possível efetuar a autenticação: " + error.message);
            });
        }
    };
    
    // Método para login através de alguma rede social:
    $scope.loginProvider = function (provider) {
        AuthFactory.loginProvider(provider).then(function (authData) {
            console.log('Usuário Logado!', authData);
            $state.go('menu.avaliacao.avaliar');
        }).catch(function (error) {
            if (error.code === "TRANSPORT_UNAVAILABLE") {
                AuthFactory.$authWithOAuthPopup(provider).then(function (authData) {
                    console.log('Usuário Logado!', authData);
                    $state.go('menu.avaliacao.avaliar');
                });
            } else {
                console.log(error);
            }
        });
    };
})

.controller("cadastroCtrl", function(AuthFactory, IonicInteraction, $location, $scope) {
    $scope.usuario = {email: '', password: ''};
    $scope.perfil = {nome: '', sobrenome: ''};
    $scope.endereco = {bairro: '', cidade: ''};
    $scope.configuracao = {email: true};
    
    $scope.cadastrar = function (loginForm) {
        if (loginForm.$valid) {
            IonicInteraction.show();

            AuthFactory.criarUsuario($scope.usuario).then(function (userData) {
                AuthFactory.criarPerfil(userData.uid, $scope.usuario, $scope.perfil, $scope.endereco, $scope.configuracao).then(function () {
                    IonicInteraction.hide();
                    IonicInteraction.alertshow("Sucesso", "Seu perfil foi criado com sucesso!");
                    $location.path('/');
                }, function (err) {
                    IonicInteraction.hide();
                    IonicInteraction.errMessage(err);
                });
            }, function (err) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(err);
            });
        }
    };  
})

.controller('servicoIndexCtrl', function (FBURL, IonicInteraction, ServicoService, $firebaseArray, $scope, $state) {
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.servicos = $firebaseArray(new Firebase(FBURL).child('servicos'));
    });

    $scope.definirServico = function (servico) {
        ServicoService.setServico(servico);
        $state.go('menu.servico.editar');
    };
})

.controller('servicoCtrl', function(FBURL, IonicInteraction, ServicoService, $firebaseArray, $scope) {
    $scope.$on('$ionicView.beforeEnter', function () {
        if (angular.isDefined(ServicoService.getServico())) {
            $scope.servico = ServicoService.getServico();
            $scope.inputs = [];
            
            ServicoService.setServico();
            angular.forEach($scope.servico.detalhes, function(detalhe, chave) {
                $scope.inputs.push({id: chave, value: detalhe});
            });
        } else {
            $scope.servico = {
                nome: '',
                descricao: '',
                imagem: '',
                disponibilidade: true
            };
            $scope.inputs = [{value: null}];
        }
    });
    
    $scope.cadastrar = function (servicoForm) {
        var servicosRef = $firebaseArray(new Firebase(FBURL).child('servicos'));
        
        if (servicoForm.$valid) {
            IonicInteraction.show();

            servicosRef.$add($scope.servico).then(function (servico) {
                console.log("Serviço Criado: " + servico.key());

                putDetalhes($scope.inputs, servico).then(function () {
                    IonicInteraction.hide();
                    IonicInteraction.alertshow("Sucesso", "Serviço cadastrado com sucesso!");

                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.errMessage(error);
                    console.log("Não foi possível adicionar os detalhes: " + error.message);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.errMessage(error);
                console.log("Não foi possível adicionar o serviço: " + error.message);
            });
        }
    };
    
    $scope.salvar = function (servicoForm) {
        var servicoRef = new Firebase(FBURL).child('servicos').child($scope.servico.$id);        
        
        if (servicoForm.$valid) {
            IonicInteraction.show();
            
            servicoRef.update({nome: $scope.servico.nome, descricao: $scope.servico.descricao, imagem: $scope.servico.imagem, disponibilidade: $scope.servico.disponibilidade}, onComplete);
        
            angular.forEach($scope.inputs, function (detalhe) {
                if (angular.isUndefined(detalhe.id)) {
                    var detalhesServicoRef = servicoRef.child('detalhes');
                    var detalhesServicoArray = $firebaseArray(detalhesServicoRef);                    
                    
                    detalhesServicoArray.$add(detalhe.value);
                } else {
                    var detalheRef = servicoRef.child('detalhes').child(detalhe.id);
                    
                    detalheRef.set(detalhe.value, onComplete);
                }
            });
            
            IonicInteraction.hide();
            IonicInteraction.alertshow("Sucesso", "Serviço atualizado com sucesso!");
        }
    }

    $scope.addInput = function () {
        $scope.inputs.push({value: null});
    };

    $scope.removeInput = function (index) {
        $scope.inputs.splice(index, 1);
    };
    
    function putDetalhes(detalhes, servico) {
        var detalhesServicoRef = servico.child('detalhes');
        var detalhesServicoArray = $firebaseArray(detalhesServicoRef);
        var last = Object.keys(detalhes)[Object.keys(detalhes).length - 1];

        return new Promise(function (resolve, reject) {
            detalhes.forEach(function (detalhe, i) {
                detalhesServicoArray.$add(detalhe.value).then(function () {
                    if (last == i) {
                        detalhesServicoRef.update({ default: 'Sem crítica relevante.' });
                        resolve(); 
                    }
                }, function (error) {
                    reject(error);
                });
            });
        });
    }
    
   function onComplete(error) {
        if (error) {
            IonicInteraction.errMessage(error);
            console.log('Erro ao Sincronizar: ' + error.message);
        } else {
            console.log('Sincronização concluída.');
        }
    }
})

.controller('firebaseCtrl', function(FBURL, $firebaseArray, $firebaseObject, $scope) {
    var firebaseRef = new Firebase(FBURL);
  
    // Métodos Firebase:
    // Primeiros a serem chamados para fazer a referência para o banco.
    // 
    // .child() Retorna a chave informada por parâmetro, usado para acessar os nós e navegar pelo banco.
    
    // Metódos de Query do Firebase:
    // São chamados logos após os métodos do Firebase.
    // 
    // orderByChild() Ordenação por nós filhos.
    // equalTo() Filtro que retorna o objeto informado por parâmetro.
    // 
    // Após definir os metódos acima e montar as querys, chamamos os metódos abaixo de acordo com a necessidade:
    // 
    // on() Fica escutando qualquer nó, executando o laço dependendo do tipo de evento passado como parâmetro.
    // off() Faz o metodo on() parar de escutar o nó.
    // once() Lê o nó somente no momento da excução da função Executa o on() e depois o off().
    
    // Para os métodos on(), off() e once(), são passados Tipos de Eventos:
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
    };
    
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
    };
    
    $scope.child_added = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Beira Mar');
        $scope.avls.on("child_added", function (snapshot) {
            console.log(snapshot.val());
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    };
    
    $scope.value = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Beira Mar');
        $scope.avls.on("value", function (snapshot) {
            console.log(snapshot.val());
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    };
    
    $scope.range = function () {
        $scope.avls = firebaseRef.child('avaliacoes').child('saude').child('Duque de Caxias').child('Parque Beira Mar');
        $scope.avls.orderByChild("perfil").startAt('Anderson').endAt('Anderson').on("child_added", function (snapshot) {
            console.log(snapshot.key());
            console.log(snapshot.val());
        });
    };
    
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
                console.log(snapshot.key());
                console.log(snapshot.val());
            });
        }
    };
    
    // Usando $firebaseArray e $firebaseObject (Biblioteca AngularFire)
    // Úteis para fazer binding de componentes com o $scope.
    
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