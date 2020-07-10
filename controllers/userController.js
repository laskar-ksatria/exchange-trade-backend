const User = require('../models/user');
const { checkPass,  generateToken} = require('../helpers')

class UserController {
    
    static readAll(req,res,next) {
        User.find({}).then(users => res.status(200).json(users))
    };

    static readMy(req,res,next) {
        let user = req.decoded.id;
        User.find({_id: user}).then(user => res.status(200).json(user))
    };

    static createAccount(req,res,next) {
      let { email, password } = req.body;
      User.create({email, password})
        .then(user => {
            res.status(201).json({message: "You account has been created"})
        })
        .catch(next)
    };

    static login(req,res,next) {
        let { email, password } = req.body;
        User.findOne({email})
            .then(user => {
                if (user) {
                    let userPassword = user.password;
                    if (checkPass(password, userPassword)) {
                        let token = generateToken({id: user.id})
                        res.status(200).json({token});
                    }else {
                        next({message: 'Invalid email / password'})
                    }
                }else { 
                    next({message: 'Invalid email / password'})
                }
            })
            .catch(next)
    };

};

module.exports = UserController;