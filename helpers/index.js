const bcr = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;

const getHash = (pass) => {
    return bcr.hashSync(pass, bcr.genSaltSync(10))
};

const checkPass = (pass, hashPass) => {
    return bcr.compareSync(pass, hashPass)
};

const generateToken = (payload) => {
    return jwt.sign(payload, SECRET, { algorithm: 'RS256'})
};

const verifyToken = (token) => {
    return jwt.verify(token, SECRET, { algorithms: ['RS256'] })
}

module.exports = { getHash, checkPass, verifyToken, generateToken };