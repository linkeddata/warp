angular.module('templates-app', ['about/about.tpl.html', 'list/list.tpl.html', 'login/login.tpl.html']);

angular.module("about/about.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("about/about.tpl.html",
    "<div class=\"row\">\n" +
    "  This is your about page!\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("list/list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("list/list.tpl.html",
    "<div class=\"container\" ng-click=\"hideMenu()\">\n" +
    "  <div class=\"col-md-12\" ng-show=\"listLocation === false\">\n" +
    "    <div class=\"clear-70\"></div>\n" +
    "    <h1>Please provide a location for the data server:</h1>\n" +
    "    <div class=\"prepare-list\">\n" +
    "      <form name=\"preList\">\n" +
    "        <div class=\"btn-group half-width\">\n" +
    "          <input type=\"text\" ng-model=\"uriPath\" name=\"uriPath\" id=\"uriPath\" class=\"nginput pull-left\" placeholder=\"https://example.org/\" autofocus />\n" +
    "          <button class=\"btn btn-primary\" ng-click=\"prepareList(uriPath)\"><i class=\"fa fa-search fa-2x\"></i></button>\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div ng-cloak class=\"col-md-12\" ng-show=\"listLocation === true\">\n" +
    "    <table class=\"create-new\">\n" +
    "      <tr>\n" +
    "        <td>\n" +
    "          <div class=\"btn-group\" dropdown>\n" +
    "            <button type=\"button\" class=\"btn btn-success dropdown-toggle\" ng-disabled=\"disabled\" tooltip-placement=\"bottom\" tooltip=\"New...\"><i class=\"fa fa-2x fa-plus\"></i></button>\n" +
    "            <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "              <li><a href ng-click=\"openNewDir()\"><i class=\"fa fa-2x fa-folder-open-o fa-fw vmiddle\"></i> Directory</a></li>\n" +
    "              <li><a href ng-click=\"openNewFile()\"><i class=\"fa fa-2x fa-file-o fa-fw vmiddle\"></i> File</a></li>\n" +
    "              <li><a href ng-click=\"openNewUpload(path)\"><i class=\"fa fa-2x fa-cloud-upload fa-fw vmiddle\"></i> Upload</a></li>\n" +
    "            </ul>\n" +
    "          </div>\n" +
    "    		</td>\n" +
    "        <td>\n" +
    "          <div id=\"crumbs\" class=\"collapse navbar-collapse\">\n" +
    "            <ul>\n" +
    "              <li ng-repeat=\"crumb in breadCrumbs\">\n" +
    "                <a href=\"{{crumb.uri}}\"><i class=\"fa\" ng-class=\"$first?'fa-home':'fa-folder-open-o'\"></i> {{crumb.name}}</a>\n" +
    "                </li>\n" +
    "      			</ul>\n" +
    "    	   	</div>\n" +
    "    		</td>\n" +
    "      </tr>\n" +
    "    </table>\n" +
    "    <div class=\"index\">\n" +
    "			<table class=\"box-shadow\">\n" +
    "				<thead>\n" +
    "					<th class=\"filename\">Name</th>\n" +
    "					<th>Size</th>\n" +
    "					<th>Modified</th>\n" +
    "					<th class=\"right\">Action</th>\n" +
    "				</thead>\n" +
    "        <tr ng-show=\"emptyDir\">\n" +
    "          <td colspan=\"4\"><h2>No files found</h2></td>\n" +
    "        </tr>\n" +
    "				<tr ng-repeat=\"res in resources|orderBy:['type','name']\" class=\"repeat-animation\">\n" +
    "					<td colspan=\"{{res.type==='-'?4:1}}\"><a href=\"{{res.path}}\"><i class=\"fa\" ng-class=\"res.type=='Directory'||res.type==='-'?'fa-folder-open-o':'fa-file-o'\"></i> {{res.name}}</a></td>\n" +
    "					<td ng-hide=\"res.type==='-'\">{{res.size|fileSize}}</td>\n" +
    "					<td ng-hide=\"res.type==='-'\"><div tooltip-placement=\"bottom\" tooltip=\"{{res.mtime|classicDate}}\">{{res.mtime|fromNow}}</div></td>\n" +
    "					<td ng-hide=\"res.type==='-'\" class=\"center\">\n" +
    "						<div class=\"btn-group\" dropdown is-open=\"status.isopen\">\n" +
    "              <button type=\"button\" class=\"btn btn-primary dropdown-toggle\" ng-disabled=\"disabled\">\n" +
    "                <i class=\"fa fa-angle-double-down\"></i>\n" +
    "              </button>\n" +
    "					      <ul class=\"dropdown-menu dropdown-menu-right left\" role=\"menu\">\n" +
    "					        <li><a href=\"#\" ng-show=\"res.type != 'Directory'\"><i class=\"fa fa-2x fa-pencil-square-o fa-fw vmiddle\"></i> View/Edit</a></li>\n" +
    "					        <li><a href=\"#\"><i class=\"fa fa-2x fa-unlock-alt fa-fw vmiddle\"></i> Permissions</a></li>\n" +
    "					        <li><a href ng-click=\"openDelete(res.uri)\"><i class=\"fa fa-2x fa-trash-o fa-fw vmiddle\"></i> Delete</a></li>\n" +
    "					      </ul>\n" +
    "					    </div>\n" +
    "					</td>\n" +
    "				</tr>\n" +
    "			</table>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "\n" +
    "  <!-- New dir modal -->\n" +
    "  <script type=\"text/ng-template\" id=\"newdir.html\">\n" +
    "    <div>\n" +
    "      <div class=\"modal-header\">\n" +
    "            <h3 class=\"modal-title\">New directory</h3>\n" +
    "        </div>\n" +
    "        <div class=\"modal-body\">\n" +
    "          <form name=\"newDirName\">\n" +
    "            <fieldset>\n" +
    "              <input type=\"text\" ng-model=\"dirName\" name=\"dirName\" id=\"dirName\" class=\"nginput\" placeholder=\"dir name..\" autofocus />\n" +
    "              <span ng-hide=\"newDirName.dirName.$valid\">Only use: a-z A-Z 0-9 _ -</span>\n" +
    "            </fieldset>\n" +
    "          </form>\n" +
    "        </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "          <button class=\"btn btn-primary\" ng-click=\"newDir(dirName)\">OK</button>\n" +
    "          <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "  </script>\n" +
    "\n" +
    "  <!-- New file modal -->\n" +
    "  <script type=\"text/ng-template\" id=\"newfile.html\">\n" +
    "    <div>\n" +
    "      <div class=\"modal-header\">\n" +
    "            <h3 class=\"modal-title\">New file</h3>\n" +
    "        </div>\n" +
    "        <div class=\"modal-body\">\n" +
    "          <form name=\"newFileName\">\n" +
    "            <fieldset>\n" +
    "              <input type=\"text\" ng-model=\"fileName\" name=\"fileName\" id=\"fileName\" class=\"nginput\" placeholder=\"file name..\" autofocus />\n" +
    "              <!-- <span ng-hide=\"newFileName.fileName.$valid\">Only use: a-z A-Z 0-9 _ - .</span> -->\n" +
    "            </fieldset>\n" +
    "          </form>\n" +
    "          <br/><small class=\"orange\">Warning: creating a new file may overwrite an existing one with the same name!</small>\n" +
    "        </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "          <button class=\"btn btn-primary\" ng-click=\"newFile(fileName)\">OK</button>\n" +
    "          <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "  </script>\n" +
    "\n" +
    "  <!-- Upload file modal -->\n" +
    "  <script type=\"text/ng-template\" id=\"uploadfiles.html\">\n" +
    "    <div>\n" +
    "      <div class=\"modal-header\">\n" +
    "        <h3 class=\"modal-title\">Upload files to <strong>{{container}}/</strong></h3>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "        <input type=\"file\" ng-file-select=\"onFileSelect($files)\" data-multiple=\"true\" multiple=\"multiple\">\n" +
    "        <div ng-file-drop=\"onFileSelect($files)\" ng-file-drag-over-class=\"'dropzone-on'\" class=\"dropzone\" ng-show=\"dropSupported\">\n" +
    "          drop files here\n" +
    "        </div>\n" +
    "        <div ng-file-drop-available=\"dropSupported=true\" ng-show=\"!dropSupported\">\n" +
    "          HTML5 Drop File is not supported!\n" +
    "        </div>\n" +
    "        <table class=\"upload-files\" ng-show=\"selectedFiles.length > 0\">\n" +
    "          <tr>\n" +
    "            <td><strong>File name</strong></td>\n" +
    "            <td><strong>Status</strong></td>\n" +
    "            <td></td>\n" +
    "          </tr>\n" +
    "          <tr ng-repeat=\"file in selectedFiles\" ng-class=\"progress[file.name] == 100?'done':''\">\n" +
    "            <td tooltip-placement=\"bottom\" tooltip=\"{{file.size|fileSize}}\">{{file.name|truncate:20}}</td>\n" +
    "            <td>{{progress[file.name]}}%</td>\n" +
    "            <td>\n" +
    "              <a ng-hide=\"progress[file.name] == 100\" class=\"btn btn-mini btn-default\" ng-click=\"abort(file.name)\"><i class=\"fa fa-2x fa-times\"></i></a>\n" +
    "              <a class=\"btn btn-mini btn-default\" ng-click=\"remove(file.name)\"><i class=\"fa fa-2x fa-trash-o\"></i></a>\n" +
    "            </td>\n" +
    "          </tr>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <a class=\"btn btn-default\" ng-click=\"cancel()\">Close</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </script>\n" +
    "\n" +
    "  <!-- Remove resource modal -->\n" +
    "  <script type=\"text/ng-template\" id=\"delete.html\">\n" +
    "    <div>\n" +
    "      <div class=\"modal-header\">\n" +
    "            <h3 class=\"modal-title\"><i class=\"fa fa-2x fa-trash-o fa-fw vmiddle\"></i> Delete resource</h3>\n" +
    "        </div>\n" +
    "        <div class=\"modal-body\">\n" +
    "          <p>Are you sure you want to delete</p>\n" +
    "          <p><strong>{{delUri}}</strong></p>\n" +
    "          <br/>\n" +
    "          <p><small>Note: make sure directories are empty before removing them.</small></p>\n" +
    "        </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "          <button class=\"btn btn-primary\" ng-click=\"deleteResource(resource)\">Yes</button>\n" +
    "          <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "  </script>\n" +
    "</div>\n" +
    "");
}]);

angular.module("login/login.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("login/login.tpl.html",
    "<div ng-click=\"hideMenu()\">\n" +
    "  <div class=\"panel-body col-md-12\">\n" +
    "    <div class=\"panel-body\">\n" +
    "        <h2>Welcome to LDP File Manager!</h2>\n" +
    "        <div ng-hide=\"loginSuccess\">\n" +
    "          <h3>Please authenticated in order for us to find your files.</h3>\n" +
    "          <p ng-hide=\"showLogin\"><button class=\"btn btn-primary btn-sep-right\" ng-click=\"showLogin=!showLogin\">Login</button></p>\n" +
    "        </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <!--login screen -->\n" +
    "  <div ng-show=\"showLogin\">\n" +
    "    <div class=\"login-frame\">\n" +
    "      <h2>Login / Sign Up</h2>\n" +
    "\n" +
    "      <iframe ng-src=\"{{signupWidget}}\" sandbox=\"allow-same-origin allow-scripts allow-forms\" frameborder=\"0\"></iframe>\n" +
    "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);
