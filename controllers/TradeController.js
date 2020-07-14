const LimitTrade = require('../models/LimitTrade');
const TradeHistory = require('../models/TradeHistory');
const Account = require('../models/account');
const { generateText } = require('../helpers/index');
const trade = require('../models/LimitTrade');
const { userAuth } = require('../middlewares/auth');

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
                            leftAmount = userAccount[`${objectText}`] - total
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
                                        }).catch(next)
                                }).catch(next)
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
        let Io = req.Io;
        let myTrade = req.myTrade;
        let { order_type, first_currency, second_currency } = req.body;
        let pair = req.query.pair;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        LimitTrade.find({price: {$lte: price}, order_type: 'sell', pair}).sort({price: 'asc'})
            .then(filterTrade => {
                let limitAmount = amount;
                let limitStart = 0;
                let updateLimit = [];
                let tradeHistory = [];
                let lastLimitTrade; //Last Limit trade not 100% filled
                let leftAmount; // last amount not 100% filled

                filterTrade.forEach(item => {
                    if (limitStart < limitAmount) {
                        limitStart += item.amount
                        if (limitStart <= limitAmount) {
                            updateLimit.push(LimitTrade.deleteOne({_id: item.id}))
                            tradeHistory.push(TradeHistory.create({user: item.user, pair: item.pair, order_type: item.order_type, price: item.price, first_currency: item.first_currency, second_currency: item.second_currency, amount_start: item.amount_start, amount: item.amount}))
                        }else {
                            lastLimitTrade = item;
                            lastAmount = item.amount;
                        }
                    }
                })
                if (limitStart > limitAmount) {
                    let avg = limitStart - limitAmount;
                    leftAmount = lastLimitTrade.amount - limitAmount;
                    let average = 1 - (avg / lastLimitTrade.amount_start);
                    //Update my account
                    updateLimit.push(LimitTrade.deleteOne({_id: myTrade.id}));
                    tradeHistory.push(TradeHistory.create({user: myTrade.user, pair: myTrade.pair, order_type: myTrade.order_type, amount: myTrade.amount, price: myTrade.price, first_currency: myTrade.first_currency, second_currency: myTrade.second_currency, amount_start: myTrade.amount_start }))
                    //Update lastAccount
                    updateLimit.push(LimitTrade.updateOne({_id: lastLimitTrade.id}, {amount: leftAmount, filled: average}, {omitUndefined: true}))
                    tradeHistory.push(TradeHistory.create({user: lastLimitTrade.user, price: lastLimitTrade.price, amount: Number(avg), amount_start: lastLimitTrade.amount_start, first_currency: lastLimitTrade.first_currency, second_currency: lastLimitTrade.second_currency, pair: lastLimitTrade.pair, order_type: order_type}))
                }else {
                    let avg = myTrade.amount_start - limitStart;
                    leftAmount = limitAmount - limitStart
                    let average = avg / myTrade.amount_start
                    if (limitStart === limitAmount) {
                        updateLimit.push(LimitTrade.deleteOne({_id: myTrade.id}))
                    }else {
                        updateLimit.push(LimitTrade.updateOne({_id: myTrade.id}, {amount: avg, filled: average}, {omitUndefined: true}));
                    }
                    tradeHistory.push(TradeHistory.create({user: myTrade.user, pair: myTrade.pair, order_type: myTrade.order_type, amount: leftAmount, price: myTrade.price, first_currency: myTrade.first_currency, second_currency: myTrade.second_currency, amount_start: myTrade.amount_start }))
                }
                return Promise.all(updateLimit)
                    .then(value => {
                        return Promise.all(tradeHistory)
                            .then(value => {
                                LimitTrade.find({pair})
                                    .then(limitTrades => {
                                        Io.emit(`${pair}-limit`, {limitTrades, order_type: 'all'})
                                        res.status(200).json({message: "Your order has been created"})
                                    })
                            })
                    })
            }).catch(next)
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