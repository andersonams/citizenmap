angular.module('citizenmap.factories', [])

.factory('AuthFactory', function (FBURL, Gravatar, $firebaseAuth, $firebaseArray, $firebaseObject, $timeout) {
    var rootRef = new Firebase(FBURL);
    var auth = $firebaseAuth(rootRef);
    
    var Auth = {
        session: {},
        // Criação do Usuário:
        criarUsuario: function(usuario) {
            return auth.$createUser({email: usuario.email, password: usuario.password});
        },
        // Criação do Perfil:
        criarPerfil: function (uid, usuario, perfil, endereco, configuracao) {
            perfil.id_firebase = uid;
            perfil.email = usuario.email;
            perfil.gravatar = Gravatar.gerarGravatar(usuario.email, 40);
            perfil.data_registro = Date();
            perfil.tipo = 'cmn';

            var perfisRef = $firebaseArray(rootRef.child('perfis'));
            var enderecosRef = $firebaseArray(rootRef.child('enderecos'));
            var configuracoesRef = $firebaseArray(rootRef.child('configuracoes'));

            // Usuário:
            return perfisRef.$add(perfil).then(function (perfilRef) {
                endereco.perfil = perfilRef.key();
                configuracao.perfil = perfilRef.key();

                // Endereço:
                enderecosRef.$add(endereco).then(function (enderecoRef) {
                    perfilRef.child('endereco').set(enderecoRef.key());

                    // Configuração
                    configuracoesRef.$add(configuracao).then(function (configuracaoRef) {
                        perfilRef.child('configuracao').set(configuracaoRef.key());
                    });
                });
            });
        },
        // Alterar Senha:
        changePassword: function(credenciais) {
            return auth.$changePassword(credenciais);
        },
        // Recuperar Senha:
        resetPassword: function(credenciais) {
            return auth.$resetPassword(credenciais);
        },
        // Excluir Conta:
        removeUser: function(credenciais) {
            return auth.$removeUser(credenciais);
        },
        // Login Comum:
        login: function(usuario) {
            return auth.$authWithPassword({email: usuario.email, password: usuario.password});
        }, 
        // Login Rede Social:
        loginProvider: function (provider) {
            return auth.$authWithOAuthPopup(provider);
        },
        // Logout:
        logout: function () {
            return auth.$unauth();
        },
        // Wrap com a função $onAuth com $timeout para ser processado no loop:
        onAuth: function onLoggedIn(callback) {
            auth.$onAuth(function (authData) {
                $timeout(function () {
                    callback(authData);
                });
            });
        },
    };
    
    // Quando declarado, o $onAuth é executado cada vez que o estado do objeto de autenticação é alterado, mudando a Auth.session, usado para validar a sessão:
    auth.$onAuth(function (authData) {
        if (authData) {
            angular.copy(authData, Auth.session);
            Auth.session.perfil = $firebaseObject(rootRef.child('perfis').orderByChild("id_firebase").equalTo(authData.uid));
        } else {
            if (Auth.usuario && Auth.session.perfil) {
                Auth.session.perfil.$destroy();
            }
            angular.copy({}, Auth.session);
        }
    });
    
    return Auth;
})

.factory('LocalizacaoFactory', function (FBURL, $cordovaGeolocation, $firebaseArray, $firebaseObject, $localStorage, $q) {
    var apiKey = "70F1CCA2-54898CF0-837A03C8-CED3AA09-FE7D605E-5D5E3474-DA76638B-471DF940";
    var categorias = {bairro: 4621, cidade: 88};
    
    function obterCoordenadas() {
        var deferred = $q.defer();
        var options = {timeout: 10000, enableHighAccuracy: true};

        $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
            var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            deferred.resolve(latLng);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function obterLocalizacaoGoogle(latLng) {
        var latLngStr;
        var deferred = $q.defer();
        var geocoder = new google.maps.Geocoder;
        var input;

        input = latLng.toString().slice(1, -1);
        latLngStr = input.split(',', 2);
        latLng = {lat: parseFloat(latLngStr[0]), lng: parseFloat(latLngStr[1])};

        geocoder.geocode({'location': latLng}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results) {
                    var localizacao = [];
                    var data = [];
                    var i = [];

                    angular.forEach(results, function (componente) {
                        if (i[componente.types.join(' ')]) {
                            i[componente.types.join(' ')] += 1;
                        } else {
                            i[componente.types.join(' ')] = 1;
                        }

                        data[componente.types.join(' ') + " (" + i[componente.types.join(' ')] + ")"] = componente;
                    });

                    var latLngBairro = data['political sublocality sublocality_level_1 (1)'].geometry.location.toString().replace("(", "").replace(")", "").split(',', 2);
                    var latLngCidade = data['locality political (1)'].geometry.location.toString().replace("(", "").replace(")", "").split(',', 2);

                    localizacao["bairro"] = {
                        nome: data['political sublocality sublocality_level_1 (1)']['address_components'][0].long_name,
                        lat: parseFloat(latLngBairro[0]),
                        lng: parseFloat(latLngBairro[1])
                    };

                    localizacao["cidade"] = {
                        nome: data['locality political (1)']['address_components'][0].long_name,
                        lat: parseFloat(latLngCidade[0]),
                        lng: parseFloat(latLngCidade[1])
                    };

                    deferred.resolve(localizacao);
                } else {
                    deferred.reject("Não há resultados com as coordenadas atuais.");
                }
            } else {
                deferred.reject(status);
            }
        });
        return deferred.promise;
    }

    function obterLocalizacaoWikiMapia(latLng) {
        latLng = latLng.toString().replace("(", "").replace(")", "").split(',', 2);
        var localizacao = [];

        return new Promise(function (resolve, reject) {
            get("http://api.wikimapia.org/?key=" + apiKey + "&function=place.search&q=&lat=" + latLng[0] + "&lon=" + latLng[1] + "&format=json&pack=&language=pt&page=1&count=10&category=" + categorias.bairro + "&categories_or=&categories_and=&distance=").then(function (response) {
                localizacao.bairro = response.places[0];
                localizacao.locais = response.places;

                get("http://api.wikimapia.org/?key=" + apiKey + "&function=place.getbyid&id=" + response.places[0].location.city_id + "&format=json&pack=&language=pt&data_blocks=main%2Cgeometry%2Clocation%2C").then(function (response) {
                    localizacao.cidade = response;

                    resolve(localizacao);
                }, function (error) {
                    reject(error);
                });
            }, function (error) {
                reject(error);
            });
        });
    }

    function obterLocalizacaoWikiMapiaByID(local) {
        var localizacao = {};

        return new Promise(function (resolve, reject) {
            get("http://api.wikimapia.org/?key=" + apiKey + "&function=place.search&q=&lat=" + local.location.lat + "&lon=" + local.location.lon + "&format=json&pack=&language=pt&page=1&count=10&category=" + categorias.bairro + "&categories_or=&categories_and=&distance=").then(function (response) {
                localizacao.locais = response.places;

                get("http://api.wikimapia.org/?key=" + apiKey + "&function=place.getbyid&id=" + local.id + "&format=json&pack=&language=pt&data_blocks=main%2Cgeometry%2Clocation%2C").then(function (response) {
                    localizacao.bairro = response;

                    get("http://api.wikimapia.org/?key=" + apiKey + "&function=place.getbyid&id=" + localizacao.bairro.location.city_id + "&format=json&pack=&language=pt&data_blocks=main%2Cgeometry%2Clocation%2C").then(function (response) {
                        localizacao.cidade = response;

                        resolve(localizacao);
                    }, function (error) {
                        reject(error);
                    });
                }, function (error) {
                    reject(error);
                });
            }, function (error) {
                reject(error);
            });
        });
    }

    function obterLocalizacaoHTML5() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                return new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            }, function () {
                handleLocationError(true);
            });
        }

        function handleLocationError(browserHasGeolocation) {
            return browserHasGeolocation ? 'Erro: O serviço de geolocalização falhou.' : 'Erro: Seu navegador não suporta geolocalização.';
        }
    }

    function salvarCidade(cidade) {
        var cidadeRef = new Firebase(FBURL).child('cidades');
        var cidadeObject = $firebaseObject(cidadeRef.orderByChild("nome").equalTo(cidade.title));

        return new Promise(function (resolve, reject) {
            cidadeObject.$loaded().then(function (cidadeSnapshot) {
                if (angular.isDefined(cidadeSnapshot.$value)) {
                    var cidadeArray = {
                        nome: cidade.title,
                        lat: cidade.location.lat,
                        lng: cidade.location.lon,
                        polygon: cidade.polygon
                    };

                    cidadeRef = $firebaseArray(cidadeRef);
                    cidadeRef.$add(cidadeArray).then(function (cidadeRef) {
                        resolve(cidadeRef);
                    });
                } else {
                    cidadeRef.orderByChild("nome").equalTo(cidade.title).on("child_added", function (cidadeRef) {
                        resolve(cidadeRef);
                    });
                }
            }, function (error) {
                reject(error);
            });
        });
    }

    function salvarBairro(bairro) {
        var bairroRef = new Firebase(FBURL).child('bairros');
        var bairroObject = $firebaseObject(bairroRef.orderByChild("nome").equalTo(bairro.title));

        return new Promise(function (resolve, reject) {
            bairroObject.$loaded().then(function (bairroSnapshot) {
                if (angular.isDefined(bairroSnapshot.$value)) {
                    var bairroArray = {
                        nome: bairro.title,
                        lat: bairro.location.lat,
                        lng: bairro.location.lon,
                        polygon: bairro.polygon
                    };

                    bairroRef = $firebaseArray(bairroRef);
                    bairroRef.$add(bairroArray).then(function (bairroRef) {
                        resolve(bairroRef);
                    });
                } else {
                    bairroRef.orderByChild("nome").equalTo(bairro.title).on("child_added", function (bairroRef) {
                        resolve(bairroRef);
                    });
                }
            }, function (error) {
                reject(error);
            });
        });
    }

    function get(url) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url);

            req.onload = function () {
                if (req.status == 200) {
                    resolve(JSON.parse(req.responseText));
                } else {
                    reject(Error(req.statusText));
                }
            };

            req.onerror = function () {
                reject(Error("Network Error"));
            };

            req.send();
        });
    }
       
    return {
        getLocalizacao: function () {
            var localizacao = {};

            return new Promise(function (resolve, reject) {
                obterCoordenadas().then(function (latLng) {
                    localizacao.latLng = latLng;

                    obterLocalizacaoWikiMapia(latLng).then(function (localizacaoWikiMapia) {
                        localizacao.bairro = localizacaoWikiMapia.bairro;
                        localizacao.cidade = localizacaoWikiMapia.cidade;
                        localizacao.locais = localizacaoWikiMapia.locais;

                        salvarCidade(localizacao.cidade).then(function (cidade) {
                            localizacao.cidade.id_firebase = cidade.key();

                            salvarBairro(localizacao.bairro).then(function (bairro) {
                                localizacao.bairro.id_firebase = bairro.key();

                                resolve(localizacao);
                            }, function (error) {
                                reject(error);
                            });
                        }, function (error) {
                            reject(error);
                        });
                    }, function (error) {
                        reject(error);
                    });
                }, function (error) {
                    reject(error);
                });
            });
   },
   
        getLocalizacaoByID: function (local) {
            var localizacao = {};

            return new Promise(function (resolve, reject) {
                obterLocalizacaoWikiMapiaByID(local).then(function (localizacaoWikiMapia) {
                    localizacao.bairro = localizacaoWikiMapia.bairro;
                    localizacao.cidade = localizacaoWikiMapia.cidade;
                    localizacao.locais = localizacaoWikiMapia.locais;

                    salvarCidade(localizacao.cidade).then(function (cidade) {
                        localizacao.cidade.id_firebase = cidade.key();

                        salvarBairro(localizacao.bairro).then(function (bairro) {
                            localizacao.bairro.id_firebase = bairro.key();
                            localizacao.latLng = new google.maps.LatLng(local.location.lat, local.location.lon);

                            resolve(localizacao);
                        }, function (error) {
                            reject(error);
                        });
                    }, function (error) {
                        reject(error);
                    });
                }, function (error) {
                    reject(error);
                });
            });
        },
        
        setLocalizacao: function (localizacao) {
            $localStorage.latLng = localizacao.latLng;
            $localStorage.bairro = localizacao.bairro;
            $localStorage.cidade = localizacao.cidade;
        }
    };
});