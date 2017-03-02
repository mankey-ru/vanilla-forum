const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const _ = require('lodash');

const dbtools = require('./dbtools.js');
const apiUrl = require('./api-url.js');

const C_FORUM_GROUPS = "forum_groups";
const C_FORUMS = "forums";
const C_THEMES = "themes";
const C_REPLIES = "replies";
const C_USERS = "users";
const C_VOTES = "rating_votes";

module.exports = function (app) {

	dbtools.connect(function () {
		// those routes that declared in db callback function works only if their path contains a dot
		// previously they worked fine
		// issue happens only on webpack dev server (npm run dev)
		// normal server (npm start) works ok as usual
		// WHAT THE FUCK IS THIS
		app.get('/somepath/wtf', function (req, res) {
			res.status(200).send('OK1') // it NOT works, just draws / (mainpage)
		})
		app.get('/somepath/wtf.json', function (req, res) {
			res.status(200).send('OK2') // it works
		})
	});
	app.get('/somepath/wtf-ok', function (req, res) {
		res.status(200).send('OK3') // it works
	})


	doSetup(app);
}

function doSetup(app) {


	app.use(bodyParser.json());

	// app.use(require('compression')) 
	// with default settings it decreases page size (232 vs 767 KB)
	// but increases CPU load and therefore page speed
	// i preferred build-time compression, see _main-server.js
	// compression invocation is not here because its not needed for webpack dev server

	// Handling a case when app is built for Cordova, therefore api becomes remote
	// Im not sure that Access-Control-Allow-Origin:* is OK for production
	// see also api-url.js
	/*var isHeroku = !!process.env.PORT
	if (isHeroku) {
		app.use(function (req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			next();
		})
	}*/

	app.get(apiUrl + 'commondata', function (req, res) {
		dbtools.getDb().collection(C_USERS).aggregate([{
			$sample: {
				size: 1
			}
		}]).toArray(function (err, docs) {
			if (err) {
				handleError(res, err, "Failed to get user.");
			}
			else {
				var result = {
					currentUser: docs[0]
				}
				res.status(200).json(result);
			}
		});
	});
	/**		
		-------------------------------------------------------------------
									Темы
		-------------------------------------------------------------------
	*/
	/*  
		GET получить все
		POST создать новый
	*/

	app.get(apiUrl + 'themes', function (req, res) {
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
		dbtools.getDb().collection(C_THEMES).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err, "Failed to get themes.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	app.post(apiUrl + 'themes', function (req, res) {
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
		dbtools.getDb().collection(C_REPLIES).insertOne(newReply, function (err, doc) {
			if (err) {
				handleError(res, err, 'Failed to create first reply');
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

			dbtools.getDb().collection(C_THEMES).insertOne(newTheme, function (err, doc) {
				if (err) {
					handleError(res, err, 'Failed to create new theme');
				}
				else {
					newReply.theme_id = ObjectID(doc.ops[0]._id);
					updateFirstReply() // TODO promise
				}
			});
		}

		function updateFirstReply() {
			dbtools.getDb().collection(C_REPLIES).updateOne({
				_id: newReply._id
			}, newReply, function (err, doc) {
				if (err) {
					handleError(res, err, 'Failed to update first reply');
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

	app.get(apiUrl + 'replies/:theme_id', function (req, res) {
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
		dbtools.getDb().collection(C_REPLIES).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err, "Failed to get themes.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	app.post(apiUrl + 'replies', function (req, res) {
		var author_id = ObjectID(req.body._TEMP_UID4DEL); // TODO определять на сервере конечно
		delete req.body._TEMP_UID4DEL;


		var reqd = ['theme_id', 'text'];
		for (let k of reqd) {
			if (typeof req.body[k] === 'undefined') {
				handleError(res, err, 'Not enough data (' + k + ')');
				return;
			}
		}

		var newReply = req.body;
		newReply.date = new Date();
		newReply.rating = 0;
		newReply.theme_id = ObjectID(newReply.theme_id);
		newReply.author_id = author_id;

		dbtools.getDb().collection(C_REPLIES).insertOne(newReply, function (err, doc) {
			if (err) {
				handleError(res, err, 'Failed to create reply');
			}
			else {
				res.status(201).json(doc.ops[0]).end();
			}
		});
	});

	app.post(apiUrl + 'vote', function (req, res) {
		req.body.author_id = ObjectID(req.body.author_id); // TODO определять на сервере конечно
		req.body.reply_id = ObjectID(req.body.reply_id);
		req.body.date = new Date();
		req.body.value = req.body.value | 0;

		var newVote = _.pick(req.body, ['author_id', 'reply_id', 'date', 'value']); // prevent sending bloating requests. 
		// TODO make it api-wide
		// TODO validate types also
		// TODO make that stuff in a module

		// Todo check if author votes for his own reply (send HTTP 400)
		var db = dbtools.getDb();

		db.collection(C_VOTES)
			.update({
				author_id: req.body.author_id,
				reply_id: req.body.reply_id
			}, newVote, {
				upsert: true // insert if not exists, updates if exist
			}, function (err, doc, upserted) {
				if (err || !doc) {
					handleError(res, err, 'Failed to ' + (upserted ? 'create' : 'update') + ' vote');
				}
				else {
					// callback hell! TODO refactor to promises
					updateReplyRating(req.body.reply_id);
				}
			});

		function updateReplyRating(reply_id_str) {
			var reply_id = ObjectID(reply_id_str);
			db.collection(C_VOTES)
				.find({
					reply_id: reply_id
				})
				.toArray(function (err, votes) {
					if (err || !votes) {
						handleError(res, err, 'Failed to find all votes for current reply');
					}
					else {
						var reply_rating = 0;
						for (let i = 0; i < votes.length; i++) {
							reply_rating += votes[i].value | 0;
						}
						// ----------------------------------
						db.collection(C_REPLIES)
							.update({
								_id: reply_id
							}, {
								$set: {
									rating: reply_rating
								}
							}, function (err, doc) {
								if (err || !doc) {
									handleError(res, err, 'Failed to update rating of voted reply');
								}
								else {
									updateReplyAuthorRating(reply_id, reply_rating);
								}
							});
					}
				});
		}

		function updateReplyAuthorRating(reply_id, reply_rating) { // everybody loves cascade hell!
			// ----------------------------------
			db.collection(C_REPLIES)
				.findOne({
					_id: reply_id
				}, function (err, doc) {
					if (err || !doc) {
						handleError(res, err, 'Failed to find author of voted reply');
					}
					else {
						var reply_author_id = ObjectID(doc.author_id);
						// ----------------------------------
						db.collection(C_REPLIES)
							.find({
								author_id: reply_author_id
							})
							.toArray(function (err, docs) {
								if (err || !docs) {
									handleError(res, err, 'Failed to find all replies of author of voted reply');
								}
								else {
									// updating authors rating
									// it could be done incremental way
									// but lets check first if full recalculation is fast enough
									var rating_total = 0;
									for (let i = 0; i < docs.length; i++) {
										rating_total += docs[i].rating | 0;
									}
									// ----------------------------------
									db.collection(C_USERS)
										.update({
											_id: reply_author_id
										}, {
											$set: {
												rating_total: rating_total
											}
										}, function (err, doc) {
											if (err || !doc) {
												handleError(res, err, 'Failed to update rating_total of author of voted reply');
											}
											else {
												res.status(201).json({
													author_rating_total: rating_total,
													reply_rating: reply_rating
												}).end();
											}
										});
								}
							});
					}
				});
		}



	});

	/*  
		GET		find contact by id
		PUT		update contact by id
		DELETE	deletes contact by id
	 */

	app.get(apiUrl + 'themes/:id', function (req, res) {
		dbtools.getDb().collection(C_THEMES).findOne({
			_id: new ObjectID(req.params.id)
		}, function (err, doc) {
			if (err) {
				handleError(res, err, "Failed to get contact");
			}
			else {
				res.status(200).json(doc);
			}
		});
	});

	app.put(apiUrl + 'themes/:id', function (req, res) {
		var updateDoc = req.body;
		delete updateDoc._id;

		dbtools.getDb().collection(C_THEMES).updateOne({
			_id: new ObjectID(req.params.id)
		}, updateDoc, function (err, doc) {
			if (err) {
				handleError(res, err, "Failed to update contact");
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

	app.get(apiUrl + 'forums', function (req, res) {
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
		dbtools.getDb().collection(C_FORUMS).aggregate(aRules).toArray(function (err, docs) {
			if (err) {
				handleError(res, err, "Failed to get forums.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	/*app.delete("/contacts/:id", function (req, res) {
		dbtools.getDb().collection(C_THEMES).deleteOne({
			_id: new ObjectID(req.params.id)
		}, function (err, result) {
			if (err) {
				handleError(res, err, "Failed to delete contact");
			}
			else {
				res.status(204).end();
			}
		});
	});*/



	app.get(apiUrl + 'test', function (req, res) {
		dbtools.getDb().collection('trash').find({}).toArray(function (err, docs) {
			if (err) {
				handleError(res, err, "Failed to get users.");
			}
			else {
				res.status(200).json(docs);
			}
		});
	});

	// TODO NOT WORKING!11
	/*app.use(function (req, res, next) {
		res.status(404).send('<h1>Something went wrong</h1>')
	})*/
}

function handleError(res, errObjOrStr, message, code) {
	var reason = !!errObjOrStr && errObjOrStr.message ? errObjOrStr.message : errObjOrStr;
	console.log('API ERROR: ' + reason, message);
	res.status(code || 500).json({
		"error": message
	});
}