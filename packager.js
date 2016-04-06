var packager = require('electron-packager');
var opts = {
  arch: "x64",
  dir: "./dist",
  platform: "win32"
};

packager(opts, function done (err, appPath) {
  console.log(err);
  console.log(appPath);
});
