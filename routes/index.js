// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js');

module.exports = function(app) {
	app.get('/', function(req, res) {
		Post.get(null, function (err, posts) {
			if(err) {
				posts = []
			}
			res.render('index', {
				title: 'Index',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/reg', checkNotLogin);
	app.get('/reg', function (req, res) {
		res.render('reg', {
			title: 'Register',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];

		if (password_re != password) {
			req.flash('error', 'different password you type for the two times');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: name,
			password: password,
			email: req.body.email
		});

		User.get(newUser.name, function (err, user) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			if (user) {
				req.flash('error', 'user existed!');
				return res.redirect('/reg');
			}

			newUser.save(function (err, user) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				req.session.user = newUser;
				req.flash('success', 'register succeed');
				res.redirect('/');
			});
		});
	});

	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: 'Login',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		// check user existance
		User.get(req.body.name, function (err, user) {
			if(!user) {
				req.flash('error','User not existed!');
				return res.redirect('/login');
			}
			// check password correctness
			if (user.password != password) {
				req.flash('error', "password does not match");
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success', "login succeed");
			res.redirect('/');
		});
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: 'Post',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.post('/post', checkLogin);
	app.post('/post', function (req, res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);

		post.save(function (err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success',"post succeed!");
			res.redirect('/');
		});
	});

	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res) {
		req.session.user = null;
		req.flash('success', "logout successfully");
		res.redirect('/');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res) {
		res.render('upload', {
			title: 'Upload files',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', 'Have not login!'); 
			res.redirect('/login');
		}
		next();
	}

  	function checkNotLogin(req, res, next) {
  		if (req.session.user) {
  			req.flash('error', 'Have already Login!'); 
  			res.redirect('back');
  		}
  		next();
  	}
};