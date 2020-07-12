const LimitTrade = require('../models/LimitTrade');
const TradeHistory = require('../models/TradeHistory');
const Account = require('../models/account');
const { generateText } = require('../helpers/index')

class TradeController {

    static readAllLimit(req,res,next) {
        let pair = req.query.pair;
        LimitTrade.find({pair}).then(pair => res.status(200).json(pair))
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
        
        let objectText = generateText(second_currency);
        console.log(objectText)
        Account.findOne({user})
            .then(userAccount => {
                console.log(userAccount)
                if (userAccount) {
                    if (objectText) {
                        if (userAccount[`${objectText}`] < amount) {
                            next({message: `Your balance is not enough`})
                        }else {
                            leftAmount = userAccount[`${objectText}`] - amount;
                            return LimitTrade.create({user, pair, first_currency, second_currency, amount, price, amount_start: amount, order_type})
                                .then(limitTrade => {
                                    Account.updateOne({user}, {[`${objectText}`]: leftAmount}, {omitUndefined: true})
                                        .then(() => {
                                            res.status(200).json({message: 'Your order has been created'})
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

    };

    static createSellLimitOrder(req,res,next) {

    };

    static checkSellOrder(req,res,next) {

    };

    static updateTradeLimit(req,res,next) {
        let tradeId = req.params.tradeId;
        
    };

};

module.exports = TradeController;