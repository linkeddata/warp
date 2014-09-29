var getProfile = function(scope, uri, profile) {
  var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
  var g = $rdf.graph();
  var f = $rdf.fetcher(g, TIMEOUT);
  // add CORS proxy
  $rdf.Fetcher.crossSiteProxyTemplate=PROXY;

  var docURI = (uri.indexOf('#') >= 0)?uri.slice(0, uri.indexOf('#')):uri;
  var webidRes = $rdf.sym(uri);
  profile.loading = true;

  // fetch user data
  return f.nowOrWhenFetched(docURI,undefined,function(ok, body) {
    if (!ok) {
      profile.uri = uri;
      profile.name = uri;
      console.log('Warning - profile not found.');
      profile.loading = false;
      scope.$apply();
      return false;
    } else {
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

      profile.fullname = name;
      profile.picture = pic;
      profile.loading = false;
      
      scope.$apply();
      return true;
    }
  });
};

var isInteger = function(a) {
    return ((typeof a !== 'number') || (a % 1 !== 0)) ? false : true;
};

stripSchema = function (url) {
    url = url.split('://');
    var schema = (url[0].substring(0, 4) == 'http')?url[0]:'';
    var path = (url[1].length > 0)?url[1]:url[0];
    return url[0]+'/'+url[1];
};

humanFileSize = function (bytes, si) {
    if (bytes == '-') {
        return bytes;
    }
    
    var thresh = (si)?1000:1024;
    if (bytes < thresh) {
        return bytes + ' B';
    }
    var units = (si)? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};

dirname = function(path) {
    return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
};

basename = function(path) {
    if (path.substring(path.length - 1) == '/') {
      path = path.substring(0, path.length - 1);
    }

    var a = path.split('/');
    return a[a.length - 1];
};

// unquote string (utility)
function unquote(value) {
  if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') {
      return value.substring(1, value.length - 1);
  }
  return value;
}

function parseLinkHeader(header) {
  var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
  var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

  var matches = header.match(linkexp);
  var rels = {};
  for (var i = 0; i < matches.length; i++) {
    var split = matches[i].split('>');
    var href = split[0].substring(1);
    var ps = split[1];
    var link = {};
    link.href = href;
    var s = ps.match(paramexp);
    for (var j = 0; j < s.length; j++) {
      var p = s[j];
      var paramsplit = p.split('=');
      var name = paramsplit[0];
      link[name] = unquote(paramsplit[1]);
    }

    if (link.rel !== undefined) {
      rels[link.rel] = link;
    }
  }

  return rels;
}