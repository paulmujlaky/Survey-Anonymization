var fs = require("fs");
var path = require("path");

var config = require("../src/config.js");
var core = require("../src/core.js");
var buildQsf = require("./qsf.js");

var root = path.join(__dirname, "..");
var dist = path.join(root, "dist");

function source(name) {

    return fs.readFileSync(path.join(root, "src", name), "utf8");

}

var errors = core.validateConfig(config);

if (errors.length) {

    console.error(errors.join("\n"));
    process.exit(1);

}

var css = "var GENSI_CSS = " + JSON.stringify(source("styles.css")) + ";";

var bundle = [

    "// GENSI (Stark & Krosnick, 2017) adapted so peer names never leave the browser. GPL-3.0.",
    "(function () {",
    "",
    source("config.js"),
    css,
    source("core.js"),
    source("ui.js"),
    source("qualtrics.js"),
    "})();",
    ""

].join("\n");

var fields = core.fieldNames(config).map(function (name) {

    return config.fieldPrefix + name;

});

fs.mkdirSync(dist, {

    recursive: true

});

fs.writeFileSync(path.join(dist, "gensi-qualtrics.js"), bundle);
fs.writeFileSync(path.join(dist, "embedded-data-fields.txt"), fields.join("\n") + "\n");
fs.writeFileSync(path.join(dist, "GENSI_Anonymous.qsf"), JSON.stringify(buildQsf(bundle, fields)));

console.log("Built dist/: " + fields.length + " embedded data fields, " + bundle.length + " bytes of JavaScript");
