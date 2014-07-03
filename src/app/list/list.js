/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */

angular.module( 'App.list', [
  'ui.router',
  'ngProgress',
  'ui.bootstrap',
  'ui.bootstrap.alert',
  'ui.bootstrap.tpls',
  'flow'
])


/**
 * Filters
 */
.filter('classicDate', function() {
  return function(date) {
    return moment(date*1000).format('YYYY-MM-DD, h:mm:ss a');
  };
})

.filter('fromNow', function() {
  return function(date) {
    return moment(date*1000).fromNow();
  };
})


.filter('fileSize', function() {
  return function(bytes) {
    return humanFileSize(bytes);
  };
})

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function ViewConfig( $stateProvider ) {
  $stateProvider.state( 'list', {
    url: '/list/{path:.*}',
    views: {
      "main": {
        controller: 'ListCtrl',
        templateUrl: 'list/list.tpl.html'
      }
    },
    data:{ pageTitle: 'Listing container' }
  });
})

.config(['flowFactoryProvider', function (flowFactoryProvider) {
  flowFactoryProvider.defaults = {
    permanentErrors: [404, 500, 501],
    maxChunkRetries: 1,
    chunkRetryInterval: 5000,
    simultaneousUploads: 4
  };
  flowFactoryProvider.on('catchAll', function (event) {
    console.log('catchAll', arguments);
  });
  // Can be used with different implementations of Flow.js
  // flowFactoryProvider.factory = fustyFlowFactory;
}])

/**
 * And of course we define a controller for our route.
 */
.controller( 'ListCtrl', function ListController( $scope, $http, $location, $modal, $sce, $stateParams, ngProgress ) {
  $scope.hideMenu = function() {
    $scope.$parent.showMenu = false;
  };

  // progress bar styling
  ngProgress.height('5px');
  ngProgress.color('#FF3C1F');

  // variables
  var storage = $scope.$parent.userProfile.storagespace;
  var schema = (storage !== undefined)?storage.slice(0, storage.indexOf('://')):$location.$$protocol;
  $scope.resources = [];
  $scope.dirPath = [];
  $scope.alert = [];

  // TODO: check for (saved) schema
  $scope.path = schema+'://'+$stateParams.path;
  console.log("Requested: "+$scope.path); // debug

  var elms = $stateParams.path.split("/");
  var path = '';
  for (i=0; i<elms.length; i++) {
    if (elms[i].length > 0) {
      path = (i===0)?elms[0]+'/':path+elms[i]+'/';
      var dir = {
        uri: '#/list/'+path,
        name: elms[i]
      };

      $scope.dirPath.push(dir);
    }
  }

  $scope.setAlert = function(type, msg) {
    if (!$scope.alerts) {
      $scope.alerts = [];
    }

    switch (type) {
      case 'Success':
        type = 'success';
        break;
      case "Error":
        type = 'danger';
        break;
      case "Warning":
        type = 'warning';
        break;
      default:
        type = 'success';
        break;
    }
    $scope.alerts.push({
      type: type,
      msg: msg
    });
    console.log($scope.alerts);
  };
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };

  $scope.listDir = function (url) {
    // start progress bar
    ngProgress.reset();
    ngProgress.start();

    var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    var LDP = $rdf.Namespace("http://www.w3.org/ns/ldp#");
    var POSIX = $rdf.Namespace("http://www.w3.org/ns/posix/stat#");

    var g = $rdf.graph();
    var f = $rdf.fetcher(g, TIMEOUT);
    // add CORS proxy
    $rdf.Fetcher.crossSiteProxyTemplate=PROXY;

    // fetch user data
    f.nowOrWhenFetched(url,undefined,function(ok, body) {
      if (ok === false) {
        notify('Error', 'Could not fetch dir listing.');
        $scope.setAlert('Error', 'Could not fetch dir listing.');
        ngProgress.complete();
        $scope.$apply();

        console.log(ok);
        console.log(body);
        return;
      }

      var dirs = g.statementsMatching(undefined, RDF("type"), POSIX("Directory"));
      for ( var i in dirs ) {
        if ( dirs[i].subject.uri.split('://')[1].split('/').length <= 2 ) {
          continue;
        }

        var d = {};
        if ( dirs[i].subject.uri == url ) {
          d = {
            uri: dirs[i].subject.uri,
            path: dirname(document.location.href)+'/',
            type: 'Parent',
            name: '../',
            mtime: g.any(dirs[i].subject, POSIX("mtime")).value,
            size: '-'
          };
        } else {
          var base = document.location.href;
          base = base.slice(base.length-1) == '/'?base:base+'/';
          d = {
            uri: dirs[i].subject.uri,
            path: base+basename(dirs[i].subject.uri)+'/',
            type: 'Directory',
            name: basename(dirs[i].subject.value),
            mtime: g.any(dirs[i].subject, POSIX("mtime")).value,
            size: '-'
          };
        }
        $scope.resources.push(d);
      }
      var files = g.statementsMatching(undefined, RDF("type"), RDFS("Resource"));
      for (i in files) {
        var f = {
          uri: files[i].subject.uri,
          path: '#/view/'+stripSchema(files[i].subject.uri),
          type: 'File', // TODO: use the real type
          name: basename(files[i].subject.value),
          mtime: g.any(files[i].subject, POSIX("mtime")).value,
          size: g.any(files[i].subject, POSIX("size")).value
        };
        $scope.resources.push(f);
      }

      ngProgress.complete();
      var location = ($scope.dirPath.length==1)?'Home directory':'/'+$scope.dirPath[$scope.dirPath.length - 1].name+'/';
      notify('Success', 'Displaying files in '+location);
      $scope.$apply();
    });
  };

  $scope.upload = function () {
    console.log("Uploading files");
    console.log($flow.files);
  };

  $scope.newDir = function(dirName) {
    $http({
      method: 'MKCOL', 
      url: $scope.path+dirName,
      withCredentials: true
    }).
    success(function(data, status) {
      if (status == 200 || status == 201) {
        notify('Success', 'Directory created.');
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Error', 'Authentication required to create new directory.');
      } else if (status == 403) {
        notify('Error', 'Insufficient permissions to create new directory.');
      } else {
        notify('Error'+status, data);
      }
    });
  };

  $scope.newFile = function(fileName) {
    $http({
      method: 'PUT', 
      url: $scope.path+fileName,
      data: '',
      headers: {'Content-Type': 'text/turtle'},
      withCredentials: true
    }).
    success(function(data, status, headers) {
      if (status == 200 || status == 201) {
        notify('Success', 'Resource created.');
        // Add resource to the list
        var res = headers('Location');
        var f = {
          uri: res,
          path: '#/view/'+stripSchema(res),
          type: 'File', // TODO: use the real type
          name: basename(res),
          mtime: moment().fromNow(),
          size: '-'
        };
        // TODO Refresh the view
        $scope.resources.push(f);
        // Add

      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Error', 'Authentication required to create new resource.');
      } else if (status == 403) {
        notify('Error', 'Insufficient permissions to create new resource.');
      } else {
        notify('Error'+status, data);
      }
    });
  };

  $scope.refreshResource = function(uri) {
    // TODO
  };

  $scope.deleteResource = function(resourceUri) {
    $http({
      method: 'DELETE', 
      url: resourceUri,
      withCredentials: true
    }).
    success(function(data, status) {
      if (status == 200 || status == 201) {
        notify('Success', 'Resource was deleted.');
        $scope.removeResource(resourceUri);
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Error', 'Authentication required to delete resource.');
      } else if (status == 403) {
        notify('Error', 'Insufficient permissions to delete resource.');
      } else if (status == 409) {
        notify('Error', 'Conflict detected. In case of directory, check if not empty.');
      } else {
        notify('Error'+status, data);
      }
    });
  };

  $scope.removeResource = function(uri) {
    if ($scope.resources) {
      for(var i = $scope.resources.length - 1; i >= 0; i--){
        if($scope.resources[i].uri == uri){
            $scope.resources.splice(i,1);
        }
      }
    }
  };

  // New dir dialog
  $scope.openNewDir = function () {
    var modalInstance = $modal.open({
      templateUrl: 'newdir.html',
      controller: ModalNewDirCtrl,
      size: 'sm'
    });
    modalInstance.result.then($scope.newDir);
  };
  // New file creation dialog
  $scope.openNewFile = function () {
    var modalInstance = $modal.open({
      templateUrl: 'newfile.html',
      controller: ModalNewFileCtrl,
      size: 'sm'
    });
    modalInstance.result.then($scope.newFile);
  };
  // Remove resource dialog
  $scope.openDelete = function (uri) {
    console.log("Calling openDelete for "+uri);
    var modalInstance = $modal.open({
      templateUrl: 'delete.html',
      controller: ModalDeleteCtrl,
      size: 'sm',
      resolve: { 
        delUri: function () {
          return uri;
        }
      }
    });
    modalInstance.result.then($scope.deleteResource);
  };
  // New file upload dialog
  $scope.openNewUpload = function () {
    var modalInstance = $modal.open({
      templateUrl: 'uploadfiles.html',
      controller: ModalUploadCtrl,
      size: 'sm'
    });
  };

  $scope.listDir($scope.path);
 });

// Modal Ctrls
var ModalNewDirCtrl = function ($scope, $modalInstance) {
  $scope.newDir = function(dirName) {
    $modalInstance.close(dirName);
  };

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

var ModalNewFileCtrl = function ($scope, $modalInstance) {
  // TODO
  // $scope.expr = "/^[A-Za-z0-9_-(\.)]*$/";

  $scope.newFile = function(fileName) {
    $modalInstance.close(fileName);
  };

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

var ModalDeleteCtrl = function ($scope, $modalInstance, delUri) {
  $scope.delUri = delUri;

  $scope.deleteResource = function() {
    $modalInstance.close($scope.delUri);
  };

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

};