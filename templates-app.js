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
    "  <div class=\"clear-70\"></div>\n" +
    "  <div class=\"col-md-12\">\n" +
    "    <table class=\"create-new\">\n" +
    "      <tr>\n" +
    "        <td>\n" +
    "          <div class=\"btn-group\" dropdown>\n" +
    "            <button type=\"button\" class=\"btn btn-success dropdown-toggle\" ng-disabled=\"disabled\" tooltip-placement=\"bottom\" tooltip=\"New...\"><i class=\"fa fa-2x fa-plus\"></i></button>\n" +
    "            <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "              <li><a href ng-click=\"openNewDir()\"><i class=\"fa fa-2x fa-folder-open-o fa-fw vmiddle\"></i> Directory</a></li>\n" +
    "              <li><a href ng-click=\"openNewFile()\"><i class=\"fa fa-2x fa-file-o fa-fw vmiddle\"></i> File</a></li>\n" +
    "              <li><a href ng-click=\"openNewUpload()\"><i class=\"fa fa-2x fa-cloud-upload fa-fw vmiddle\"></i> Upload</a></li>\n" +
    "            </ul>\n" +
    "          </div>\n" +
    "    		</td>\n" +
    "        <td>\n" +
    "          <div id=\"crumbs\" class=\"collapse navbar-collapse\">\n" +
    "            <ul>\n" +
    "              <li ng-repeat=\"dir in dirPath\">\n" +
    "                <a href=\"{{dir.uri}}\"><i class=\"fa\" ng-class=\"$index==0?'fa-home':'fa-folder-open-o'\"></i> {{dir.name}}</a>\n" +
    "                </li>\n" +
    "      			</ul>\n" +
    "    	   	</div>\n" +
    "    		</td>\n" +
    "      </tr>\n" +
    "    </table>\n" +
    "    <div class=\"alerts\" ng-show=\"alerts.length > 0\">\n" +
    "      <alert ng-repeat=\"alert in alerts\" type=\"alert.type\" close=\"closeAlert($index)\">{{alert.msg}}</alert>\n" +
    "    </div>\n" +
    "    <div class=\"index\" ng-show=\"resources.length > 0\">\n" +
    "			<table class=\"box-shadow\">\n" +
    "				<thead>\n" +
    "					<th class=\"filename\">Name</th>\n" +
    "					<th>Size</th>\n" +
    "					<th>Modified</th>\n" +
    "					<th class=\"right\">Actions</th>\n" +
    "				</thead>\n" +
    "				<tr ng-repeat=\"res in resources\">\n" +
    "					<td colspan=\"{{res.type=='Parent'?4:1}}\"><a href=\"{{res.path}}\"><i class=\"fa\" ng-class=\"res.type=='Directory'||res.type=='Parent'?'fa-folder-open-o':'fa-file-o'\"></i> {{res.name}}</a></td>\n" +
    "					<td ng-hide=\"res.type=='Parent'\">{{res.size|fileSize}}</td>\n" +
    "					<td ng-hide=\"res.type=='Parent'\"><div tooltip-placement=\"bottom\" tooltip=\"{{res.mtime|classicDate}}\">{{res.mtime|fromNow}}</div></td>\n" +
    "					<td ng-hide=\"res.type=='Parent'\" class=\"right\">\n" +
    "						<div class=\"btn-group\" dropdown is-open=\"status.isopen\">\n" +
    "              <button type=\"button\" class=\"btn btn-primary dropdown-toggle\" ng-disabled=\"disabled\">\n" +
    "                Action <span class=\"caret\"></span>\n" +
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
    "              <input type=\"text\" ng-model=\"dirName\" ng-pattern=\"/^[A-Za-z0-9_-]*$/\" name=\"dirName\" id=\"dirName\" class=\"nginput\" placeholder=\"dir name..\" autofocus />\n" +
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
    "            <h3 class=\"modal-title\">New directory</h3>\n" +
    "        </div>\n" +
    "        <div class=\"modal-body\">\n" +
    "          <form name=\"newFileName\">\n" +
    "            <fieldset>\n" +
    "              <input type=\"text\" ng-model=\"fileName\" name=\"fileName\" id=\"fileName\" class=\"nginput\" placeholder=\"file name..\" autofocus />\n" +
    "              <!-- <span ng-hide=\"newFileName.fileName.$valid\">Only use: a-z A-Z 0-9 _ - .</span> -->\n" +
    "            </fieldset>\n" +
    "          </form>\n" +
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
    "    <div flow-init=\"{target: $scope.path}\">\n" +
    "      <div class=\"modal-header\">\n" +
    "          <h3 class=\"modal-title\">Upload a file</h3>\n" +
    "      </div>\n" +
    "      <div class=\"modal-body\">\n" +
    "          <input type=\"file\" class=\"btn btn-default\" flow-btn/>\n" +
    "          \n" +
    "          <div class=\"dragdrop\" flow-drop flow-drag-enter=\"style={border:'4px dotted #5cb85c'}\" flow-drag-leave=\"style={}\"\n" +
    "         ng-style=\"style\">\n" +
    "              Drag And Drop your files here\n" +
    "          </div>\n" +
    "          <table class=\"upload-files\">\n" +
    "            <tr ng-repeat=\"file in $flow.files\">\n" +
    "                <td>{{$index+1}}</td>\n" +
    "                <td>{{file.name}}</td>\n" +
    "                <td>{{file.msg}}</td>\n" +
    "            </tr>\n" +
    "          </table>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "        <!-- <span class=\"btn btn-primary\" ng-click=\"$scope.upload()\" ng-enabled=\"$index>1\">Upload File</span> -->\n" +
    "        <span class=\"btn btn-default\" ng-click=\"cancel()\">Cancel</span>\n" +
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
    "          <h3>You must be authenticated in order to use this application.</h3>\n" +
    "          <p ng-hide=\"showLogin\"><button class=\"btn btn-primary btn-sep-right\" ng-click=\"showLogin=!showLogin\">Login / Sign Up</button></p>\n" +
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
