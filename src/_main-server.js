var express = require('express');
var app = express();


// build-time compression:
// webpack builds an extra gzip file via CompressionPlugin (see webpack.config.js)
// then express rewrites requests for js
app.get('/build-browser.js', function (req, res, next) {
	req.url = req.url + '.gz';
	res.set('Content-Encoding', 'gzip');
	next();
});

require('./api-setup.js')(app); // used also webpack.config.js
app.use(express.static(__dirname + './../www/'));

var port = process.env.PORT || 8081;
// process.env.PORT works on Heroku   http://stackoverflow.com/a/15693371

app.listen(port, function () {
	console.log(' Web server started at port ' + port);
})