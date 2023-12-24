const mongoose = require('mongoose');
const { boolean } = require('webidl-conversions');

const taskSchema = new mongoose.Schema({
    name: String,
    time: String,
    date: String,
    createdBy: String,
    isCompleted: Boolean
});

const taskModel = mongoose.model('task', taskSchema);

module.exports = taskModel;