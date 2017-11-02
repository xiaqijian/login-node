const express = require('express');
const app =  express();
const ejs = require('ejs');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'admin123',
  database : 'test'
});
 
app.use('/static',express.static(__dirname+'/static'));
app.set('views', path.join('views'));
app.engine('html',ejs.renderFile);
app.set('view engine', 'html');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser());
app.use(session({
  name:'xiaqijianid',
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
		maxAge: 1000 * 1000  // 有效期，单位是毫秒
	}
}))

// app.use(function(req,res,next){
// 	var url = req.originalUrl;
//     if (url != "/login" && !req.session.username && url !="/register") {
//         return res.redirect("/login");
//     }
//     next();
// })

app.use(function(req,res,next){
	 var url = req.originalUrl;
	// console.log(req.session.islogin)
	// if(req.session.islogin==true && url != "/home"){
	// 	res.redirect("/home");
	// }else {
		console.log(req.cookies.name)
		if(!req.cookies.name && url != "/login"){
			console.log('3333')
			return res.redirect("/login");
		}else {
			next()
		}
		
	// }
	// next();
})





app.route('/')
	.get(function(req,res){
			if(req.cookies.name=='value'){
				res.redirect('home')
			}else {
				res.render('index')
			}
	})

app.route('/login')
	.get(function(req,res){
		res.render('login',{ title:'用户登录'})
	})
	.post(function(req,res){
		var email = req.body.email;
		var password = req.body.password;
		console.log(password);
		queryMysql(email,password,function(data,name){
			console.log(data)
			console.log(typeof data)
			if(data==="登陆成功"){
				req.session.islogin = true;
				req.session.username = name;
				res.cookie('name', 'value');
				res.redirect('/home')
			}else {
				res.send(data)
			}
			
		});
		
	})

app.route('/register')
   .get(function(req,res){
   		res.render('register')
   })
   .post(function(req,res){
   		var email = req.body.email;
   		var username = req.body.username;
   		var password = req.body.password;
   		addMysql(email,username,password);
   		// console.log(req.body);
   		res.redirect('/login')
   })

app.route('/home')
   .get(function(req,res){
   		res.render('home',{ name:req.session.username})
   })

app.route('/loginout')
   .get(function(req,res){
   		req.session = null;

   		res.clearCookie('name');
   		res.redirect('/')
   })

app.route('/lists')
	.get(function(req,res){
		res.render('lists',{ name:req.session.username})
	})

function addMysql(email,name,password){
	var  addSql = 'INSERT INTO test1(id,email,name,password) VALUES(0,?,?,?)';
	var  addSqlParams = [email, name,password];
	pool.getConnection(function (err, conn) {
	    if (err) console.log("POOL ==> " + err);
	    conn.query(addSql,addSqlParams,function(err,rows){
	        if (err){
	        	console.log('添加新用户失败')
	        }else {
	        	console.log('成功新添加用户'+name)
	        }
	        conn.release();
	    });
	});
}

function queryMysql(email,password,callback){
	var querymysql = 'select * from test1 where email="'+email+'";'
	console.log(querymysql);
	pool.getConnection(function(err,conn){
		console.log('4444444')
		// if (err) console.log("POOL ==> " + err);
	    conn.query(querymysql,function(err,rows){
	        if (err){
	        	console.log('查询失败')
	        	callback('数据库返回错误')
	        }else {
	        	if (rows.length===0) {
	        		console.log('用户为空')
	        	}else {
	        		console.log(rows);
		        	if(rows[0].password===password){

		        		callback('登陆成功',rows[0].name)
		        		console.log('登录成功')
		        	}else{
		        		console.log('密码错误')
		        		callback('密码错误','')
		        	}
	        	}
	        	
	        	
	        }
	        conn.release();
	    });
	})
}

function authorize(req,res,next){
	if (req.session.username) {
	    res.redirect('/login');
	} else {
	    next();
	}
}

app.listen('8888',function(){
	console.log('服务启动成功8888')
})