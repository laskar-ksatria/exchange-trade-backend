const express = require('express');
const Router = express.Router();
const UserController = require('../controllers/userController');
const TradeController = require('../controllers/TradeController');
const { userAuth } = require('../middlewares/auth');
const  Account = require('../models/account');

//User auth
Router.get('/users', UserController.readAll);
Router.post('/users', UserController.createAccount);
Router.post('/users/login', UserController.login);

//Trade
Router.get('/trade/limit', TradeController.readAllLimit);
Router.get('/trade/myLimitTrade', userAuth,TradeController.readAllmyLimit);
Router.post('/trade/limit/buy', userAuth,TradeController.createBuyLimitOrder, TradeController.checkBuyOrder);
Router.post('/trade/limit/sell', userAuth, TradeController.createSellLimitOrder, TradeController.checkSellOrder);

//Account
Router.get('/account', userAuth, (req,res,next) => {
    Account.findOne({user: req.decoded.id})
        .then(account => {
            res.status(200).json(account);
        })
});










//injection
const TradeHistory = require('../models/TradeHistory');

Router.get('/historydelete', (req,res,next) => {
    TradeHistory.deleteMany({}).then(() => res.send("oke history has been delete"))
})

Router.get('/account', (req,res,next) => {
    let userId = ['5f0bcd2871e16b3dc8d2037f', '5f0bcd4471e16b3dc8d20380', '5f0bcd9571e16b3dc8d20381', '5f0bcdb371e16b3dc8d20382', '5f0bcddd71e16b3dc8d20384']
    let createdAccounts = [];
    userId.forEach(item => {
        createdAccounts.push(Account.create({user: item}));
    });

    Account.create({user: '5f0afe3e74f7cb3b705fe0fe'}).then(user => res.send("oke"))
    Promise.all(createdAccounts)
        .then(accounts => {
            res.status(200).json(accounts)
        })
});

const User = require('../models/user');

Router.get('/delete-user', (req,res,next) => {
    User.deleteMany({}).then(() => res.send("poke"))
})

Router.get('/accounts', (req,res,next) => {
    Account.find({}).then(accounts => {res.status(200).json(accounts)})
    // Account.deleteMany({}).then(() => res.send("oke"))
});

const LimitTrade = require('../models/LimitTrade');
const user = require('../models/user');
Router.get('/deletelimit', (req,res,next) => {
    LimitTrade.deleteMany({}).then(() => res.send("Oke"))
})

Router.get('/deleteAccount', (req,res,next) => {
    Account.deleteMany({}).then(() => res.send("oke delete"))
})
module.exports = Router;