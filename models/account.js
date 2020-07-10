const mongoose = require('mongoose');

const accountSchema = new mongoose({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    balance: {
        type: Number
    },
    BTC_coin: {
        type: Number,
    },
    ETH_coin: {
        type: Number,
    },
    BNB_coin: {
        type: Number
    }
})

const account = mongoose.model('Account', account);