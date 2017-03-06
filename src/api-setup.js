const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;
const bodyParser = require("body-parser");

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;

const dbtools = require('./dbtools.js');
const apiUrl = require('./api-url.js');

const _ = require('lodash');
const waterfall = require('async/waterfall')

const C_FORUM_GROUPS = "forum_groups";
const C_FORUMS = "forums";
const C_THEMES = "themes";
const C_REPLIES = "replies";
const C_USERS = "users";
const C_VOTES = "rating_votes";

module.exports = function (app) {
	dbtools.connect();
	app.use(bodyParser.json());
	setupAuth(app);
	setupApi(app);
}

function setupAuth(app) {
	// Local auth
	// http://passportjs.org/docs/username-password
	passport.use(new LocalStrategy(
		function (email, password, done) {
			dbtools.getDb().collection(C_USERS).findOne({
				email: email
			}, function (err, user) {
				if (err) {
					return done(err);
				}
				if (!user || !bcrypt.compareSync(password, user.pwd)) {
					return done(null, false, {
						message: 'XXXX'
					});
				}
				return done(null, user);
			});
		}
	));

	// Configure Passport authenticated session persistence.
	passport.serializeUser(function (user, cb) {
		cb(null, user._id);
	});

	passport.deserializeUser(function (_id, cb) {
		dbtools.getDb().collection(C_USERS).findOne({
			_id: ObjectID(_id)
		}, function (err, user) {
			if (err) {
				return cb(err);
			}
			cb(null, user);
		});
	});

	// Use application-level middleware for common functionality, including
	// logging, parsing, and session handling.
	//app.use(require('morgan')('combined'));
	app.use(require('cookie-parser')());
	app.use(require('body-parser').urlencoded({
		extended: true
	}));
	app.use(require('express-session')({
		secret: 't0psecret',
		resave: false,
		saveUninitialized: false
	}));

	// Initialize Passport and restore authentication state, if any, from the
	// session.
	app.use(passport.initialize());
	app.use(passport.session());

	var resultUrl = apiUrl + 'auth/result';

	app.post(apiUrl + 'auth/in',
		passport.authenticate('local', {
			successRedirect: resultUrl,
			failureRedirect: resultUrl
		})
	);

	app.post(apiUrl + 'auth/out', function (req, res) {
		req.logout();
		res.redirect(resultUrl);
	});

	app.get(apiUrl + 'auth/result', function (req, res) {
		if (req.user) {
			req.user.pwd = '<NO>';
		}
		res.json({
			user: req.user
		});
	});


	/**
		Reqistration
	*/
	const bcrypt = require('bcrypt');
	const saltRounds = 8;

	app.post(apiUrl + 'auth/reg', function (req, res) {
		if (req.user) {
			// user already authed
			req.logout();
		}
		// checking request data
		var reqd = ['email', 'password'];
		for (let k of reqd) {
			if (typeof req.body[k] === 'undefined') {
				handleError(res, err, 'Not enough data (' + k + ')');
				return;
			}
		}

		var newUser = _.pick(req.body, ['email', 'name']);
		newUser.date = new Date;
		newUser.online = true;
		newUser.rating_total = 0;
		newUser.pic = 'userpics/2.png';

		var db = dbtools.getDb();

		waterfall([
			// check if email is unique
			// TODO create unique constraint on email
			// https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/
			function (next) {
				db.collection(C_USERS).find({
					email: req.body.email
				}).toArray(function (err, docs) {
					//console.log(err || docs.length !== 0)
					var fail = err || docs.length !== 0;
					next(err || docs.length !== 0 ? 'User with speciafied email already exists' : null)
				})
			},
			// Generating pwd hash
			function (next) { // TODOOOOO
				//console.log('bcrypt.hash', arguments)
				bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
					newUser.pwd = hash;
					next();
				});
			},
			// Inserting user
			function (next) {
				db.collection(C_USERS)
					.insertOne(newUser, function (err, insert) {
						newUser = insert.ops[0];
						next(err || !insert.result.ok ? 'Failed to create new user' : null);
					});
			}
		], waterfallFinal)

		function waterfallFinal(err) {
			if (err) {
				handleError(res, err, err);
			}
			else {
				req.login(newUser, function (err) {
					if (err) {
						// potential error from the login() callback would come from your serializeUser() function
						handleError(res, 'Automatic login of new user failed');
					}
					else {
						newUser.pwd = '<NO>';
						res.status(201).json(newUser).end();
					}
				})
			}
		}
	});


}

function setupApi(app) {

	app.get(apiUrl + 'commondata', function (req, res) {
		res.status(200).json({
			currentUser: req.user
		}).end();
	});

	app.get(apiUrl + 'user/:user_id', function (req, res) {
		var user_id = ObjectID(req.params.user_id);
		dbtools.getDb().collection(C_USERS).findOne({
			_id: user_id
		}, function (err, doc) {
			if (err) {
				handleError(res, err, "Failed to get user.");
			}
			else {
				res.status(200).json(doc).end();
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
				res.status(200).json(docs).end();
			}
		});
	});

	app.post(apiUrl + 'themes', function (req, res) {
		var author_id = ObjectID(req.user._id);
		var newTheme;

		// Creating first reply
		var newReply = {
			text: req.body._TEMP_firstReply,
			rating: 0,
			author_id: author_id,
			theme_id: null, // to be updated
			date: new Date()
		}
		dbtools.getDb().collection(C_REPLIES)
			.insertOne(newReply, function (err, insert) {
				if (err || !insert.result.ok) {
					handleError(res, err, 'Failed to create first reply');
				}
				else {
					newReply._id = ObjectID(insert.ops[0]._id);
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

			dbtools.getDb().collection(C_THEMES)
				.insertOne(newTheme, function (err, insert) {
					if (err || !insert.result.ok) {
						handleError(res, err, 'Failed to create new theme');
					}
					else {
						newReply.theme_id = ObjectID(insert.ops[0]._id);
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

	app.get(apiUrl + 'theme/:theme_id', function (req, res) {
		dbtools.getDb().collection(C_THEMES).findOne({
			_id: new ObjectID(req.params.theme_id)
		}, function (err, doc) {
			if (err) {
				handleError(res, err, "Failed to get contact");
			}
			else {
				var data = {
					theme: doc
				}
				getReplies(req, res, data); // request ends inside getReplies
			}
		});
	});

	app.get(apiUrl + 'theme/:theme_id/replies', function (req, res) {
		getReplies(req, res)
	});

	function getReplies(req, res, data) {
		data = data || {};
		var pageSize = 20;
		var pageNum = req.query.pageNum | 0 || 1;
		var skipSize = pageSize * (pageNum - 1);
		var findCriteria = {
			theme_id: ObjectID(req.params.theme_id)
		};
		var aRules = [{
			$match: findCriteria
		}, {
			$lookup: {
				from: C_USERS,
				localField: 'author_id',
				foreignField: '_id',
				as: 'author'
			}
		}, {
			$unwind: '$author'
		}, { 
			$skip: skipSize // yup, Shlemiel The Painter
		}, {
			$limit: pageSize
		}];

		dbtools.getDb().collection(C_REPLIES)
			.aggregate(aRules)
			.toArray(function (err, docs) {
				if (err || !docs) {
					handleError(res, err, 'Failed to get theme replies');
				}
				else {
					data.replies = docs;
					// mongodb v.3.4 supports $count stage in aggregation
					// so theres no need to make an additional count request
					// but now I have only v.3.2, so...
					dbtools.getDb().collection(C_REPLIES)
						.count(findCriteria, function (err, count) {
							data.pager = {
								total: count,
								current: pageNum,
								last: Math.ceil(count / pageSize)
							}
							res.status(200).json(data).end();
						});
					
				}
			});
	}

	app.post(apiUrl + 'replies', function (req, res) {
		var author_id = ObjectID(req.user._id);
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

		// todo upd theme.last_reply_id and theme.last_reply_author_id

		dbtools.getDb().collection(C_REPLIES)
			.insertOne(newReply, function (err, insert) {
				if (err) {
					handleError(res, err, 'Failed to create reply');
				}
				else {
					res.status(201).json(insert.ops[0]).end();
				}
			});
	});

	app.post(apiUrl + 'vote', function (req, res) {
		req.body.author_id = ObjectID(req.user._id);
		req.body.reply_id = ObjectID(req.body.reply_id);
		req.body.date = new Date();
		req.body.value = req.body.value | 0;

		var newVote = _.pick(req.body, ['author_id', 'reply_id', 'date', 'value']); // prevent sending bloating requests. 
		// TODO make it api-wide
		// TODO validate types also
		// TODO make that stuff in a module

		// TODO think about rollback
		// TODO check if author votes for his own reply (send HTTP 400)
		var db = dbtools.getDb();

		var rating_total = 0;
		var reply_rating = 0;
		var reply_author_id;

		// next() callback is using without transferring args down the waterfall
		// instead of it, vars (i.e. reply_rating) is function-wide 
		// and args is using for error handling
		// arguments of next:
		// 	1. db err object OR boolean (empty response). Both of them are works as an error flag
		//	2. human-readable error text
		waterfall([
				// 1. Create|Update vote document
				function (next) {
					db.collection(C_VOTES)
						.update({
							author_id: newVote.author_id,
							reply_id: newVote.reply_id
						}, newVote, {
							upsert: true // insert if not exists, updates if exist
						}, function (err, doc, upserted) {
							next(err || !doc, 'Failed to ' + (upserted ? 'create' : 'update') + ' vote');
						});
				},
				// 2. Find all votes for current reply and recalculate its rating
				function (next) {
					// sure it could be done incremental way
					// but lets check first if full recalculation is fast enough
					// because of lack of multi transaction rollback in mongo
					db.collection(C_VOTES)
						.find({
							reply_id: newVote.reply_id
						})
						.toArray(function (err, votes) {
							votes = votes || [];
							for (let i = 0; i < votes.length; i++) {
								reply_rating += votes[i].value | 0;
							}
							next(err || votes.length, 'Failed to find all votes for current reply');
						});
				},
				// 3. Update rating of a current reply
				function (next) {
					db.collection(C_REPLIES)
						.update({
							_id: newVote.reply_id
						}, {
							$set: {
								rating: reply_rating
							}
						}, function (err, doc) {
							next(err || !doc, 'Failed to update rating of voted reply');
						});
				},
				// 4. Find author of voted reply
				function (next) {
					db.collection(C_REPLIES)
						.findOne({
							_id: newVote.reply_id
						}, function (err, doc) {
							reply_author_id = ObjectID(doc.author_id);
							next(err || !doc, 'Failed to find author of voted reply')
						});
				},
				// 5. Find all replies of author of voted reply and recalculate his rating
				function (next) {
					db.collection(C_REPLIES)
						.find({
							author_id: reply_author_id
						})
						.toArray(function (err, docs) {
							docs = docs || [];
							for (let i = 0; i < docs.length; i++) {
								rating_total += docs[i].rating | 0;
							}
							next(err || docs.length, 'Failed to find all replies of author of voted reply')
						});
				},
				// 6. Update rating of author of voted reply
				function (next) {
					// sure it could be done incremental way
					// but lets check first if full recalculation is fast enough
					// because of lack of multi transaction rollback in mongo
					db.collection(C_USERS)
						.update({
							_id: reply_author_id
						}, {
							$set: {
								rating_total: rating_total
							}
						}, function (err, doc) {
							next(err || !doc, 'Failed to update rating_total of author of voted reply');
						});
				}
			],
			// 
			function (err, humanErr) {
				if (err) {
					handleError(res, err, humanErr);
				}
				else {
					res.status(201).json({
						author_rating_total: rating_total,
						reply_rating: reply_rating
					}).end();
				}
			})

	});

	/*	
		GET		find contact by id
		PUT		update contact by id
		DELETE	deletes contact by id
	 */

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
				res.status(200).json(docs).end();
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
				res.status(200).json(docs).end();
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
	console.log('API ERROR: ' + reason);
	res.status(code || 500).json({
		"error": message
	}).end();
}

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