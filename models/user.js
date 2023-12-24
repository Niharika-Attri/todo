const mongoose = require('mongoose');

// making schema(structure)
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    password: String
})

// making model
const userModel = mongoose.model('user', userSchema)

module.exports = userModel;