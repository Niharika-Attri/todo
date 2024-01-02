const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan')
const userModel = require('./models/user');
const taskModel = require('./models/task');
const taskSchema = require('./models/task');
var ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


//setup express app
const app = express();

app.set('view engine', 'ejs');

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

// app.use(express.urlencoded({extended: true})); 

// app.get('/', (req, res) => {
//     res.render('index')
// })
// app.get('/signup', (req, res) => {
//     res.render('signup')
// })
// 1. signup
app.post('/signup',async (req,res)=> {
    const data = req.body

    // auth
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log(hashedPassword);

    // if data is okay:
    if( data.email === undefined || data.name === undefined || data.password === undefined){
        res.status(400).json({
            message: 'please provide email, name, password'
        })
        return
    }
    // if duplicate
    const exisitingUser = await userModel.findOne({
        email: data.email,
        name: data.name,
        password: hashedPassword
    })
    if(!exisitingUser){       
        // saving data
        const newUser = new userModel({
             email: data.email,
             name: data.name,
             password: hashedPassword
        })
        await newUser.save()
        res.status(200).json({ message: 'user signed in'})
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
    const password = data.password

    // if data is okay
    if( data.email === undefined || data.password ===undefined){
        res.status(400).json({
            message: 'Please provide email and password'
        })
        return
    }

    // login if user in db
    try{
        const exisitingUser = await userModel.findOne({
            email:data.email,
            
        })
        if (!exisitingUser){
            res.status(404).json({
                message:'invalid email'
            })
        }
        const passwordMatch = await bcrypt.compare(password, exisitingUser.password);
        if(!passwordMatch){
            res.status(401).json({
                message: 'authentication failed'
            })
        }else{
            res.status(200).json({
                message: 'successfully logged in'
            })
        }
        const token = jwt.sign({ userId:exisitingUser._id}, 'your-secret-key', {expiresIn:'1h',});
        // res.status(200).json({token});
    }catch(err){
        res.status(500).json({error: 'login failed'})
    }
    
})

// 3. Create task API
app.post('/addTask', async (req, res) => {
    const data = req.body

    if( data.name === undefined || data.time === undefined || data.date === undefined || data.createdBy === undefined || data.isCompleted === undefined || data.number === undefined){
        res.status(400).json({
            message: 'Please provide name, time, date, status, createdBy, number'
        })
        return
    }

    const exisitingTask = await taskModel.findOne({
        name: data.name,
        time: data.time,
        date: data.date,
        createdBy: data.createdBy,
        isCompleted: data.isCompleted,
        number: data.number
    })

    if(!exisitingTask){
         // save
        const newTask = new taskModel({
            name: data.name,
            time: data.time,
            date: data.date,
            createdBy: data.createdBy,
            isCompleted: data.isCompleted,
            number: data.number
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
    try{
        await taskModel.findByIdAndDelete(id)
        res.status(200).json({
            message:'task deleted successfully'
        })
        return
    }catch(err){
        res.json({
            error: err
        })
    }
    
    
})

// 6. get all tasks API
app.get('/alltasks', async (req,res) => {
    
    try{
        const excludeFields = ['sort', 'page', 'limit', 'fields'];

        let queryObj = {...req.query};

        excludeFields.forEach((el)=>{
            delete queryObj[el]
        })

        let queryStr = JSON.stringify(queryObj) //== to convert to string
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`) // \b so only exacg match to these replace, g so all ocuurences replace and not only first
        queryObj = JSON.parse(queryStr);
        let query = await taskModel.find(queryObj);
        // const task = await taskModel.find(req.query);//=====filter using query parameters
        // does not work if fields like sort or page are provided => exclude fields is created
        // advance filtering================
        //.find({price: { $gte 20}})
        //localhost:3000/alltasks?price[gte]=20=====> returns object without $ sign

        //sorting
        if(req.query.sort){
            // for multiple sort=> seperate by comma in url
            // for converting commas to space
            const sortBy = req.query.sort.split(',').join(' ');//=======> .split() returns an array => .join(' ')
            query = query.sort(sortBy)
            // .sort('price' 'ratings') ======>specify when sorting for two or more 
        }else{
            // query = query.sort('date')// by default sort if not specified
            query
        }
        const task = await query;


        // const task = await taskModel.find()// using mongoose method
        //             .where('name')
        //             .equals(req.query.name) OR gte()
        if(task.length == 0){
            res.status(400).json({
                message:"no tasks found"
            })
        }
        res.status(200).json(task)
    }catch(err){
        res.status(500).json({
            message:"internal server error",
            error: err
        })
    }
   
        
})

// 7. get single task API
app.get('/singletask/:id',async (req,res) => {
    const id = req.params.id

    // var objectId =  new mongoose.Types.ObjectId(id);

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

// auth middleware
function verifyToken(req, res, next){
    const token = req.header('Authorization')
}
