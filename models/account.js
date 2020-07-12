const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    balance: {
        type: Number,
        default: 10000000
    },
    BTC_coin: {
        type: Number,
        default: 10000
    },
    ETH_coin: {
        type: Number,
        default: 10000
    },
    LTC_coin: {
        type: Number,
        default: 10000
    }
})

const account = mongoose.model('Account', accountSchema);

module.exports = account