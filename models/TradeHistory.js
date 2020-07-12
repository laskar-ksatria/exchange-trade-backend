const mongoose = require('mongoose');

const TradeHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pair: {
        type: String,
    },
    currency: {
        type: String,
    },
    amount: {
        type: Number
    },
    price: {
        type: Number
    },
    filled: {
        type: Number
    },
    amount_start: {
        type: Number
    },
    first_type: {
        type: String,
    },
    last_type: {
        type: String
    }
})


const history = mongoose.model('TradeHistory', TradeHistorySchema);

module.exports = history;