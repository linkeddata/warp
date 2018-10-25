var getProfile = function(scope, uri, profile, forWebID) {
  var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
  var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
  var SPACE = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
  var LDP = $rdf.Namespace("http://www.w3.org/ns/ldp#");

  var g = $rdf.graph();
  var f = $rdf.fetcher(g, TIMEOUT);
  // add CORS proxy
  $rdf.Fetcher.crossSiteProxyTemplate=PROXY;

  var webid = (forWebID)?forWebID:uri;
  var docURI = (uri.indexOf('#') >= 0)?uri.slice(0, uri.indexOf('#')):uri;
  var webidRes = $rdf.sym(webid);
  profile.loading = true;

  // fetch user data
  return new Promise(function(resolve) {
    f.nowOrWhenFetched(docURI,undefined,function(ok, body) {
      if (!ok) {
        profile.uri = webid;
        // if (!profile.name || profile.name.length === 0 || !forWebID) {
        //   profile.name = webid;
        // }
        console.log('Warning - profile not found.');
        profile.loading = false;
        scope.$apply();
        return false;
      } else {
        if (!forWebID) {
          var sameAs = g.statementsMatching(webidRes, OWL('sameAs'), undefined);
          if (sameAs.length > 0) {
            sameAs.forEach(function(same){
              if (same['object']['value'].length > 0) {
                getProfile(scope, same['object']['value'], profile, webid);
              }
            });
          }
          var seeAlso = g.statementsMatching(webidRes, OWL('seeAlso'), undefined);
          if (seeAlso.length > 0) {
            seeAlso.forEach(function(see){
              if (see['object']['value'].length > 0) {
                getProfile(scope, see['object']['value'], profile, webid);
              }
            });
          }
          var prefs = g.statementsMatching(webidRes, SPACE('preferencesFile'), undefined);
          if (prefs.length > 0) {
            prefs.forEach(function(pref){
              if (pref['object']['value'].length > 0) {
                getProfile(scope, pref['object']['value'], profile, webid);
              }
            });
          }
        }

        var cls = g.statementsMatching(webidRes, RDF('type'), undefined)[0];
        cls = (cls)?cls.value:'';

        var classType = (cls == FOAF('Group').value)?'agentClass':'agent';
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
            pic = '';
          }
        }
        // get inbox
        var inbox = g.any(webidRes, LDP('inbox'));
        // set values
        profile.webid = webid;
        if (!profile.predicate || profile.predicate.length === 0) {
          profile.predicate = classType;
        }
        if (!profile.fullname || profile.fullname.length === 0 || profile.fullname === webid) {
          profile.fullname = name;
        }
        if (!profile.picture || profile.picture.length === 0) {
          profile.picture = pic;
        }
        if (!profile.inbox || profile.inbox.length === 0) {
          if (inbox) {
            profile.inbox = inbox.uri;
          }
        }
        profile.loading = false;
        scope.$apply();
        resolve(profile);
      }
    });
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
