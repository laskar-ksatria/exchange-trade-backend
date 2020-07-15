const mongoose = require('mongoose');

const LimitTradeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pair: {
        type: String,
    },
    amount: {
        type: Number
    },
    price: {
        type: Number
    },
    filled: {
        type: Number,
        default: 0
    },
    amount_start: {
        type: Number
    },
    first_currency: {
        type: String,
        required: [true, 'First currency cannot be empty']
    },
    second_currency: {
        type: String,
        required: [true, 'Second currency cannot be empty']
    },
    order_type: {
        type: String
    },
    total: {
        type: Number
    }
}, {versionKey: false, timestamps: {createdAt: 'createdAt'}})

const trade = mongoose.model('LimitTrade', LimitTradeSchema );

module.exports = trade;