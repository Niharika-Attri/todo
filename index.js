const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan')
const userModel = require('./models/user');
const taskModel = require('./models/task');

//setup express app
const app = express();

app.use(morgan('dev')); 

const username = 'niharikaattri2005';
const password = 'M6GbFR3Xzoa4e6B5';
const mongoDBUri = 'mongodb+srv://niharikaattri2005:M6GbFR3Xzoa4e6B5@cluster0.q7wxz7n.mongodb.net/?retryWrites=true&w=majority';

// connecting to database
mongoose.connect(mongoDBUri)
    .then(app.listen(3000,() => {
        console.log('connected to database');
        console.log("Server running on port 3000");
    }))
    .catch(err => {console.log(err);})

app.use(express.json())

// 1. signup
app.post('/signup', (req,res)=> {
    const data = req.body

    // if data is okay:
    if( data.email === undefined || data.name === undefined || data.password === undefined){
        res.status(400).json({  // status code 400: the server cannot or will not process the request due to something that is perceived to be a client error
            message: 'Please provide email, name and password'
        })
        return
    }

    // saving data
    const newUser = new userModel({
        email: data.email,
        name: data.name,
        password: data.password
    })
    
    newUser.save()
        .then(
            res.status(200).json({
                message: 'User created successfully'
            })
        )
        .catch(err => {
            console.log(err);
        })
})

// 2. login
app.post('/login', async (req, res) => {
    const data = req.body

    // if data is okay
    if( data.email === undefined || data.password ===undefined){
        res.status(400).json({
            message: 'Please provide email and password'
        })
        return
    }

    // login if user in db
    const exisitingUser = await userModel.findOne({
        email:data.email,
        password: data.password
    })
    if (!exisitingUser){
        res.status(404).json({
            message:'invalid email or password'
        })
    }else{
        res.status(200).json({
            message: 'User logged in successfully'
        })
    }
})

// 3. Create task API
app.post('/addTask', async (req, res) => {
    const data = req.body

    if( data.name === undefined || data.time === undefined || data.date === undefined || data.createdBy === undefined || data.isCompleted === undefined){
        res.status(400).json({
            message: 'Please provide name, time, date, status, createdBy'
        })
        return
    }

    const exisitingTask = await taskModel.findOne({
        name: data.name,
        time: data.time,
        date: data.date,
        createdBy: data.createdBy,
        isCompleted: data.isCompleted
    })

    if(!exisitingTask){
         // save
        const newTask = new taskModel({
            name: data.name,
            time: data.time,
            date: data.date,
            createdBy: data.createdBy,
            isCompleted: data.isCompleted
        })
         
        newTask.save()
            .then(
                res.status(200).json({
                    message: 'Task added successfully'
                })
            )
            .catch(err => {
                res.status(500).json({
                    message: 'internal server error'
                })
            })
    }
    else{//duplicate task
        res.status(400).json({
            message:'Task already exists.'
        })
    }
    
    
})

//4. Update task API
// app.put('/Update/:id', async (req,res) => {
//     const data = req.body
//     console.log(data)
//     const exisitingTask = await taskModel.findById(req.params.id)
//     if(!exisitingTask){
//         res.status(400).json({
//             message:'no such task exists'
//         })
//     }
//     else{
//         updateTask = await userModel.findByIdAndUpdate(req.params.id, data)
//     }
// })

// 6. get all tasks API
app.get('/alltasks', (req,res) => {
    taskModel.find()
        .then((result) => {
            res.json(result)
        })
        .catch(err => {
            res.json(err)
        })
        
})

// 7. get single task API
app.get('/singletask', (req,res) => {
    const id = req.body.id
    taskModel.findById(id)
        .then((result) => {
            res.json(result)
        })
        .catch(err => res.json(err))
})

// 8. get all task of a user
app.get('/task-user', (req,res) => {
    const user = req.body.user
    taskModel.find(createdBy)
})
