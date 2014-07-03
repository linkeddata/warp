var isInteger = function(a) {
    return ((typeof a !== 'number') || (a % 1 !== 0)) ? false : true;
};

stripSchema = function (uri) {
    return uri.slice(uri.indexOf('://')+3, uri.length);
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