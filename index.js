const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan')
const userModel = require('./models/user');
const taskModel = require('./models/task');
var ObjectId = require('mongodb').ObjectId;

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
app.post('/signup',async (req,res)=> {
    const data = req.body

    // if data is okay:
    if( data.email === undefined || data.name === undefined || data.password === undefined){
        res.status(400).json({  // status code 400: the server cannot or will not process the request due to something that is perceived to be a client error
            message: 'Please provide email, name and password'
        })
        return
    }
    // if duplicate
    const exisitingUser = await userModel.findOne({
        email: data.email,
        name: data.name,
        password: data.password
    })
    if(!exisitingUser){       
        // saving data
        const newUser = new userModel({
             email: data.email,
             name: data.name,
             password: data.password
        })
        await newUser.save()
        res.status(200).json({
            message:'User created successfully'
        })
        return
        }
    else{
        res.status(400).json({
            message: 'user already exists'
        })
    }
    

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
                    message: 'internal server error',
                    error: err
                })
            })
    }
    else{//duplicate task
        res.status(400).json({
            message:'Task already exists.'
        })
    }
    
    
})


// 4. update task API
app.put('/update/:id', async (req, res) => {
    const data = req.body
    const id = req.params.id
    try{
        await taskModel.findByIdAndUpdate(id, {
            name: data.name,
            time: data.time,
            date: data.date,
            createdBy: data.createdBy,
            isCompleted: data.isCompleted
        })
        res.status(200).json({
            message:"task updated successfully"
        })
    }catch(err){
        res.status(500).json({
            message:"task not found",
            err: err
        })
    }
    
})

// 5. delete task API
app.delete('/deletetask/:id',async (req,res) =>{
    const id = req.params.id
    const mongoId = new ObjectId(id)
    const task = await taskModel.findById(id)
    if(!task){
        res.status(400).json({
            message:"task doesn't exist"
        })       
    }
    await taskModel.deleteOne({_id: mongoId})
    res.status(200).json({
        message:'task deleted successfully'
    })
})

// 6. get all tasks API
app.get('/alltasks', async (req,res) => {
    
    try{
        const task = await taskModel.find()
        if(task.length == 0){
            res.status(400).json({
                message:"no tasks found"
            })
        }
        res.status(200).json(task)
    }catch(err){
        res.status(500).json({
            message:"internal server error"
        })
    }
        
})

// 7. get single task API
app.get('/singletask',async (req,res) => {
    const id = req.body.id

    var objectId =  new mongoose.Types.ObjectId(id);

    try{
        const task = await taskModel.findById(id);
    if(!task){
        res.status(404).json({
            message: "task not found"
        })
        return
    }
    res.status(200).json({
        message:"Successfully recieved task by taskID",
        task: task
    })       
    }catch(err){
        res.json({ error : "task not found"})
    }
})


// 8. get all task of a user
app.get('/task-user', async (req,res) => {
    const user = req.body.user
    try{
        const task = await taskModel.find({createdBy: user})
        if(task.length == 0){
            res.status(400).json({
                message:"user not found"
            })
        }res.status(200).json(task)
    }catch(err) {
        res.json(err)
    }
})

       
