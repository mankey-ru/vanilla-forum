var express = require('express');
var app = express();

require('./api.js')(app);
app.use(express.static(__dirname + './../www/'));

var port = process.env.PORT || 8081;
// process.env.PORT works on Heroku   http://stackoverflow.com/a/15693371

app.listen(port, function () {
	console.log(' Web server started at port ' + port);
})