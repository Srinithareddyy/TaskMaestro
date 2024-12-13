const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskmaestro', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// Task schema and model
const taskSchema = new mongoose.Schema({
    name: String,
    date: Date,
    time: String,
    sound: String,
    userId: mongoose.Schema.Types.ObjectId,
    status: { type: String, default: 'incomplete' },
});

const Task = mongoose.model('Task', taskSchema);

// Signup endpoint
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const newUser = new User({ username, password });
    await newUser.save();
    res.sendStatus(201);
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.json({ id: user._id });
    } else {
        res.sendStatus(401);
    }
});

// Task endpoints
app.post('/tasks', async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    res.sendStatus(201);
});

app.get('/tasks/:userId', async (req, res) => {
    const tasks = await Task.find({ userId: req.params.userId });
    res.json(tasks);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:3000');
});