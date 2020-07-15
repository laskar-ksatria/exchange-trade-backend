const mongoose = require('mongoose');

const TradeHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pair: {
        type: String,
    },
    order_type: {
        type: String
    },
    amount: {
        type: Number
    },
    price: {
        type: Number
    },
}, {versionKey: false, timestamps: {createdAt: 'createdAt'}})


const history = mongoose.model('TradeHistory', TradeHistorySchema);

module.exports = history;