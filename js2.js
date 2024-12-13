// Authentication functions
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        showTaskManager(user);
    } else {
        showLogin();
    }
}
function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        showTaskManager(user);
    } else {
        alert('Invalid email or password');
    }
}
function signup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) {
        alert('Email already exists');
        return;
    }
    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('user', JSON.stringify(newUser));
    showTaskManager(newUser);
}
function logout() {
    localStorage.removeItem('user');
    showLogin();
}
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('signupSection').classList.add('hidden');
    document.getElementById('taskManagerSection').classList.add('hidden');
}
function showSignup() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('signupSection').classList.remove('hidden');
    document.getElementById('taskManagerSection').classList.add('hidden');
}
function showTaskManager(user) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('signupSection').classList.add('hidden');
    document.getElementById('taskManagerSection').classList.remove('hidden');
    document.getElementById('userName').textContent = `Welcome, ${user.name}`;
    loadTasks();
}
// Handle logout button click
document.getElementById('logoutButton').onclick = function() {
    document.getElementById('taskManagerSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
};
// Task management functions
let tasks = [];
let currentAlarmTask = null;
function loadTasks() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        tasks = JSON.parse(localStorage.getItem(`tasks_${user.email}`)) || [];
        renderTasks();
    }
}
function saveTasks() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        localStorage.setItem(`tasks_${user.email}`, JSON.stringify(tasks));
    }
}
function addTask() {
    const taskName = document.getElementById('taskName').value;
    const taskDateTime = document.getElementById('taskDateTime').value;
    if (taskName && taskDateTime) {
        const task = {
            id: Date.now(),
            name: taskName,
            dueDate: new Date(taskDateTime),
            status: 'Pending'
        };
        tasks.push(task);
        saveTasks();
        renderTasks();
        setAlarm(task);       
        document.getElementById('taskName').value = '';
        document.getElementById('taskDateTime').value = '';
    }
}
function renderTasks() {
    const taskList = document.getElementById('tasks');
    taskList.innerHTML = '';   
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${task.name} - Due: ${new Date(task.dueDate).toLocaleString()} - Status: ${task.status}
            <button onclick="completeTask(${task.id})">Complete</button>
            <button onclick="deleteTask(${task.id})">Delete</button> </span>
        `;
        taskList.appendChild(li);
    });
}
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = 'Completed';
        saveTasks();
        renderTasks();
    }
}
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}
function setAlarm(task) {
    const now = new Date();
    const timeDiff = new Date(task.dueDate).getTime() - now.getTime();   
    if (timeDiff > 0) {
        setTimeout(() => {
            showAlarm(task);
        }, timeDiff);
    }
}
function showAlarm(task) {
    const modal = document.getElementById('alarmModal');
    const taskNameElement = document.getElementById('alarmTaskName');   
    currentAlarmTask = task;
    taskNameElement.textContent = `Task "${task.name}" is due!`;
    modal.style.display = 'block';
    playAlarmSound();
}
function stopAlarm() {
    if (currentAlarmTask) {
        completeTask(currentAlarmTask.id);
        currentAlarmTask = null;
    }
    document.getElementById('alarmModal').style.display = 'none';
    stopAlarmSound();
}
function postponeAlarm() {
    if (currentAlarmTask) {
        const newDueDate = new Date(Date.now() + 3 * 60000); // Postpone for 3 minutes
        currentAlarmTask.dueDate = newDueDate;
        saveTasks();
        setAlarm(currentAlarmTask);
        currentAlarmTask = null;
    }
    document.getElementById('alarmModal').style.display = 'none';
    stopAlarmSound();
}
function generateReport() {
    const reportSection = document.getElementById('reportSection');
    const taskTableBody = document.getElementById('taskTableBody');
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    taskTableBody.innerHTML = '';
    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${new Date(task.dueDate).toLocaleString()}</td>
            <td>${task.status}</td>
        `;
        taskTableBody.appendChild(row);
    });   
    generatePieChart(completedTasks, pendingTasks);
    reportSection.style.display = 'block';
}
function closeReport() {
    document.getElementById('reportSection').style.display = 'none';
}
function generatePieChart(completed, pending) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Task Status'
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}
function playAlarmSound() {
    const audio = document.getElementById('alarmAudio');
    if (audio.src) {
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            alert('Task is due!');
        });
    } else {
        alert('Task is due!');
    }
}
function stopAlarmSound() {
    const audio = document.getElementById('alarmAudio');
    audio.pause();
    audio.currentTime = 0;
}
function handleCustomAlarmSound(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audio = document.getElementById('alarmAudio');
            audio.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}
// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('signupForm').addEventListener('submit', signup);
    document.getElementById('showSignup').addEventListener('click', showSignup);
    document.getElementById('showLogin').addEventListener('click', showLogin);
    document.getElementById('logoutButton').addEventListener('click', logout);
    document.getElementById('addTaskButton').addEventListener('click', addTask);
    document.getElementById('generateReportButton').addEventListener('click', generateReport);
    document.getElementById('closeReportButton').addEventListener('click', closeReport);
    document.getElementById('stopAlarmButton').addEventListener('click', stopAlarm);
    document.getElementById('postponeAlarmButton').addEventListener('click', postponeAlarm);
    document.getElementById('customAlarmSound').addEventListener('change', handleCustomAlarmSound);
    // Initialize the app
    checkAuth();
}); 
//multiple generations
function generateReport() {
    const reportSection = document.getElementById('reportSection');
    const taskTableBody = document.getElementById('taskTableBody');
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    // Append current tasks to the report table
    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${new Date(task.dueDate).toLocaleString()}</td>
            <td>${task.status}</td>
        `;
        taskTableBody.appendChild(row);
    });
    // Generate the pie chart
    generatePieChart(completedTasks, pendingTasks);
    // Display the report section
    reportSection.style.display = 'block';
}
function generateReport() {
    const reportSection = document.getElementById('reportSection');
    const taskTableBody = document.getElementById('taskTableBody');
    // Clear previous report rows
    taskTableBody.innerHTML = '';
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    // Append current tasks to the report table
    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.name}</td>
            <td>${new Date(task.dueDate).toLocaleString()}</td>
            <td>${task.status}</td>
        `;
        taskTableBody.appendChild(row);
    });
    // Generate the pie chart
    generatePieChart(completedTasks, pendingTasks);
    // Display the report section
    reportSection.style.display = 'block';
}
let pieChartInstance = null; // Store the chart instance
function generatePieChart(completed, pending) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    // Destroy the existing chart instance if it exists
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#2ecc71', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Task Status'
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}
// Display message to add only future time
function addTask() {
    const taskName = document.getElementById('taskName').value;
    const taskDateTime = document.getElementById('taskDateTime').value;
    // Check if taskName and taskDateTime are provided
    if (!taskName || !taskDateTime) {
        alert('Please enter both task name and due date/time.');
        return;
    }
    const taskDueDate = new Date(taskDateTime);
    const now = new Date();
    // Validate that the due date is not in the past or current time
    if (taskDueDate <= now) {
        alert('Please enter a future date and time for the task.');
        return;
    }
    // Check if tasks are at least 2 minutes apart
    if (tasks.length > 0) {
        const lastTask = tasks[tasks.length - 1];
        const lastTaskDate = new Date(lastTask.dueDate);
        const timeDiff = Math.abs(taskDueDate - lastTaskDate) / 60000; // difference in minutes
        if (timeDiff < 2) {
            alert("Tasks must be at least 2 minute apart!");
            return;
        }
    }
    const task = {
        id: Date.now(),
        name: taskName,
        dueDate: taskDueDate,
        status: 'Pending'
    };
    tasks.push(task);
    saveTasks();
    renderTasks();
    setAlarm(task);
    // Clear the input fields
    document.getElementById('taskName').value = '';
    document.getElementById('taskDateTime').value = '';
}
// adding multiple alarm sounds
document.getElementById('alarmSoundSelect').addEventListener('change', function() {
    const selectedSound = this.value;
    const audio = document.getElementById('alarmAudio');
    if (selectedSound) {
        audio.src = selectedSound; // Ensure the sound files are accessible from your server
    }
});
 //complete button functioning
 let taskTimers = {};
function setAlarm(task) {
    const now = new Date();
    const timeDiff = new Date(task.dueDate).getTime() - now.getTime();
    if (timeDiff > 0) {
        // Store the timeout ID in the taskTimers object
        taskTimers[task.id] = setTimeout(() => {
            showAlarm(task);
        }, timeDiff);
    }
}
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = 'Completed';
        saveTasks();
        renderTasks();
        // Clear the alarm timer if it exists
        if (taskTimers[id]) {
            clearTimeout(taskTimers[id]);
            delete taskTimers[id];  // Remove the timer entry from the object
        }
    }
}
function showAlarm(task) {
    // Only show alarm if task is still pending
    if (task.status === 'Pending') {
        const modal = document.getElementById('alarmModal');
        const taskNameElement = document.getElementById('alarmTaskName');
        currentAlarmTask = task;
        taskNameElement.textContent = `Task "${task.name}" is due!`;
        modal.style.display = 'block';
        playAlarmSound();
    }
}
//delete button functioning
let taskTimerss = {}; // Store the timeout IDs by task ID
function setAlarm(task) {
    const now = new Date();
    const timeDiff = new Date(task.dueDate).getTime() - now.getTime();
    if (timeDiff > 0) {
        // Store the timeout ID in taskTimers, using the task ID
        taskTimers[task.id] = setTimeout(() => {
            // Only show the alarm if the task is still pending
            const taskInList = tasks.find(t => t.id === task.id && t.status === 'Pending');
            if (taskInList) {
                showAlarm(task);
            }
        }, timeDiff);
    }
}
function deleteTask(id) {
    // Find and remove the task
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        saveTasks();
        renderTasks();
        // Clear the alarm for the deleted task if it exists
        if (taskTimers[id]) {
            clearTimeout(taskTimers[id]);
            delete taskTimers[id];
        }
    }
}
function showAlarm(task) {
    const modal = document.getElementById('alarmModal');
    const taskNameElement = document.getElementById('alarmTaskName');
    currentAlarmTask = task;
    taskNameElement.textContent = `Task "${task.name}" is due!`;
    modal.style.display = 'block';
    playAlarmSound();
}

