
const express = require ('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require ('bcrypt-nodejs');
const knex = require('knex')

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres', //from owner column from the DB (\d command)
    password : '',
    database : 'smart-brain'
  }
});

db.select('*').from('users').then(data => {
	console.log(data);
});

const app = express();

app.use (bodyParser.json());
app.use (cors());

app.post ('/signin', (req, res)=>{
	db.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data=>{
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		console.log(isValid);
			if (isValid){
				return db.select('*').from('users')
				.where('email', '=', req.body.email)
				.then (user =>{
					console.log(user)
					res.json(user[0])
				})
				.catch(err => res.status(400).json ('unable to get user'))
			}
			else {

			res.status(400).json('wrong password or username')
			}
	})
	.catch(err=> res.status(400).json('wrong credentianls'))
})

app.post ('/register', (req, res) => {
	const { email, name, password} = req.body;
	if (!email||!name||!password){
		return res.status(400).json('incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert ({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning ('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
			}).then(user => {
					
				res.json(user[0]);
			})			
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})

	.catch(err => res.status(400).json('unable to register'))
	})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select ('*').from('users').where({id})
	.then(user=>{
		if (user.length){
		res.json(user[0]);
		} else {
			res.status(400).json('not found')
		}
	})
	.catch(err => res.status(400).json('error getting user'))
})


app.put('/image', (req, res) =>{
		const { id } = req.body;
	  db('users').where('id', '=', id)
 		.increment('entries', 1)
 		.returning('entries')
 		.then(entries=>{
 			response.json(entries[0]);
 		})
 		.catch(err => res.status(400).json(""))
	
})

app.listen(3000, () =>{
	console.log ('app is running on port 3000')
});

// res = this is working
//signin => POST = success/fail
//register => POST = user
//profile/:userID = get = user
//image => PUT = user
