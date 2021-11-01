const { MongoExpiredSessionError } = require('mongodb');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilepicture: {
        type: Buffer,
        required: false
    }
})


userSchema.statics.isThisEmailInUse = async function(email){
    if(!email) throw new Error('invalid email provided');

    try{
        const user = await this.findOne({email});
        if(user) {
                    return true;
        }
        return false;        
    }
    catch (error){
        console.log('error 1(email)', error.message);
        return false;
    }
}

userSchema.statics.isThisUserNameInUse = async function(username){
    if(!username) throw new Error('invalid username provided');

    try{
        const user = await this.findOne({username});
        if(user) {
                    return true;
        }
        return false;        
    }
    catch (error){
        console.log('error 2(username)', error.message);
        return false;
    }
}


userSchema.methods.passwordsMatch = async function(passwordPassed){
    if(!passwordPassed) throw new Error('Invalid password provided');

    try{
        const passwordMatch = await bcrypt.compare(passwordPassed, this.password);
        return passwordMatch;//either true or false
    }
    catch(error){
        console.log('error 3(password match)'. error.message);
        return false;
    }
}


module.exports =  mongoose.model('user', userSchema);
