// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;
var crypto = require('crypto'),
	User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require(('../models/comment.js'));

module.exports = function(app) {
	app.get('/', function(req, res) {
		Post.getAll(null, function (err, posts) {
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

	app.post('/upload', checkLogin);
	app.post('/upload', function(req, res) {
		req.flash('success', 'File upload successfully');
		res.redirect('/upload');
	});

	app.get('/u/:name', function(req, res) {
		User.get(req.params.name, function(err, user) {
			if(!user) {
				req.flash('error', "User not exist");
				return res.redirect('/');
			}
			Post.getAll(user.name, function(err, posts) {
				if(err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function (req, res) {
		Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
					date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

		var comment = {
			name: req.body.name,
			email: req.body.email,
			website: req.body.website,
			time: time,
			content: req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err) {
			if(err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			req.flash('success',"comment submitted.");
			res.redirect('back');
		});
	});

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function (req, res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('back');
			}
			res.render('edit', {
				title: 'Edit',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function (req, res) {
		var currentUser = req.session.user;
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if (err) {
				req.flash('error', err); 
				return res.redirect(url);//出错！返回文章页
			}
			req.flash('success', '修改成功!');
			res.redirect(url);//成功！返回文章页
		});
	});

	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function (req, res) {
		var currentUser = req.session.user;
		Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
			if (err) {
				req.flash('error', err); 
				return res.redirect('back');
			}
		req.flash('success', '删除成功!');
		res.redirect('/');
		});
	});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', 'Have not login!'); 
			res.redirect('/login');
		}
		next();
	};

  	function checkNotLogin(req, res, next) {
  		if (req.session.user) {
  			req.flash('error', 'Have already Login!'); 
  			res.redirect('back');
  		}
  		next();
  	};
};