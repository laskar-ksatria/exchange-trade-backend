const LimitTrade = require('../models/LimitTrade');
const TradeHistory = require('../models/TradeHistory');
const Account = require('../models/account');
const { generateText } = require('../helpers/index')

class TradeController {

    static readAllLimit(req,res,next) {
        let pair = req.query.pair;
        LimitTrade.find({pair}).then(trades => res.status(200).json(trades)).catch(err => console.log(err))
    };

    static readAllMarket(req,res,next) {
        let pair = req.query.pair;
        TradeHistory.find({pair}).then(marketTrade => res.status(200).json(marketTrade))
    };

    static readAllmyLimit(req,res,nexrt) {
        let user = req.decoded.id;
        let pair = req.query.pair;
        LimitTrade.find({pair, user}).then(limitTrade => res.status(200).json(limitTrade));
    };

    static readAllmyMarket(req,res,next) {
        let user = req.decoded.id;
        let pair = req.query.pair;
        TradeHistory.find({pair, user}).then(marketTrade => res.status(200).json(marketTrade));
    };

    static deleteMyLimit(req,res,next) {
        let user = req.decoded.id;
        let limitTradeId = req.query.limitTrade;
        LimitTrade.deleteOne({limitTradeId}).then(() => res.status(201).json({message: 'Your order has been cancel'}))
    };  

    static createBuyLimitOrder(req,res,next) {
        let user = req.decoded.id;
        let Io = req.Io;
        let pair = req.query.pair;
        let { first_currency, second_currency, order_type } = req.body;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        let leftAmount;
        let total;
        if (second_currency === 'usd') {
            total = amount * price;
        }else {
            total = amount;
        }
        
        let objectText = generateText(second_currency);
        Account.findOne({user})
            .then(userAccount => {
                if (userAccount) {
                    if (objectText) {
                        if (userAccount[`${objectText}`] < total) {
                            next({message: `Your balance is not enough`})
                        }else {
                            leftAmount = userAccount[`${objectText}`] - amount;
                            return LimitTrade.create({user, pair, first_currency, second_currency, amount, price, amount_start: amount, order_type})
                                .then(limitTrade => {
                                    req.myTrade = limitTrade;
                                    Account.updateOne({user}, {[`${objectText}`]: leftAmount}, {omitUndefined: true})
                                        .then(() => {
                                            LimitTrade.find({order_type: 'buy'}).sort({price: 'asc'})
                                                .then(limitTrades => {
                                                    Io.emit(`${pair}-limit`, {limitTrades, order_type})
                                                    next();
                                                })
                                        }).catch(err => console.log(err))
                                }).catch(err => console.log(err))
                        }
                    }else {
                        next({message: 'Currency is not valid!'})
                    }
                }else {
                    next({message: "You must created account first"})
                }
            }).catch(err => console.log(err))
    }

    static checkBuyOrder(req,res,next) {
        // res.status(200).json({message: "Your order has been created"})
        let Io = req.Io;
        let myTrade = req.myTrade;
        let { pair, order_type, first_currency, second_currency } = req.body;
        
        
    };

    static createSellLimitOrder(req,res,next) {
        let user = req.decoded.id;
        let Io = req.Io;
        let pair = req.query.pair;
        let { first_currency, second_currency, order_type } = req.body;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        let amountLeft;
        let objectText = generateText(first_currency);

        Account.findOne({user})
            .then(userAccount => {
                if (userAccount) {
                    if (userAccount[`${objectText}`] < amount) {
                        next({message: 'Your balance not enough'})
                    }else {
                        amountLeft = userAccount[`${objectText}`] - amount;
                        LimitTrade.create({user, order_type,pair, price,first_currency, second_currency, amount, amount_start: amount})
                            .then(limitTrade => {
                                req.myTrade = limitTrade
                                return Account.updateOne({user}, {[`${objectText}`]: amountLeft}, {omitUndefined: true})
                                    .then(() => {
                                       return LimitTrade.find({order_type}).sort({price: 'asc'})
                                        .then(limitTrades => {
                                            Io.emit(`${pair}-limit`, {limitTrades, order_type});
                                            res.status(200).json({message: "Your order has been created"})
                                        })
                                    })
                            })
                    }
                }else {
                    next({message: "You dont have account"})
                }
            }).catch(err => console.log(err))
    };

    static checkSellOrder(req,res,next) {

    };

    static updateTradeLimit(req,res,next) {
        let tradeId = req.params.tradeId;
        
    };

};

module.exports = TradeController;