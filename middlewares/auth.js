const { verifyToken } = require('../helpers/index')

exports.userAuth = (req,res,next) => {
    if (req.headers.jwttoken) {
        req.decoded = verifyToken(req.headers.token);
        next();
    }else {
        next({message: 'You must login first as user'})
    }
};

