document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const taskInput = document.getElementById('task-input');
    const timeInput = document.getElementById('time-input');
    const taskList = document.getElementById('task-list');
    const reminderSound = document.getElementById('reminder-sound');
    const modal = document.getElementById('reminder-modal');
    const modalContent = document.getElementById('modal-content');
    const stopBtn = document.getElementById('stop-btn');
    const postponeBtn = document.getElementById('postpone-btn');
    const completedCountEl = document.getElementById('completed-tasks-count');
    const incompleteCountEl = document.getElementById('incomplete-tasks-count');
    const totalTasksCountEl = document.getElementById('total-tasks-count');
    const reportCompletedCountEl = document.getElementById('report-Completed-tasks-count');
    const reportIncompleteCountEl = document.getElementById('report-Incomplete-tasks-count');
    const reportTotalTasksCountEl = document.getElementById('report-total-tasks-count');
    const backBtn = document.getElementById('back-btn');
    let completedCount = 0;
    let incompleteCount = 0;
    let totalTasksCount = 0;
    let wakeLock = null;

    // Request a wake lock to keep the screen on
    async function requestWakeLock() {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
            console.log('Wake Lock is active');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    requestWakeLock();

    // Handle visibility changes to manage wake lock
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            requestWakeLock();
        } else if (document.visibilityState === 'hidden'){
            // Notifications should still work when the tab is hidden
            // Check if there's an active reminder to trigger notifications
            const activeReminder = JSON.parse(localStorage.getItem('activeReminder'));
            if (activeReminder && Notification.permission === "granted") {
                new Notification("Task Reminder", {
                body: `Reminder for task: ${activeReminder.taskText}`,
                icon: "icon-url", // Replace with your own icon URL
                requireInteraction: true // Ensures notification stays until interacted with
                });
            }   
            //Handle background state if needed, for instance, trigger notifications
            if (wakeLock !== null) {
                wakeLock.release();
                wakeLock = null;
            }
        }
    });

    // Function to trigger a task reminder with Wake Lock and Notification
    async function triggerTaskReminder(taskName) {
        // Wake Lock
        let wakeLock = null;
        try {
            wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
            console.error("Wake Lock failed:", err);
        }

        // Notification
        if ("Notification" in window) {
            if (Notification.permission ==="granted"){
                new Notification("Task Reminder", {
                    body: `Reminder for task: ${taskName}`,
                    icon: "icon-url", //Optional: Add the URL to your notification icon here
                    requireInteraction: true //Keeps the notification active until user interacts
                });
            }
            else if (Notification,permission !== "denied") {
                //Request permission if not already granted
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    new Notification("Task Reminder,", {
                        body: `Reminder for task: ${taskName}`,
                        icon: "icon-url",
                        requireInteraction: true, //Keeps notification acitve until user interacts
                    });
                }
            }
        }

        // Release the wake lock after a delay (for example, after 30 seconds)
        setTimeout(() => {
            if (wakeLock) {
                wakeLock.release().then(() => {
                    console.log("Wake Lock released");
                }).catch((err) => {
                    console.error("Wake Lock release failed:", err);
                });
            }
        }, 30000); // 30 seconds or appropriate time for your app
    }

    // Request notification permission when the app is loaded
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    function showTab(tabId) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const tabButtons = document.querySelectorAll('.tab-button');

        // Hide both forms by default
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';

        // Remove 'active' class from all tab buttons
        tabButtons.forEach(button => button.classList.remove('active'));

        // Show the selected form
        if (tabId === 'login') {
            loginForm.style.display = 'block';
            document.querySelector('.tab-button[onclick="showTab(\'login\')"]').classList.add('active');
        } else if (tabId === 'register') {
            registerForm.style.display = 'block';
            document.querySelector('.tab-button[onclick="showTab(\'register\')"]').classList.add('active');
        }
    }

    // Add task event listener
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // Generate report event listener
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }

    // Back button event listener
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; // Navigate back to main page
        });
    }

    // Function to add a task
    function addTask() {
        const taskText = taskInput.value.trim();
        const taskTime = timeInput.value.trim();

        if (taskText === '' || taskTime === '') {
            alert('Please enter a task and time');
            return;
        }

        const taskDate = new Date(taskTime);
        const now = new Date();

        // Prevent adding tasks with past dates
        if (taskDate < now) {
            alert('Please enter a valid future time.');
            return;
        }

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" disabled>
            ${taskText} - <small>${taskDate.toLocaleString()}</small>
            <button onclick="removeTask(this)">Remove</button>
        `;
        taskList.appendChild(listItem);

        totalTasksCount++;
        incompleteCount++;
        updateCounts();

        scheduleReminder(listItem, taskText, taskDate);

        // Store task data in localStorage
        storeTaskData(taskText, 'Incomplete', taskDate.toISOString());

        taskInput.value = '';
        timeInput.value = '';
    }

    // Function to store task data in localStorage
    function storeTaskData(taskText, status, taskTime) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push({ taskText, status, taskTime });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('Stored tasks:', tasks); // Log tasks after adding new task
    }

    // Function to update task status in localStorage
    function updateTaskStatus(listItem, newStatus) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskText = listItem.innerText.split(' - ')[0].trim();
        tasks = tasks.map(task =>
            task.taskText === taskText ? { ...task, status: newStatus } : task
        );
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('Updated tasks:', tasks); // Log tasks after updating status
    }

    // Function to schedule a reminder
    function scheduleReminder(listItem, taskText, taskTime) {
        const now = new Date();
        let nextReminderTime = new Date(taskTime);

        if (now > nextReminderTime) {
            nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        }

        const timeToNextReminder = nextReminderTime - now;
        const reminderInterval = 24 * 60 * 60 * 1000; // 24 hours

        setTimeout(() => {
            playReminder(taskText, listItem);
            const intervalId = setInterval(() => {
                playReminder(taskText, listItem);
            }, reminderInterval);

            listItem.setAttribute('data-interval-id', intervalId);
        }, timeToNextReminder);
    }

    // Function to play the reminder sound and show the modal
    function playReminder(taskText, listItem) {
        localStorage.setItem('activeReminder', JSON.stringify({
            taskText,
            timestamp: new Date().getTime()
        }));

        triggerReminder(taskText, listItem);
    }

    // Function to trigger the reminder (either from the main tab or a different tab)
    function triggerReminder(taskText, listItem) {
        reminderSound.loop = true;
        reminderSound.play()
            .then(() => {
                console.log('Sound is playing');
            })
            .catch((error) => {
                console.error('Failed to play sound:', error);
                alert('Please interact with the page to enable sound reminders.');
            });

        modalContent.innerText = `Reminder: ${taskText}`;
        modal.style.display = 'flex';

        // Center the modal content
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        // Stop the sound after 2 minutes
        setTimeout(() => {
            stopReminder();
        }, 2 * 60 * 1000); // 2 minutes in milliseconds

        // Handle stop button click
        stopBtn.onclick = () => {
            stopReminder();
            const checkBox = listItem.querySelector('.task-checkbox');
            if (checkBox) {
                checkBox.checked = true;
                checkBox.disabled = false; // Enable the checkbox so it can be marked as complete
                completedCount++;
                incompleteCount--;
                updateCounts();
                updateTaskStatus(listItem, 'Completed');
            }
        };

        // Handle postpone button click
        postponeBtn.onclick = () => {
            const newTime = prompt('Enter new reminder time (YYYY-MM-DDTHH:MM:SS):');
            if (newTime) {
                const newReminderTime = new Date(newTime);
                if (newReminderTime > new Date()) {
                    stopReminder();
                    rescheduleReminder(listItem, taskText, newReminderTime);
                } else {
                    alert('Please enter a valid future time.');
                }
            }
        };
    }

    // Function to reschedule the reminder
    function rescheduleReminder(listItem, taskText, newReminderTime) {
        // Clear previous interval
        const previousIntervalId = listItem.getAttribute('data-interval-id');
        if (previousIntervalId) {
            clearInterval(previousIntervalId);
        }

        // Update task time
        const now = new Date();
        let nextReminderTime = new Date(newReminderTime);

        if (now > nextReminderTime) {
            nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        }

        const timeToNextReminder = nextReminderTime - now;
        const reminderInterval = 24 * 60 * 60 * 1000; // 24 hours

        setTimeout(() => {
            playReminder(taskText, listItem);
            const intervalId = setInterval(() => {
                playReminder(taskText, listItem);
            }, reminderInterval);

            listItem.setAttribute('data-interval-id', intervalId);
        }, timeToNextReminder);
    }

    // Function to stop the reminder sound and hide the modal
    function stopReminder() {
        reminderSound.pause();
        reminderSound.currentTime = 0;
        modal.style.display = 'none';
    }

    // Function to remove a task and clear the reminder interval
    window.removeTask = function(button) {
        const listItem = button.parentElement;
        const intervalId = listItem.getAttribute('data-interval-id');
        
        if (intervalId) {
            clearInterval(intervalId);
        }

        const checkBox = listItem.querySelector('.task-checkbox');
        if (checkBox && checkBox.checked) {
            completedCount--;
        } else {
            incompleteCount--;
        }

        totalTasksCount--;
        updateCounts();
        taskList.removeChild(listItem);
        stopReminder();

        // Remove task from localStorage
        removeTaskFromData(listItem);
    }

    // Function to remove task data from localStorage
    function removeTaskFromData(listItem) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const taskText = listItem.innerText.split(' - ')[0].trim();
        tasks = tasks.filter(task => task.taskText !== taskText);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Function to update the counts on the page
    function updateCounts() {
        if (completedCountEl) completedCountEl.innerText = `Completed Tasks: ${completedCount}`;
        if (incompleteCountEl) incompleteCountEl.innerText = `Incomplete Tasks: ${incompleteCount}`;
        if (totalTasksCountEl) totalTasksCountEl.innerText = `Total Tasks: ${totalTasksCount}`;
    }

    // Function to generate the report
    function generateReport() {
        const reportData = {
            completedCount,
            incompleteCount,
            totalTasksCount,
            tasks: JSON.parse(localStorage.getItem('tasks')) || [] // Include tasks data
        };
        localStorage.setItem('report', JSON.stringify(reportData));
        console.log('Generated report data:', reportData); // Log report data
        window.location.href = 'report.html'; // Navigate to report page
    }

    // Load report data on the report page
    if (document.title === 'Task Report') {
        const reportData = JSON.parse(localStorage.getItem('report')) || {
            completedCount: 0,
            incompleteCount: 0,
            totalTasksCount: 0,
            tasks: []
        };

        console.log('Report data loaded:', reportData); // Log report data

        // Filter out tasks added today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filteredTasks = reportData.tasks.filter(task => {
            const taskDate = new Date(task.taskTime);
            return taskDate >= today && taskDate < tomorrow;
        });

        if (reportCompletedCountEl) reportCompletedCountEl.innerText = `Completed Tasks: ${reportData.completedCount}`;
        if (reportIncompleteCountEl) reportIncompleteCountEl.innerText = `Incomplete Tasks: ${reportData.incompleteCount}`;
        if (reportTotalTasksCountEl) reportTotalTasksCountEl.innerText = `Total Tasks: ${reportData.totalTasksCount}`;

        const taskDetailsTbody = document.querySelector('#task-details-table tbody');
        taskDetailsTbody.innerHTML = ''; // Clear existing data

        filteredTasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.taskText}</td>
                <td>${task.status}</td>
                <td>${new Date(task.taskTime).toLocaleString()}</td>
            `;
            taskDetailsTbody.appendChild(row);
        });

        // Optionally clear the report data after displaying
        localStorage.removeItem('report');
    }
});
