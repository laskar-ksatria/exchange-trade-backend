const mongoose = require('mongoose');

const { getHash } = require('../helpers/index')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email cannot be empty'],
        trim: true,
        validate: [
            {
                validator: function (value) {
                    const email = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    return email.test(value)
                },
                message: props => `${props.value} is not valid email, please fill email correctly`
            },
            {
                validator: function (value) {
                    return this.model('User').findOne({email: value})
                        .then(function (email) {
                            if (email) {
                                return false
                            }else {
                                return true;
                            }
                        })
                },
                message: props => `${props.value} already taken, please take another one`
            }
        ]
    },
    password: {
        type: String,
        required: [true, 'Password cannot be empty'],
        validate: {
            validator: function (value) {
                if (value.length < 6) {
                    return false;
                }else {
                    return true;
                }
            }, message: (props) => `Password length must be larger or equal than 6`
        }
    }
});


userSchema.pre('save', function (next) {
    let pass = getHash(this.password);
    this.password = pass;
    next();
})



const user = mongoose.model('User', userSchema);

module.exports = user;
