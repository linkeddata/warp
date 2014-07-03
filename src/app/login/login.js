/**
 * Login page
 */
angular.module( 'App.login', [
  'ui.router',
  'ngProgress'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function LoginConfig( $stateProvider ) {
  $stateProvider.state( 'login', {
    url: '/login',
    views: {
      "main": {
        controller: 'LoginCtrl',
        templateUrl: 'login/login.tpl.html'
      }
    },
    data:{ pageTitle: 'Login' }
  });
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'LoginCtrl', function LoginController( $scope, $http, $location, $sce, ngProgress ) {
  $scope.loginSuccess = false;
  $scope.showLogin = false;
  // login/signup widget source
  var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    
  // set the parameter in the src of iframe
  $scope.signupWidget = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);

  // login user into the app
  $scope.login = function(webid) {
    if (webid && (webid.substr(0, 4) == 'http')) {
      $scope.userProfile = {};
      $scope.userProfile.webid = webid;
      $scope.loginSuccess = true;
      // index or update the authenticated WebID on webizen.org
      $http.get('http://api.webizen.org/v1/search', {
        params: {
          q: webid
        }
      });
      // set the user in the main controller and redirect to home page
      $scope.getUserProfile(webid);
      notify('Success', 'Authenticated through WebID-TLS!');
    } else {
      notify('Warning', 'WebID-TLS authentication failed.');
    }
    $scope.showLogin = false;
  };

// cache user credentials in sessionStorage to avoid double sign in
  $scope.saveCredentials = function () {
    var app = {};
    var _user = {};
    app.userProfile = $scope.userProfile;
    sessionStorage.setItem($scope.appuri, JSON.stringify(app));
  };

  // get relevant info for a webid
  $scope.getUserProfile = function(webid) {
    if (DEBUG) {
      console.log("Getting user info for: "+webid);
    }
    // start progress bar
    ngProgress.reset();
    ngProgress.start();

    var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
    var SPACE = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
    var ACL = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");
    var g = $rdf.graph();
    var f = $rdf.fetcher(g, TIMEOUT);
    // add CORS proxy
    $rdf.Fetcher.crossSiteProxyTemplate=PROXY;

    var docURI = webid.slice(0, webid.indexOf('#'));
    var webidRes = $rdf.sym(webid);

    // fetch user data
    f.nowOrWhenFetched(docURI,undefined,function(ok, body) {
      if (!ok) {
        if ($scope.search && $scope.search.webid && $scope.search.webid == webid) {
          notify('Warning', 'WebID profile not found.');
          $scope.found = false;
          $scope.searchbtn = 'Search';
          // reset progress bar
          ngProgress.complete();
          $scope.$apply();
        }
      }

      // get some basic info
      var name = g.any(webidRes, FOAF('name'));
      // Clean up name
      name = (name)?name.value:'';
      var pic = g.any(webidRes, FOAF('img'));
      var depic = g.any(webidRes, FOAF('depiction'));
      // set avatar picture
      if (pic) {
        pic = pic.value;
      } else {
        if (depic) {
          pic = depic.value;
        } else {
          pic = 'assets/generic_photo.png';
        }
      }
      // get storage endpoints
      var storage = g.any(webidRes, SPACE('storage'));
      if (storage !== undefined) {
        storage = storage.value;
      }
      
      $scope.userProfile.webid = webid;
      $scope.userProfile.name = name;
      $scope.userProfile.picture = pic;
      $scope.userProfile.storagespace = storage;

      $scope.$parent.userProfile = $scope.userProfile;

      // cache user credentials in sessionStorage
      $scope.saveCredentials();

      // update DOM
      ngProgress.complete();
      $scope.$apply();
      $location.path('/list/'+stripSchema(storage));
    });
  };

  $scope.hideMenu = function() {
    $scope.$parent.showMenu = false;
  };

  // Event listener for login (from child iframe)
  var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
  var eventListener = window[eventMethod];
  var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

  // Listen to message from child window
  eventListener(messageEvent,function(e) {
    if (e.data.slice(0,5) == 'User:') {
      console.log(e.data);
      $scope.login(e.data.slice(5, e.data.length), true);
    }
    if (e.data.slice(0,6) == "cancel") {
      $scope.showLogin = false;
      $scope.$apply();
    }
  },false);

 });
