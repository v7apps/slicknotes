var packager = require('electron-packager')
var opts = {
  arch: "x64",
  dir: "./dist-app",
  platform: "linux"
};

packager(opts, function done (err, appPath) {
  console.log(err);
  console.log(appPath);
});
