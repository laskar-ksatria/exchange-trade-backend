const bcr = require('bcryptjs');
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET;

const getHash = (pass) => {
    return bcr.hashSync(pass, bcr.genSaltSync(10))
};

const checkPass = (pass, hashPass) => {
    return bcr.compareSync(pass, hashPass)
};

const generateToken = (payload) => {
    let token = jwt.sign(payload, SECRET);
    return token;
};

const verifyToken = (token) => {
    let decoded = jwt.verify(token, 'owlking');
    return decoded;
};

const generateText = (type) => {
    
    switch(type) {
        case 'usd':
            return 'balance'
        case 'btc':
            return 'BTC_coin'
        case 'LTC':
            return 'LTC_coin'
        case 'ETH':
            return 'ETH_coin'
        default :
            return false
    }
}

module.exports = { getHash, checkPass, verifyToken, generateToken, generateText };