const express = require('express');
const Router = express.Router();
const UserController = require('../controllers/userController');
const TradeController = require('../controllers/TradeController');
const { userAuth } = require('../middlewares/auth')


//User auth
Router.get('/users', UserController.readAll);
Router.post('/users', UserController.createAccount);
Router.post('/users/login', UserController.login);

//Trade
Router.get('/trade/limit', TradeController.readAllLimit);
Router.get('/trade/myLimitTrade', userAuth,TradeController.readAllmyLimit);
Router.post('/trade/limit/buy', userAuth,TradeController.createBuyLimitOrder, TradeController.checkBuyOrder);
Router.post('/trade/limit/sell', userAuth, TradeController.createSellLimitOrder, TradeController.checkSellOrder);

//injection
const Account = require('../models/account');

Router.get('/account', (req,res,next) => {
    let userId = ['5f092627e50f97310cdc4397', '5f09fced30da311758bf3659', '5f0adc185e87363cfc52e94a', '5f092684e50f97310cdc4398', '5f0adc185e87363cfc52e94a']
    let createdAccounts = [];
    userId.forEach(item => {
        createdAccounts.push(Account.create({user: item}));
    });

    Account.create({user: '5f0afe3e74f7cb3b705fe0fe'}).then(user => res.send("oke"))
    Promise.all(createdAccounts)
        .then(accounts => {
            res.status(200).json(accounts)
        })
})

Router.get('/accounts', (req,res,next) => {
    Account.find({}).then(accounts => {res.status(200).json(accounts)})
    // Account.deleteMany({}).then(() => res.send("oke"))
});

const LimitTrade = require('../models/LimitTrade');
Router.get('/deletelimit', (req,res,next) => {
    LimitTrade.deleteMany({}).then(() => res.send("Oke"))
})
module.exports = Router;