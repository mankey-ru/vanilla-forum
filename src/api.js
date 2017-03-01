const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const dbtools = require('./dbtools.js');

const C_FORUM_GROUPS = "forum_groups";
const C_FORUMS = "forums";
const C_THEMES = "themes";
const C_REPLIES = "replies";
const C_USERS = "users";


module.exports = function (app) {
	dbtools.connect(function(err){
		doSetup(app);
	})
}

function doSetup(app) {
	var db = dbtools.getDb();
	app.use(bodyParser.json());
	/**		
		-------------------------------------------------------------------
									Темы
		-------------------------------------------------------------------
	*/
	/*  
		GET получить все
		POST создать новый
	*/

	app.get("/api/themes", function (req, res) {
		var aRules = [{
			$lookup: {
				from: C_USERS,
				localField: 'author_id',
				foreignField: '_id',
				as: 'author'
			}
		}, {
			$unwind: '$author'
		}, {
			$lookup: {
				from: C_REPLIES,
				localField: 'last_reply_id',
				foreignField: '_id',
				as: 'last_reply'
			}
		}, {
			$unwind: '$last_reply'
		}, {
			$lookup: {
				from: C_USERS,
				localField: 'last_reply_author_id',
				foreignField: '_id',
				as: 'last_reply_author'
			}
		}, {
			$unwind: '$last_reply_author'
		}];
		db.collection(C_THEMES).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get themes.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	app.post("/api/themes", function (req, res) {
		var author_id = ObjectID(req.body._TEMP_UID4DEL); // TODO определять на сервере конечно
		var newTheme;

		// Creating first reply
		var newReply = {
			text: req.body._TEMP_firstReply,
			rating: 0,
			author_id: author_id,
			theme_id: null, // to be updated
			date: new Date()
		}
		db.collection(C_REPLIES).insertOne(newReply, function (err, doc) {
			if (err) {
				handleError(res, err.message, 'Failed to create first reply');
			}
			else {
				newReply._id = ObjectID(doc.ops[0]._id);
				createNewTheme() // TODO promise
			}
		});

		function createNewTheme() {
			newTheme = req.body;
			newTheme.date = new Date();
			newTheme.cnt_replies = 0;
			newTheme.pinned = false;
			newTheme.cnt_views = 0;
			newTheme.author_id = author_id;
			newTheme.last_reply_author_id = author_id;
			newTheme.last_reply_id = newReply._id;

			// Deleting temporary service params
			for (let k in newTheme) {
				if (k.indexOf('_TEMP_') === 0) {
					delete newTheme[k];
				}
			}

			db.collection(C_THEMES).insertOne(newTheme, function (err, doc) {
				if (err) {
					handleError(res, err.message, 'Failed to create new theme');
				}
				else {
					newReply.theme_id = ObjectID(doc.ops[0]._id);
					updateFirstReply() // TODO promise
				}
			});
		}

		function updateFirstReply() {
			db.collection(C_REPLIES).updateOne({
				_id: newReply._id
			}, newReply, function (err, doc) {
				if (err) {
					handleError(res, err.message, 'Failed to update first reply');
				}
				else {
					res.status(201).json({
						newTheme: newTheme,
						newReply: newReply
					}).end();
				}
			});
		}
	});
	/**		
		-------------------------------------------------------------------
							Ответы (сообщения тем)
		-------------------------------------------------------------------
	*/
	/*  
		GET получить все
		POST создать новый
	*/

	app.get("/api/replies/:theme_id", function (req, res) {
		var aRules = [{
			$match: {
				theme_id: ObjectID(req.params.theme_id)
			}
		}, {
			$lookup: {
				from: C_USERS,
				localField: 'author_id',
				foreignField: '_id',
				as: 'author'
			}
		}, {
			$unwind: '$author'
		}];
		db.collection(C_REPLIES).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get themes.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	app.post("/api/replies", function (req, res) {
		var author_id = ObjectID(req.body._TEMP_UID4DEL); // TODO определять на сервере конечно
		delete req.body._TEMP_UID4DEL;


		var reqd = ['theme_id', 'text'];
		for (let k of reqd) {
			if (typeof req.body[k] === 'undefined') {
				handleError(res, err.message, 'Not enough data (' + k + ')');
				return;
			}
		}

		var newReply = req.body;
		newReply.date = new Date();
		newReply.rating = 0;
		newReply.theme_id = ObjectID(newReply.theme_id);
		newReply.author_id = author_id;

		db.collection(C_REPLIES).insertOne(newReply, function (err, doc) {
			if (err) {
				handleError(res, err.message, 'Failed to create reply');
			}
			else {
				res.status(201).json(doc.ops[0]).end();
			}
		});
	});

	/*  
		GET		find contact by id
		PUT		update contact by id
		DELETE	deletes contact by id
	 */

	app.get("/api/themes/:id", function (req, res) {
		db.collection(C_THEMES).findOne({
			_id: new ObjectID(req.params.id)
		}, function (err, doc) {
			if (err) {
				handleError(res, err.message, "Failed to get contact");
			}
			else {
				res.status(200).json(doc);
			}
		});
	});

	app.put("/api/themes/:id", function (req, res) {
		var updateDoc = req.body;
		delete updateDoc._id;

		db.collection(C_THEMES).updateOne({
			_id: new ObjectID(req.params.id)
		}, updateDoc, function (err, doc) {
			if (err) {
				handleError(res, err.message, "Failed to update contact");
			}
			else {
				res.status(204).end();
			}
		});
	});

	/**		
		-------------------------------------------------------------------
									Форумы
		-------------------------------------------------------------------
	*/

	/*  
		GET		получить все
		POST	создать новый
	*/

	app.get("/api/forums", function (req, res) {
		var aRules = [{
			$lookup: {
				from: C_THEMES,
				localField: 'last_reply_theme_id',
				foreignField: '_id',
				as: 'last_reply_theme'
			}
		}, {
			$unwind: '$last_reply_theme'
		}, {
			$lookup: {
				from: C_REPLIES,
				localField: 'last_reply_id',
				foreignField: '_id',
				as: 'last_reply'
			}
		}, {
			$unwind: '$last_reply'
		}, {
			$lookup: {
				from: C_THEMES,
				localField: 'last_reply_author_id',
				foreignField: '_id',
				as: 'last_reply_author'
			}
		}, {
			$unwind: '$last_reply_author'
		}];
		db.collection(C_FORUMS).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get forums.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	/*app.delete("/contacts/:id", function (req, res) {
		db.collection(C_THEMES).deleteOne({
			_id: new ObjectID(req.params.id)
		}, function (err, result) {
			if (err) {
				handleError(res, err.message, "Failed to delete contact");
			}
			else {
				res.status(204).end();
			}
		});
	});*/



	app.get("/api/users", function (req, res) {
		db.collection(C_USERS).find({}).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get users.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	app.get("/api/user.js", function (req, res) {
		db.collection(C_USERS).aggregate([{$sample:{size:1}}]).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get user.");
			}
			else {
				res.set('Content-Type', 'application/javascript');
				res.send('window.VANILLA_FORUM_CURRENT_USER = '+ JSON.stringify(docs[0]));
			}
		});
	});

	app.get("/api/test", function (req, res) {
		db.collection('trash').find({}).toArray(function (err, docs) {
			if (err) {
				handleError(res, err.message, "Failed to get users.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});
	app.post("/api/test", function (req, res) {
		var newContact = req.body;
		newContact.createDate = new Date();
		newContact.theme_id = ObjectID(newContact.theme_id);

		db.collection('trash').insertOne(newContact, function (err, doc) {
			if (err) {
				handleError(res, err.message, "Failed to create new contact.");
			}
			else {
				res.status(201).json(doc.ops[0]);
			}
		});
	});
}

function handleError(res, reason, message, code) {
	console.log('REST API ERR: ' + reason);
	res.status(code || 500).json({
		"error": message
	});
}


/*
	Как просто заставить Экспресс отдавать контент всем подряд
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	})


	//app.use(express.static(__dirname + "/public"));
*/