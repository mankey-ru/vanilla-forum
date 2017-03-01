var express = require('express');
var app = express();

require('./api.js')(app);
app.use(express.static(__dirname + './../www/'));

var port = 8081;
app.listen(port, function () {
	console.log(' Web server started at port ' + port);
})