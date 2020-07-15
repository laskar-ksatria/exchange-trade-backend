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
        let Io = req.decoded.Io;
        let pair = req.query.pair
        let { order_type, first_currency, second_currency } = req.body;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        let objectText = generateText(second_currency);
        
        Account.findOne({user})
            .then(userAccount => {
                if (userAccount) {
                    let totalPrice;
                    let myLeftBalance;
                    let myBalance = userAccount[`${objectText}`];
                    if (objectText === 'balance') {
                        totalPrice = price * amount;
                    }else {
                        
                        totalPrice = amount
                    };
                    if (myBalance < totalPrice) {
                        console.log("Masuk ")
                        LimitTrade.create({user, order_type, pair, amount, price, first_currency, second_currency, amount_start})
                            .then(trade => {
                                req.myTrade = trade
                                LimitTrade.find({pair, order_type})
                                    .then(limitTrades => {
                                        console.log(limitTrades)
                                        Io.on(`${pair}-limit`, {limitTrades, order_type})
                                        next();
                                    })
                            })
                    }else {
                        next({message: 'You dont have enough balance'})
                    }

                }else {
                    next({message: 'You dont have account'})
                }
            })
    };

    static checkBuyOrder(req,res,next) {
        console.log("Masuk checkBuy")
        let user = req.decoded.id;
        let myTrade = req.myTrade;
        let pair = req.query.pair;
        let { order_type } = req.body;

        LimitTrade.find({pair, order_type: 'sell', price: {$lte: myTrade.price}}).sort({price: 'desc'})
            .then(filterTrades => {
                console.log(filterTrades);
                res.end()
            })
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
        let Io = req.Io;
        let myTrade = req.myTrade;
        let { order_type } = req.body;
        let pair = req.query.pair;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);

        LimitTrade.find({price: {$lte: price}, order_type: 'buy', pair}).sort({price: 'asc'})
            .then(filterTrade => {
                
            })

    };

};

module.exports = TradeController;