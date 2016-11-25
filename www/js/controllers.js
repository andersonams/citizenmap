'Use Strict';
angular.module('citizenmap.controllers', [])
  
.controller('avaliacaoIndexCtrl', function (AvaliacaoService, FBURL, IonicInteraction, $firebaseArray, $localStorage, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        IonicInteraction.show();
        
        definirServicosView().then(function (servicosView) {
            $scope.servicosView = servicosView;
            
            definirServicosAvaliaveis(servicosView).then(function () {
                IonicInteraction.hide();
                
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }, function (error) {
            IonicInteraction.hide();
            IonicInteraction.alertError(error);
            console.error(error);
        });
    });
    
    $scope.definirServico = function (servico) {
        AvaliacaoService.setServico(servico);
        $state.go('menu.avaliacao.avaliar');
    }
    
    function definirServicosView() {
        var servicosRef;
        var servicosView = [];
        
        servicosRef = new Firebase(FBURL).child('servicos').orderByChild("disponibilidade").equalTo(true);
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
            if ($localStorage.usuario.tipo == 'cmn') {
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

.controller('avaliacaoAvaliarCtrl', function(AvaliacaoService, FBURL, LocalizacaoFactory, IonicInteraction, $firebaseArray, $localStorage, $scope, $state) {
    IonicInteraction.gerarModal('alterarlocalizacao', 'templates/modals/alterarlocalizacao.html', $scope);
    IonicInteraction.gerarRatings($scope);
    
    $scope.$on('$ionicView.enter', function () {
        if (angular.isDefined(AvaliacaoService.getServico())) {
            IonicInteraction.show();

            $scope.servico = AvaliacaoService.getServico();
            $scope.model = {detalhe: 0, nota: 1};

            // Limpar serviço:
            AvaliacaoService.setServico();

            LocalizacaoFactory.getLocalizacao().then(function (localizacao) {
                LocalizacaoFactory.setLocalizacao(localizacao);

                $scope.bairro = localizacao.bairro;
                $scope.cidade = localizacao.cidade;
                $scope.locais = localizacao.locais;
                IonicInteraction.hide();
            }, function (error) {
                $state.go('menu.avaliacao');
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        } else {
            $state.go('menu.avaliacao')
        }
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
            IonicInteraction.alertError(error);
            console.error(error);
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

            avaliacoesRef.$add(avaliacao).then(function (avaliacao) {
                updateMediaCidade($scope.servico.id, $localStorage.cidade.id_firebase).then(function () {
                    updateMediaBairro($scope.servico.id, $localStorage.bairro.id_firebase).then(function () {
                        $state.go('menu.avaliacao.finalizar');
                        IonicInteraction.hide();
                        IonicInteraction.alert("Sucesso", "Avaliação registrada com sucesso!");
                        console.log("Avaliação criada: " + avaliacao.key());
                    }, function (error) {
                        $state.go('menu.avaliacao');
                        IonicInteraction.hide();
                        IonicInteraction.alertError(error);
                        console.error(error);
                    });
                }, function (error) {
                    $state.go('menu.avaliacao');
                    IonicInteraction.hide();
                    IonicInteraction.alertError(error);
                    console.error(error);
                });
            }, function (error) {
                $state.go('menu.avaliacao');
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
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

               // Definir o detalhe mais escolhido: 
               detalhe.id = Object.keys(detalhes).reduce(function(a, b){ return detalhes[a] > detalhes[b] ? a : b; });
               detalhe.descricao = Object.keys(detalhes).reduce(function(m, k){ return detalhes[k] > m ? detalhes[k] : m; }, -Infinity);

                // Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesBairro);

                mediaBairro.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaBairro.detalhe = detalhe.id;

                bairroRef.update(mediaBairro).then(function () {
                    resolve();
                }, function (error) {
                    reject(error);
                });
            }, function (error) {
                reject(error);
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

                // Definir o detalhe mais ecolhido: 
                detalhe.id = Object.keys(detalhes).reduce(function (a, b) { return detalhes[a] > detalhes[b] ? a : b; });
                detalhe.nome = Object.keys(detalhes).reduce(function (m, k) { return detalhes[k] > m ? detalhes[k] : m; }, -Infinity);

                // Calcular a média:
                mediaAvaliacoes = parseInt(soma) / parseInt(totalAvaliacoesCidade);

                mediaCidade.media = parseFloat(mediaAvaliacoes.toFixed(2));
                mediaCidade.detalhe = detalhe.id;

                cidadeRef.update(mediaCidade).then(function () {
                    resolve();
                }, function (error) {
                    reject(error);
                });
            }, function (error) {
                reject(error);
            });
        });
    }
})

.controller('avaliacaoFinalizarCtrl', function () {
    
})

.controller('mapaIndexCtrl', function (FBURL, IonicInteraction, MapaService, $firebaseArray, $scope, $state) {
    IonicInteraction.gerarModal('selecionarservico', 'templates/modals/selecionarservico.html', $scope);
    
    $scope.$on('$ionicView.enter', function () {
        $scope.servicos = $firebaseArray(new Firebase(FBURL).child('servicos'));
    });
    
    $scope.definirTipoMapa = function (tipoMapa) {
        MapaService.setTipoMapa(tipoMapa);
    };
     
    $scope.definirServico = function (servico) {
        MapaService.setServico(servico);
        $state.go('menu.mapa.visualizar');
    };
    
    $scope.mapaMedia = function () {
        $state.go('menu.mapa.media');
    };
})

.controller('mapaMediaCtrl', function (FBURL, IonicInteraction, MapaService, $firebaseArray, $scope, $state) {
    IonicInteraction.gerarModal('selecionarservico', 'templates/modals/selecionarservico.html', $scope);
    
    $scope.$on('$ionicView.enter', function () {
        if (angular.isDefined(MapaService.getTipoMapa())) {
            $scope.servicos = $firebaseArray(new Firebase(FBURL).child('servicos'));
        } else {
            $state.go('menu.mapa');
        }
    });

    $scope.definirTipoLocal = function (tipoLocal) {
        MapaService.setTipoLocal(tipoLocal);
    };
     
    $scope.definirServico = function (servico) {
        MapaService.setServico(servico);
        $state.go('menu.mapa.visualizar');
    };
})

.controller('mapaVisualizarCtrl', function(FBURL, LocalizacaoFactory, IonicInteraction, MapaService, $firebaseArray, $localStorage, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        $scope.servico = MapaService.getServico();
        $scope.tipoLocal = MapaService.getTipoLocal();
        $scope.tipoMapa = MapaService.getTipoMapa();        
        
        // Mapa de Avaliações
        if ($scope.tipoMapa == 'Avaliações') {
            IonicInteraction.show();
            putMapa();
            putAvaliacoes($scope.servico).then(function () {
                IonicInteraction.hide();

            }, function (error) {
                $state.go('menu.avaliacao');
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        // Mapa de Médias
        } else if ($scope.tipoMapa == 'Médias') {
            IonicInteraction.show();
            putMapa();
            putMedias($scope.tipoLocal, $scope.servico).then(function () {
                IonicInteraction.hide();

            }, function (error) {
                $state.go('menu.avaliacao');
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        } else {
            $state.go('menu.mapa');
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
                IonicInteraction.alertError(error);
                console.error(error);
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
                reject(new Error("O tipo de local não foi definido."));
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
            radius: 10
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
            return "#00FF00";
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
   
.controller('perfilCtrl', function(AuthFactory, FBURL, IonicInteraction, $localStorage, $scope, $state) {
    var perfilRef = new Firebase(FBURL).child('perfis').child($localStorage.usuario.id);
    var enderecoRef = new Firebase(FBURL).child('enderecos').child($localStorage.usuario.endereco);
    var configuracaoRef = new Firebase(FBURL).child('configuracoes').child($localStorage.usuario.configuracao);
    
    IonicInteraction.gerarModal('alterarsenha', 'templates/modals/alterarsenha.html', $scope);
    IonicInteraction.gerarModal('excluirconta', 'templates/modals/excluirconta.html', $scope);

    $scope.$on('$ionicView.enter', function () {
        IonicInteraction.show();

        $scope.perfil = {};
        $scope.usuario = {};
        $scope.endereco = {};
        $scope.configuracao = {};
        $scope.changePassword = {oldPassword: '', newPassword: ''};      
        
        perfilRef.once("value").then(function (snapshot) {
            $scope.perfil.nome = snapshot.val().nome;
            $scope.perfil.sobrenome = snapshot.val().sobrenome;
            $scope.usuario.email = snapshot.val().email;

            enderecoRef.once("value").then(function (snapshot) {
                $scope.endereco.bairro = snapshot.val().bairro;
                $scope.endereco.cidade = snapshot.val().cidade;

                configuracaoRef.once("value").then(function (snapshot) {
                    $scope.configuracao.email = snapshot.val().email;

                    IonicInteraction.hide();
                }, function (error) {
                    $state.go('menu.avaliacao');
                    IonicInteraction.hide();
                    IonicInteraction.alertError(error);
                    console.error(error);
                });
            }, function (error) {
                $state.go('menu.avaliacao');
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }, function (error) {
            $state.go('menu.avaliacao');
            IonicInteraction.hide();
            IonicInteraction.alertError(error);
            console.error(error);
        });
    });
    
    $scope.alterarSenha = function (senhaForm) {
        if (senhaForm.$valid) {
            IonicInteraction.show();

            AuthFactory.changePassword({email: $scope.usuario.email, oldPassword: $scope.changePassword.oldPassword, newPassword: $scope.changePassword.newPassword}).then(function () {
                IonicInteraction.hide();
                IonicInteraction.alert("Sucesso", "Senha alterada com sucesso!");

            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
    };
    
    $scope.excluirConta = function (contaForm) {
        if (contaForm.$valid) {
            IonicInteraction.show();
            
            AuthFactory.removeUser({email: $scope.usuario.email, password: $scope.changePassword.oldPassword}).then(function () {
                $state.go('entrada');
                IonicInteraction.hide();
                IonicInteraction.alert("Sucesso", "Conta excluída com sucesso!");

            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
    }

    $scope.salvar = function (perfilForm) {
        if (perfilForm.$valid) {
            IonicInteraction.show();

            perfilRef.update({nome: $scope.perfil.nome, sobrenome: $scope.perfil.sobrenome}).then(function () {
                enderecoRef.update({bairro: $scope.endereco.bairro, cidade: $scope.endereco.cidade}).then(function () {
                    configuracaoRef.update({email: $scope.configuracao.email}).then(function () {
                        IonicInteraction.hide();
                        IonicInteraction.alert("Sucesso", "Seu perfil foi atualizado com sucesso!");

                    }, function (error) {
                        IonicInteraction.hide();
                        IonicInteraction.alertError(error);
                        console.error(error);
                    });
                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.alertError(error);
                    console.error(error);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
    };
})

.controller('menuCtrl', function(AuthFactory, $localStorage, $scope, $state) {
    $scope.$on('$ionicView.enter', function(){
        $scope.nome = $localStorage.usuario.nome;
        $scope.email = $localStorage.usuario.email;
        $scope.gravatar = $localStorage.usuario.gravatar;
    });
    
    // Sair:
    $scope.sair = function() {
        AuthFactory.logout();
        $state.go('login');    
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
                    IonicInteraction.alertError(error);
                    console.error(error);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
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
                    $state.go('menu.avaliacao');
                });
            } else {
                console.error(error);
            }
        });
    };
    
    $scope.resetPassword = function (senhaForm) {
        if (senhaForm.$valid) {
            IonicInteraction.show();

            AuthFactory.resetPassword({email: $scope.usuario.email}).then(function () {
                $state.go('login');
                IonicInteraction.hide();
                IonicInteraction.alert("Sucesso", "E-mail de redefinição de senha enviado com sucesso!")
                
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
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
                    IonicInteraction.alert("Sucesso", "Seu perfil foi criado com sucesso!");
                    $location.path('/');
                }, function (error) {
                    IonicInteraction.hide();
                    IonicInteraction.alertError(error);
                });
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
            });
        }
    };  
})

.controller('servicoIndexCtrl', function (FBURL, ServicoService, $firebaseArray, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        $scope.servicos = $firebaseArray(new Firebase(FBURL).child('servicos'));
    });

    $scope.definirServico = function (servico) {
        ServicoService.setServico(servico);
        $state.go('menu.servico.editar');
    };
})

.controller('servicoCadastrarCtrl', function (FBURL, IonicInteraction, $firebaseArray, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        $scope.servico = {
            nome: '',
            descricao: '',
            imagem: '',
            disponibilidade: true,
            detalhes: {}
        };
        $scope.inputs = [{value: 'Sem crítica relevante.'}];
    });
    
    $scope.cadastrar = function (servicoForm) {
        var servicosRef = $firebaseArray(new Firebase(FBURL).child('servicos'));

        if (servicoForm.$valid) {
            IonicInteraction.show();

            angular.forEach($scope.inputs, function (detalhe, chave) {
                $scope.servico.detalhes[chave] = detalhe.value;
            });
            
            servicosRef.$add($scope.servico).then(function (servico) {
                console.log("Serviço Criado: " + servico.key());
                IonicInteraction.hide();
                IonicInteraction.alert("Sucesso", "Serviço cadastrado com sucesso!");
                $state.go('menu.servico');
                
            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
    };
    
    $scope.addInput = function () {
        $scope.inputs.push({value: null});
    };

    $scope.removeInput = function (index) {
        $scope.inputs.splice(index, 1);
    };
})

.controller('servicoEditarCtrl', function(FBURL, IonicInteraction, ServicoService, $firebaseArray, $scope, $state) {
    $scope.$on('$ionicView.enter', function () {
        if (angular.isDefined(ServicoService.getServico())) {
            $scope.servico = ServicoService.getServico();
            $scope.inputs = [];
            
            angular.forEach($scope.servico.detalhes, function(detalhe) {
                $scope.inputs.push({value: detalhe});
            });
            
            // Limpar serviço:
            ServicoService.setServico();
        } else {
            $state.go('menu.servico');
        }
    });
    
    $scope.salvar = function (servicoForm) {
        var servicoRef = new Firebase(FBURL).child('servicos').child($scope.servico.$id);

        if (servicoForm.$valid) {
            IonicInteraction.show();
            
            angular.forEach($scope.inputs, function (detalhe, chave) {
                $scope.servico.detalhes[chave] = detalhe.value;
            });

            servicoRef.update({nome: $scope.servico.nome, descricao: $scope.servico.descricao, imagem: $scope.servico.imagem, disponibilidade: $scope.servico.disponibilidade, detalhes: $scope.servico.detalhes}).then(function () {
                IonicInteraction.hide();
                IonicInteraction.alert("Sucesso", "Serviço atualizado com sucesso!");

            }, function (error) {
                IonicInteraction.hide();
                IonicInteraction.alertError(error);
                console.error(error);
            });
        }
    }

    $scope.addInput = function () {
        $scope.inputs.push({value: null});
    };

    $scope.removeInput = function (index) {
        $scope.inputs.splice(index, 1);
    };
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
                                console.log(avl.val());
                                console.log(avl.numChildren());
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
        console.error(error);
    });
});