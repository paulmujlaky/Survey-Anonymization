var http = require("http");
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
var port = Number(process.env.PORT) || 4173;

var types = {

    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"

};

http.createServer(function (request, response) {

    var url = new URL(request.url, "http://localhost");
    var pathname = url.pathname === "/" ? "/test/mock.html" : url.pathname;
    var file = path.normalize(path.join(root, pathname));

    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {

        response.writeHead(404);
        response.end("Not found");

        return;

    }

    response.writeHead(200, {

        "Content-Type": types[path.extname(file)] || "text/plain"

    });

    fs.createReadStream(file).pipe(response);

}).listen(port, "127.0.0.1", function () {

    console.log("Mock survey on http://localhost:" + port);

});
