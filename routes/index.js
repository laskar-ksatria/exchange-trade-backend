const express = require('express');
const Router = express.Router();
const UserController = require('../controllers/userController');
const { userAuth } = require('../middlewares/auth')


//User auth
Router.get('/', UserController.readAll);
Router.post('/', UserController.createAccount);
Router.post('/login', UserController.login);

//Trade
// Router.get('/')



module.exports = Router;