const LimitTrade = require('../models/LimitTrade');
const TradeHistory = require('../models/TradeHistory');
const Account = require('../models/account');
const { generateText } = require('../helpers/index');
const { update } = require('../models/LimitTrade');


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
        let pair = req.query.pair
        let { order_type, first_currency, second_currency } = req.body;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        let objectText2 = generateText(first_currency);
        let objectText = generateText(second_currency);
        let myAllOrder = [];
        let myLimitTotal = 0;
        let myBalance;
        let total;
        if (objectText === 'balance') {
            total = amount * price;
        }else {
            total = amount;
        }

        Account.findOne({user})
            .then(userAccount => {
                if (userAccount) {
                    myBalance = userAccount[`${objectText}`];
                    //Req for next
                    req.myFirstBalance = myBalance;
                    req.mySecondBalance = userAccount[`${objectText2}`]
                    req.myAccountId = userAccount.id;
                    //-------------------
                    return LimitTrade.find({user, order_type, pair})
                        .then(limitTrades => {
                            if (limitTrades.length > 0) {
                                limitTrades.forEach(e => {                                   
                                        myLimitTotal += e.total
                                })
                                myLimitTotal += total;
                                if (myBalance < myLimitTotal) {
                                    next({message: "You dont have enough balance"})
                                }else {
                                    LimitTrade.create({user, pair, amount, price, total, first_currency, second_currency, order_type, amount_start: amount})
                                        .then(myTrade => {
                                            req.myTrade = myTrade;
                                            return LimitTrade.find({order_type, pair})
                                                .then(limitTrades => {
                                                    Io.emit(`${pair}-limit`, {limitTrades, order_type})
                                                    next();
                                                })
                                        })
                                }
                            }else {
                                if (myBalance < total) {
                                    next({message: 'You dont have enough balance'});
                                }else {
                                    LimitTrade.create({user, pair, amount, price, total, first_currency, second_currency, order_type, amount_start: amount})
                                        .then(myTrade => {
                                            req.myTrade = myTrade;
                                            return LimitTrade.find({order_type, pair})
                                                .then(limitTrades => {
                                                    Io.emit(`${pair}-limit`, {limitTrades, order_type})
                                                    next();
                                                })
                                        })
                                }
                            }
                        })
                }else {
                    next({message: 'You dont have account'})
                }
            })
            .catch(err => console.log(err))
        
    };

    static checkBuyOrder(req,res,next) {
        console.log("Masuk checkBuy")
        let Io = req.Io;
        let user = req.decoded.id;
        let myTrade = req.myTrade;
        let myAccountId = req.myAccountId;
        let pair = req.query.pair;
        let { order_type, second_currency, first_currency } = req.body;
        let amount = Number(req.body.amount);
        let price = Number(req.body.price);
        let firstObjectText = generateText(first_currency);
        let objectText = generateText(second_currency)

        LimitTrade.find({order_type: 'sell', pair, price: {$lte: price}}).sort({price: 'desc'})
            .then(filterTrades => {
                if (filterTrades.length > 0) {
                    let updateLimit = [];
                    let history = [];
                    let accountData = [];
                    let lastTrade;
                    let limitAmount = amount;
                    let limitStart = 0;
                    let updateAccount = [];
                    let findAccount = [];

                    let leftAmount;
                    let leftLastBalance;
                    let totalMinusBalance = 0
                    let totalPlusBalance = 0

                    filterTrades.forEach(item => {
                        if (limitStart < limitAmount) {
                            let updateBalance;
                            limitStart += item.amount;
                            
                            if (limitStart > limitAmount) {
                                //Condition if last trade have plus amount
                                console.log("Masuk kondisi atas")
                                lastTrade = item;
                            }else {
                                console.log("Masuk kondisi bawah")
                                if (objectText === 'balance') {
                                    updateBalance = item.amount * item.price;
                                }else {
                                    updateBalance = item.amount;
                                }

                                totalMinusBalance += updateBalance;
                                totalPlusBalance += item.amount;

                                let { amount, price, order_type, user, pair } = item;
                                
                                updateLimit.push(LimitTrade.deleteOne({_id: item.id}));
                                history.push(TradeHistory.create({user, amount, price, order_type, pair}));
                                history.push(TradeHistory.create({user: myTrade.user, amount: item.amount, price: item.price, order_type: myTrade.order_type, pair: myTrade.pair}))
                                
                            }
                        }
                    })//END FOREACH

                    let { myFirstBalance, mySecondBalance, myAccountId } = req;
                    // Io.emit(`${myTrade.user}-${pair}`, {objectText2: objectText, objectText1: firstObjectText, myFirstBalance: mySecondBalance + totalPlusBalance, mySecondBalance: myFirstBalance - totalMinusBalance})
                    Account.findOneAndUpdate({user: myTrade.user},{[`${firstObjectText}`]: mySecondBalance + totalPlusBalance, [`${objectText}`]: myFirstBalance - totalMinusBalance}, {new: true})
                        .then((trade) => {
                            console.log(trade)
                            Io.emit(`${myTrade.user}-${pair}`, trade);
                            res.status(200).json({message: 'Your order has been created'});
                        })

                }else {
                    res.status(202).json({message: 'Your order has been created'})
                }
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


                    // filterTrades.forEach(item => {
                    //     if (limitStart < limitAmount) {
                    //         let updateBalance;    
                    //         limitStart += item.amount;
                    //         if (limitStart > limitAmount) {
                    //             lastTrade = item;
                    //             findAccount.push(Account.findOne({user: item.user}));
                    //             leftLastBalance = item.amount - (limitStart - limitAmount) 
                    //             console.log(leftLastBalance, "last balance");
                            
                    //             if (objectText === 'balance') {
                    //                 updateBalance = item.amount * item.price;
                                    
                    //             }else {
                    //                 updateBalance = item.amount;
                    //             }
                    //             console.log(updateBalance, "updateBalance")
                    //             totalMinusBalance += updateBalance
                    //             totalPlusBalance += item.amount;
                    //             console.log()
                    //             updateAccount.push({user: item.user, updateBalance});
                    //             let avg = limitStart - limitAmount;
                    //             console.log(avg, "avg")
                    //             let average = 1 - (avg / item.amount_start);
                    //             console.log(average, "average")
                    //             updateLimit.push(LimitTrade.updateOne({_id: item.id}, {amount: leftLastBalance, filled: average}))
                    //         }else { 
                    //             findAccount.push(Account.findOne({user: item.user})); 
                    //             if (objectText === 'balance') {
                    //                 updateBalance = item.amount * item.price;
                    //             }else {
                    //                 updateBalance = item.amount;
                    //             }
                    //             updateAccount.push({user: item.user, updateBalance});
                    //             updateLimit.push(LimitTrade.deleteOne({_id: item.id}))
                    //         }
                    //     }
                    // })

                    // console.log(totalPlusBalance, "totalPlusBalance");
                    // console.log(totalMinusBalance, "totalMinusBalance");
                
                    // if (limitStart > limitAmount) {
                    //     let { user, amount, price, order_type  } = myTrade;
                    //     updateLimit.push(LimitTrade.deleteOne({_id: myTrade.id}));
                    //     history.push(TradeHistory.create({user, amount, price, order_type}))
                    // }

                    

                    // console.log(limitStart, "limitStarr")


                    // res.end()