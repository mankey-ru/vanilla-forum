const mongodb = require("mongodb");
const mongouri = 'mongodb:\/\/vanilla-forum-user:iNx*Sdfb@ds145389.mlab.com:45389\/vanilla-forum-db';



const MONGODB_URI_ENV_KEY = 'VANILLA_FORUM_MONGODB_URI';
const mongoUri = process.env[MONGODB_URI_ENV_KEY];
if (!mongoUri) {
	console.log('\n\n   ERROR! App can not be initialized without environment variable ' + MONGODB_URI_ENV_KEY + ', which should be a standard URI with "mongo" protocol and, if needed, access credentials\n\n\n');
	process.exit(1);
}

var _db;
module.exports =  {
	connect: function (callback) {
		mongodb.MongoClient.connect(mongoUri, function (err, database) {
			if (err) {
				console.log(err);
				process.exit(1);
			}
			_db = database;
			if (typeof callback === 'function') {
				return callback(err);
			}
		});
	},
	getDb: function () {
		return _db;
	}
};