const { verifyToken } = require('../helpers/index')

const userAuth = (req,res,next) => {
    if (req.headers.jwttoken) {
        let token = req.headers.jwttoken
        req.decoded = verifyToken(token);
        next();
    }else {
        next({message: 'You must login first as user'})
    }
};

module.exports = {userAuth}

