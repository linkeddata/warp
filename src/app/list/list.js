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
  'ui.bootstrap.tpls',
  'angularFileUpload'
])

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
    data:{ pageTitle: 'Listing resources' }
  });
})

/**
 * Filters
 */
.filter('classicDate', function() {
  return function(date) {
    date = (date<10000000000)?date*1000:date;
    return moment(date).format('YYYY-MM-DD, h:mm:ss a');
  };
})

.filter('fromNow', function() {
  return function(date) {
    date = (date<10000000000)?date*1000:date;
    return moment(date).fromNow();
  };
})


.filter('fileSize', function() {
  return function(bytes) {
    return humanFileSize(bytes);
  };
})

.filter('truncate', function() {
  return function(string, size) {
    if (string.length > size) {
      return string.substring(0, size)+'...';
    } else {
      return string;
    }
  };
})

/**
 * Directives
 */
.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
})

/**
 * And of course we define a controller for our route.
 */
.controller( 'ListCtrl', function ListController( $scope, $http, $location, $modal, $sce, $stateParams, ngProgress ) {
  // variables
  $scope.schema = '';
  $scope.resources = [];
  $scope.listLocation = true;
  $scope.emptyDir = false;
  $scope.breadCrumbs = [];

  $scope.prepareList = function(url) {
    if (url && url.length > 0) {
      $scope.listLocation = true;
      $location.path('/list/'+stripSchema(url));
    } else {
      $scope.listLocation = false;
      notify('Warning', 'Please provide a valid URL');
    }
  };
  
  $scope.changeLocation = function(path) {
    $location.path(path);
  };

  // TODO: rdflib fetch does not respond properly to 404
  $scope.listDir = function (url) {
    var elms = url.split("/");
    var schema = '';
    var path = '';
    if (elms[0].substring(0, 4) == 'http') {
      schema = elms[0];
      elms.splice(0,1);
    } else {
      schema = 'https';
    }
    $scope.path = schema+'://';

    for (i=0; i<elms.length; i++) {
      if (elms[i].length > 0) {
        path = (i===0)?elms[0]+'/':path+elms[i]+'/';
        var dir = {
          uri: '#/list/'+schema+'/'+path,
          name: decodeURIComponent(elms[i])
        };

        $scope.breadCrumbs.push(dir);
      }
    }
    $scope.path += path;

    // start progress bar
    ngProgress.complete();
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
    f.nowOrWhenFetched($scope.path,undefined,function(ok, body) {
      if (!ok) {
        ngProgress.complete();
        $scope.listLocation = false;
        notify('Error', 'Could not fetch dir listing. Is the server available?');
      } else {
        $scope.listLocation = true;
      }
      $scope.$apply();

      var dirs = g.statementsMatching(undefined, RDF("type"), POSIX("Directory"));
      for ( var i in dirs ) {
        var root = (dirs[i].subject.uri.split('://')[1].split('/').length <= 2)?true:false;
        var d = {};
        if ( dirs[i].subject.uri == $scope.path ) {
          d = {
            id: $scope.resources.length+1,
            uri: dirs[i].subject.uri,
            path: dirname(document.location.href)+'/',
            type: '-',
            name: '../',
            mtime: g.any(dirs[i].subject, POSIX("mtime")).value,
            size: '-'
          };
          if (root) {
            d.name = '/';
            d.path = document.location.href;
          }
        } else {
          var base = (document.location.href.charAt(document.location.href.length - 1) === '/')?document.location.href:document.location.href+'/';
          d = {
            id: $scope.resources.length+1,
            uri: dirs[i].subject.uri,
            path: base+encodeURIComponent(basename(dirs[i].subject.uri))+'/',
            type: 'Directory',
            name: decodeURIComponent(basename(dirs[i].subject.value).replace("+", "%20")),
            mtime: g.any(dirs[i].subject, POSIX("mtime")).value,
            size: '-'
          };
        }
        $scope.resources.push(d);
      }
      // either POSIX:File or RDFS:Resource
      // TODO: remove duplicates using something like http://lodash.com/docs#union
      var files = g.statementsMatching(undefined, RDF("type"), POSIX("File"));
      files = (files.length > 0)?files.concat(g.statementsMatching(undefined, RDF("type"), RDFS("Resource"))):g.statementsMatching(undefined, RDF("type"), RDFS("Resource"));
      for (i in files) {
        var f = {
          id: $scope.resources.length+1,
          uri: files[i].subject.uri,
          path: files[i].subject.uri,
          type: 'File', // TODO: use the real type
          name: decodeURIComponent(basename(files[i].subject.value).replace("+", "%20")),
          mtime: g.any(files[i].subject, POSIX("mtime")).value,
          size: g.any(files[i].subject, POSIX("size")).value
        };
        $scope.resources.push(f);
        $scope.$apply();
      }
      if ($scope.resources.length === 0) {
        $scope.emptyDir = true;
      }
      ngProgress.complete();

      $scope.$apply();
    });
  };

  $scope.upload = function () {
    console.log("Uploading files");
  };

  $scope.newDir = function(dirName) {
    // trim whitespaces
    dirName = dirName.replace(/^\s+|\s+$/g, ""); 
    $http({
      method: 'PUT', 
      url: $scope.path+encodeURIComponent(dirName),
      data: '',
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"' 
      },
      withCredentials: true
    }).
    success(function(data, status) {
      if (status == 200 || status == 201) {
        // add dir to local list
        var now = new Date().getTime();
        var base = (document.location.href.charAt(document.location.href.length - 1) === '/')?document.location.href:document.location.href+'/';
        addResource($scope.resources, $scope.path+dirName, 'Directory');
        $scope.emptyDir = false;
        notify('Success', 'Directory created.');
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Forbidden', 'Authentication required to create new directory.');
      } else if (status == 403) {
        notify('Forbidden', 'You are not allowed to create new directory.');
      } else {
        notify('Failed '+status, data, 5000);
      }
    });
  };

  $scope.newFile = function(fileName) {
    // trim whitespaces
    fileName = fileName.replace(/^\s+|\s+$/g, "");
    var uri = $scope.path+encodeURIComponent(fileName);
    $http({
      method: 'PUT', 
      url: uri,
      data: '',
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
      },
      withCredentials: true
    }).
    success(function(data, status, headers) {
      if (status == 200 || status == 201) {
        // Add resource to the list
        addResource($scope.resources, uri, 'File');
        refreshResource($http, $scope.resources, uri);
        $scope.emptyDir = false;
        notify('Success', 'Resource created.');
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Forbidden', 'Authentication required to create new resource.');
      } else if (status == 403) {
        notify('Forbidden', 'You are not allowed to create new resource.');
      } else {
        notify('Failed '+status, data);
      }
    });
  };
  
  $scope.updateFile = function(fileContent) {
	var uri = $scope.uri;
	var data = $("#fileContent").val();
    $http({
      method: 'PUT', 
      url: uri,
      data: data,
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
      },
      withCredentials: true
    }).
    success(function(data, status, headers) {
      if (status == 200 || status == 201) {
        // Add resource to the list
        //addResource($scope.resources, uri, 'File');
        //refreshResource($http, $scope.resources, uri);
        //$scope.emptyDir = false;
        notify('Success', 'Resource updated.');
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Forbidden', 'Authentication required to update resource.');
      } else if (status == 403) {
        notify('Forbidden', 'You are not allowed to update resource.');
      } else {
        notify('Failed '+status, data);
      }
    });
  };

  $scope.deleteResource = function(resourceUri) {
    $http({
      method: 'DELETE', 
      url: resourceUri,
      withCredentials: true
    }).
    success(function(data, status, headers) {
      if (status == 200) {
        // remove resource from the view
        $scope.removeResource(resourceUri);
        //TODO: remove the acl and meta files.
        var lh = parseLinkHeader(headers('Link'));
        if (lh['meta'] && lh['meta']['href'].length > 0 && lh['meta']['href'] != resourceUri) {
          $http({
            method: 'DELETE',
            url: lh['meta']['href'],
            withCredentials: true
          }).
          success(function (data, status) {
            $scope.removeResource(lh['meta']['href']);
          }).
          error(function(data, status) {
            if (status == 401) {
              notify('Forbidden', 'Authentication required to delete '+lh['meta']['href']);
            } else if (status == 403) {
              notify('Forbidden', 'You are not allowed to delete '+lh['meta']['href']);
            } else {
              console.log('Failed to delete '+lh['meta']['href']+" Server responded with HTTP "+status);
            }
          });
        }
        if (lh['acl'] && lh['acl']['href'].length > 0 && lh['acl']['href'] != resourceUri) {
          $http({
            method: 'DELETE',
            url: lh['acl']['href'],
            withCredentials: true
          }).
          success(function (data, status) {
            $scope.removeResource(lh['acl']['href']);
          }).
          error(function(data, status) {
            if (status == 401) {
              notify('Forbidden', 'Authentication required to delete '+lh['acl']['href']);
            } else if (status == 403) {
              notify('Forbidden', 'You are not allowed to delete '+lh['acl']['href']);
            } else {
              console.log('Failed to delete '+lh['acl']['href']+" Server responded with HTTP "+status);
            }
          });
        }
      }
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Forbidden', 'Authentication required to delete '+basename(resourceUri));
      } else if (status == 403) {
        notify('Forbidden', 'You are not allowed to delete '+basename(resourceUri));
      } else if (status == 409) {
        notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
      } else {
        notify('Failed '+status, data);
      }
    });
  };

  $scope.removeResource = function(uri) {
    if ($scope.resources) {
      for(var i = $scope.resources.length - 1; i >= 0; i--){
        if($scope.resources[i].uri == uri) {
          $scope.resources.splice(i,1);
          if ($scope.resources.length === 0) {
            $scope.emptyDir = true;
          }
          notify('Success', 'Deleted '+decodeURIComponent(basename(uri)+'.'));
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
    var modalInstance = $modal.open({
      templateUrl: 'delete.html',
      controller: ModalDeleteCtrl,
      size: 'sm',
      resolve: { 
        uri: function () {
          return uri;
        }
      }
    });
    modalInstance.result.then($scope.deleteResource);
  };
  // File editor dialog
  $scope.openFileEditor = function (uri) {
	  $scope.uri = uri;
	  var modalInstance = $modal.open({
      templateUrl: 'fileEditor.html',
      controller: ModalFileEditorCtrl,
      size: 'sm',
	  resolve: { 
        uri: function () {
          return uri;
        }
	  }
    });
    modalInstance.result.then($scope.updateFile);
  };
  // New file upload dialog
  $scope.openNewUpload = function (url) {
    var modalInstance = $modal.open({
      templateUrl: 'uploadfiles.html',
      controller: ModalUploadCtrl,
      size: 'sm',
      resolve: { 
        url: function () {
          return url;
        },
        resources: function () {
          return $scope.resources;
        }
      }
    });
  };
  // ACL dialog
  $scope.openACLEditor = function (resources, uri, type) {
    // Find ACL uri and check if we can modify it
    $http({
      method: 'HEAD',
      url: uri,
      withCredentials: true
    }).
    success(function(data, status, headers) {
      // add dir to local list
      var lh = parseLinkHeader(headers('Link'));
      var aclURI = (lh['acl'] && lh['acl']['href'].length > 0)?lh['acl']['href']:'';

      $http({
        method: 'HEAD',
        url: aclURI,
        withCredentials: true
      }).
      success(function(data, status, headers) {
        var modalInstance = $modal.open({
          templateUrl: 'acleditor.html',
          controller: ModalACLEditor,
          resolve: {
            resources: function () {
              return resources;
            },
            uri: function () {
              return uri;
            },
            aclURI: function () {
              return aclURI;
            },
            type: function() {
              return type;
            },
            exists: function() {
              return true;
            }
          }
        });
      }).
      error(function(data, status) {
        if (status == 404) {
          // missing ACL file is OK
          var modalInstance = $modal.open({
            templateUrl: 'acleditor.html',
            controller: ModalACLEditor,
            resolve: {
              resources: function () {
                return resources;
              },
              uri: function () {
                return uri;
              },
              aclURI: function () {
                return aclURI;
              },
              type: function() {
                return type;
              },
              exists: function() {
                return false;
              }
            }
          });
        } else if (status == 401) {
          notify('Forbidden', 'Authentication required to change permissions for: '+decodeURIComponent(basename(uri)));
        } else if (status == 403) {
          notify('Forbidden', 'You are not allowed to change permissions for: '+decodeURIComponent(basename(uri)));
        } else {
          notify('Failed - HTTP '+status, data, 5000);
        }
      });
    }).
    error(function(data, status) {
      if (status == 401) {
        notify('Forbidden', 'Authentication required to change permissions for: '+decodeURIComponent(basename(uri)));
      } else if (status == 403) {
        notify('Forbidden', 'You are not allowed to change permissions for: '+decodeURIComponent(basename(uri)));
      } else {
        notify('Failed - HTTP '+status, data, 5000);
      }
    });
  };

  // Display list for current path
  if ($stateParams.path.length > 0) {
    $scope.listDir($stateParams.path);
  } else {
    $scope.listLocation = false;
  }
});

var refreshResource = function(http, resources, uri) {
  http({
    method: 'HEAD', 
    url: uri,
    withCredentials: true
  }).
  success(function(data, status, headers) {
    var l = headers('Content-Length');
    if (l && l > 0) {
      for(var i = resources.length - 1; i >= 0; i--) {
        if (resources[i].uri == uri) {
          resources[i].size = l;
        }
      }
    }
    return true;
  });
  return false;
};

var resourceExists = function (resources, uri) {
  if (resources.length > 0) {
    for(var i = resources.length - 1; i >= 0; i--){
      if(decodeURIComponent(resources[i].uri) == decodeURIComponent(uri)) {
        return resources[i];
      }
    }
  }
  return undefined;
};

var addResource = function (resources, uri, type, size) {
  // Add resource to the list
  var base = (document.location.href.charAt(document.location.href.length - 1) === '/')?document.location.href:document.location.href+'/';
  var path = (type === 'File')?dirname(uri)+'/'+encodeURIComponent(basename(uri)):base+basename(uri)+'/';
  var now = new Date().getTime();
  size = (size)?size:'-';
  var f = {
    id: resources.length+1,
    uri: uri,
    path: path,
    type: type, // TODO: use the real type
    name: decodeURIComponent(basename(uri)),
    mtime: now,
    size: size
  };
  // overwrite previous resource
  if (!resourceExists(resources, uri)) {
    resources.push(f);
  }
};


// Modal Ctrls
var ModalNewDirCtrl = function ($scope, $modalInstance) {
  $scope.isFocused = true;

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

  $scope.isFocused = true;

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

var ModalFileEditorCtrl = function ($scope, $modalInstance, uri, $http) {
  // TODO
  // $scope.expr = "/^[A-Za-z0-9_-(\.)]*$/";

  $scope.isFocused = true;

  $scope.updateFile = function(fileContent) {
    $modalInstance.close(fileContent);
  };

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
  
  $http({
    method: 'GET', 
    url: uri,
    data: '',
    headers: {
      'Accept': 'text/turtle',
    },
    withCredentials: true
  }).
  success(function(data, status, headers) {
    if (status == 200 || status == 201) {
      // Load the rdf to the textarea
	  $("#fileContent").val(data);
	  notify('Success', 'Resource retrieved.');
    }
  }).
  error(function(data, status) {
    if (status == 401) {
      notify('Forbidden', 'Authentication required to edit the resource.');
    } else if (status == 403) {
      notify('Forbidden', 'You are not allowed to edit the resource.');
    } else {
      notify('Failed '+status, data);
    }
  });  
};

var ModalDeleteCtrl = function ($scope, $modalInstance, uri) {
  $scope.delUri = uri;
  $scope.resource = decodeURIComponent(basename(uri));
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

var ModalUploadCtrl = function ($scope, $modalInstance, $http, $upload, url, resources) {
  $scope.url = url;
  $scope.resources = resources;
  $scope.container = basename(url);
  $scope.uploading = [];
  $scope.progress = [];
  $scope.filesUploading = 0;

  // stop/abort the upload of a file
  $scope.abort = function(index) {
    console.log($scope.uploading.length);
    $scope.uploading[index].abort();
  };

  // remove file from upload list
  $scope.remove = function(index) {
    if ($scope.selectedFiles.length > 0) {
      for (var i = $scope.selectedFiles.length - 1; i >= 0; i--) {
        if(decodeURIComponent($scope.selectedFiles[i].name) == decodeURIComponent(index)) {
          $scope.selectedFiles.splice(i, 1);
          $scope.uploading[index].abort();
          $scope.uploading[index] = null;
          break;
        }
      }
    }
  };

  $scope.clearUploaded = function () {
    $scope.selectedFiles = [];
  };

  $scope.$watch('filesUploading', function(newVal, oldVal) {
    if (oldVal > 0 && newVal === 0) {
      notify('Success', 'Finished uploading files!');
    }
  });

  // TODO: handle errors during upload
  $scope.doUpload = function(file) {
    $scope.progress[file.name] = 0;
    file.name = file.name.replace(/^\s+|\s+$/g, "");
    $scope.uploading[file.name] = $upload.upload({
        url: $scope.url,
        method: 'POST',
        withCredentials: true,
        file: file
      }).progress(function(evt) {
        var progVal = parseInt(100.0 * evt.loaded / evt.total, 10);
        $scope.progress[file.name] = progVal;
      }).success(function(data, status, headers, config) {
        // file is uploaded successfully
        $scope.filesUploading--;
        addResource($scope.resources, $scope.url+encodeURIComponent(file.name), 'File', file.size);
        refreshResource($http, $scope.resources, $scope.url+encodeURIComponent(file.name));        
    });
  };

  $scope.onFileSelect = function($files) {
    $scope.selectedFiles = $files;
    $scope.filesUploading = $files.length;

    for (var i = 0; i < $files.length; i++) {
      var file = $files[i];
      $scope.doUpload(file);
    }
  };

  $scope.ok = function () {
    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

var ModalACLEditor = function ($scope, $modalInstance, $http, resources, uri, aclURI, type, exists) {
  $scope.resources = resources;
  $scope.uri = uri;
  $scope.aclURI = aclURI;
  $scope.resType = type;
  $scope.gotOwner = false;
  $scope.resource = decodeURIComponent(basename(uri));
  $scope.policies = [];
  $scope.newUser = [];
  $scope.webidresults = [];
  
  $scope.isFocused = true;
  $scope.loading = true;
  $scope.disableOk = false;
    
  // Load ACL triples
  var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
  var WAC = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");
  var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");

  var g = $rdf.graph();
  
  // add CORS proxy
  $rdf.Fetcher.crossSiteProxyTemplate=PROXY;
  
  // truncate string
  $scope.trunc = function (str, size) {
    if (str !== undefined) {
      return (str.length > size)?str.slice(0, size)+'...':str;
    } else {
      return '';
    }
  };
  
  $scope.findModes = function(modes) {
    var ret = {Read: false, Write: false, Append: false, Control: false};
    if (modes !== undefined && modes.length > 0) {
      for (var i in modes) {
        if (modes[i] !== undefined) {
          mode = modes[i].object.uri.slice(modes[i].object.uri.indexOf('#')+1, modes[i].object.uri.length);
          if (mode == "Read") { ret.Read = true; }
          else if (mode == "Write") { ret.Write = true; }
          else if (mode == "Append") { ret.Append = true; }
          else if (mode == "Control") { ret.Control = true; }
        }
      }
    }
    return ret;
  };

  // fetch user data
  if (exists) {
    var f = $rdf.fetcher(g, TIMEOUT);
    f.nowOrWhenFetched($scope.aclURI,undefined,function(ok, body) {
      if (!ok) {
        console.log('Error -- could not fetch ACL file. Is the server available?');
        $scope.listLocation = false;
        $scope.loading = false;
        $scope.$apply();
      }

      $scope.findModes = function(modes) {
        var ret = {Read: false, Write: false, Append: false, Control: false};
        if (modes !== undefined && modes.length > 0) {
          for (var i in modes) {
            if (modes[i] !== undefined) {
              mode = modes[i].object.uri.slice(modes[i].object.uri.indexOf('#')+1, modes[i].object.uri.length);
              if (mode == "Read") { ret.Read = true; }
              else if (mode == "Write") { ret.Write = true; }
              else if (mode == "Append") { ret.Append = true; }
              else if (mode == "Control") { ret.Control = true; }
            }
          }
        }
        return ret;
      };

      $scope.getPolicies = function(triples, cat, arr) {
        if (triples !== undefined && triples.length > 0) {
          for (i=0; i<triples.length;i++) {
            var policy = {};
            policy.uri = triples[i].subject.uri;
            if (triples[i].object.uri === FOAF("Agent").uri) {
              policy.webid = FOAF("Agent").uri;
              policy.fullname = policy.webid;
              policy.classtype = 'agentClass';
            } else {
              policy.webid = triples[i].object.uri;
              getProfile($scope, triples[i].object.uri, policy);
            }
            policy.modes = $scope.findModes(g.statementsMatching(triples[i].subject, WAC("mode"), undefined));
            policy.defaultForNew = (g.statementsMatching(triples[i].subject, WAC("defaultForNew"), $rdf.sym($scope.uri)).length > 0)?true:false;
            if (triples[i].object.uri === FOAF("Agent").uri) {
              policy.cat = 'any';
            } else if (policy.modes.Control === true) {
              policy.cat = 'owner';
              $scope.gotOwner = true;
            } else {
              policy.cat = cat;
            }
            arr.push(policy);
          }
          return true;
        } else {
          return false; 
        }
      };

      var policies = g.statementsMatching(undefined, WAC("accessTo"), $rdf.sym($scope.uri));
      if (policies.length > 0) {
        $scope.getPolicies(g.statementsMatching(undefined, WAC("agent"), undefined), 'others', $scope.policies);
        $scope.getPolicies(g.statementsMatching(undefined, WAC("agentClass"), undefined), 'others', $scope.policies);

        $scope.loading = false;
        $scope.$apply();
      }
    });
  } else {
    //todo add a default owner
    var others = {};
    others.webid = FOAF("Agent").uri;
    others.cat = 'any';
    others.classType = 'agentClass';
    others.modes = $scope.findModes();
    $scope.policies.push(others);
    $scope.loading = false;
  }
  
  $scope.haveCategory = function (cat) {
    if ($scope.policies) {
      for (var i=0; i<$scope.policies; i++) {
        if ($scope.policies[i].cat == cat) {
          return true; 
        }
      }
    }
    return false;
  };
  
  $scope.serializeTurtle = function () {
    var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
    var WAC = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");
    var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");

    var g = new $rdf.graph();

    if ($scope.policies.length > 0) {
      for (var i=0; i<$scope.policies.length;i++) {
      //  if ($scope.policies[i].webid = FOAF("Agent").uri) {
          g.add($rdf.sym("#"+i), RDF("type"), WAC('Authorization'));
          g.add($rdf.sym("#"+i), WAC("accessTo"), $rdf.sym(decodeURIComponent($scope.uri)));
          if (($scope.policies[i].classtype && $scope.policies[i].classtype == 'agentClass') || ($scope.policies[i].webid == FOAF("Agent").uri)) {
            g.add($rdf.sym("#"+i), WAC("agentClass"), $rdf.sym($scope.policies[i].webid));
          } else {
            g.add($rdf.sym("#"+i), WAC("agent"), $rdf.sym($scope.policies[i].webid));
          }
          if ($scope.policies[i].defaultForNew) {
            g.add($rdf.sym("#"+i), WAC("defaultForNew"), $rdf.sym(decodeURIComponent($scope.uri))); 
          }
          if ($scope.policies[i].cat == "owner" && $scope.aclURI.length > 0) {
            g.add($rdf.sym("#"+i), WAC("accessTo"), $rdf.sym(decodeURIComponent($scope.aclURI)));
          }
          for (var mode in $scope.policies[i].modes) {
            if ($scope.policies[i].modes[mode] === true) {
              g.add($rdf.sym("#"+i), WAC("mode"), WAC(mode));
            }
          }
      }
    }
    var s = new $rdf.Serializer(g).toN3(g);
    return s;
  };
  
  // PUT the ACL policy on the server
  $scope.setAcl = function () {
    $scope.disableOk = true;
    var acls = $scope.serializeTurtle();
    $http({
      method: 'PUT',
      url: $scope.aclURI,
      withCredentials: true,
      headers: {"Content-Type": "text/turtle"},
      data: acls
    }).
    success(function() {
      $modalInstance.close();
      var res = resourceExists($scope.resources, $scope.aclURI);
      if (res === undefined && resources[0].uri == dirname($scope.aclURI)+'/') {
        addResource($scope.resources, $scope.aclURI, "File", "-");
      }

      refreshResource($http, $scope.resources, $scope.aclURI);
      $scope.disableOk = false;
      notify('Success', 'Updated ACL policies for: '+basename($scope.uri));
    }).
    error(function(data, status, headers) {
      $scope.disableOk = false;
      notify('Error - '+status, data);
    });
  };
  
  $scope.removeUser = function (uri, webid) {
    if ($scope.policies !== undefined) {      
      angular.forEach($scope.policies, function(policy, key) {
        if(policy.uri === uri && policy.webid === webid) {
          $scope.policies.splice(key,1);
        }
      });
    }
  };
  
  $scope.showNewUser = function (cat) {
    $scope.newUser[cat] = {};
    var newUser = $scope.newUser[cat];    
  };
  
  $scope.addNewUser = function(cat, webid) {
    var user = {};
    user.webid = webid;
    user.cat = cat;
    if (cat == 'owner') {
      $scope.gotOwner = true;
      user.modes = {Read: true, Write: true, Control: true};
    }
    user.fullname = webid;
    user.loading = getProfile($scope, webid, user);
    $scope.policies.push(user);
    
    $scope.newUser[cat] = undefined;
  };
  
  // attempt to find a person using webizen.org
  $scope.lookupWebID = function(query) {
    // get results from server
    return $http.get('http://api.webizen.org/v1/search', {
      params: {
        q: query
      }
    }).then(function(response) {
        var matches = [];
        if (response.data) {
          angular.forEach(response.data, function(value, key) {
            var match = {};
            match.webid = key;
            if (!value.img) {
              match.img = 'assets/generic_photo.png';
            } else {
              match.img = value.img[0];
            }
            if (value.name && value.name[0]) {
              match.name = value.name[0] + ' ('+key+')';
            } else {
              match.name = key;
            }
            matches.push(match);
          });
        }
        return matches;
    });
  };
  
  $scope.cancelNewUser = function(cat) {
    delete $scope.newUser[cat];
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};
