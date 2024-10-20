document.addEventListener("DOMContentLoaded", () => {
    const addTaskBtn = document.getElementById("add-task-btn");
    const generateReportBtn = document.getElementById("generate-report-btn");
    const taskInput = document.getElementById("task-input");
    const timeInput = document.getElementById("time-input");
    const taskList = document.getElementById("task-list");
    const reminderSound = document.getElementById("reminder-sound");
    const modal = document.getElementById("reminder-modal");
    const modalContent = document.getElementById("modal-content");
    const stopBtn = document.getElementById("stop-btn");
    const postponeBtn = document.getElementById("postpone-btn");
    const completedCountEl = document.getElementById("completed-tasks-count");
    const incompleteCountEl = document.getElementById("incomplete-tasks-count");
    const totalTasksCountEl = document.getElementById("total-tasks-count");
    const reportCompletedCountEl = document.getElementById(
      "report-Completed-tasks-count"
    );
    const reportIncompleteCountEl = document.getElementById(
      "report-Incomplete-tasks-count"
    );
    const reportTotalTasksCountEl = document.getElementById(
      "report-total-tasks-count"
    );
    const backBtn = document.getElementById("back-btn");
    let completedCount = 0;
    let incompleteCount = 0;
    let totalTasksCount = 0;
    let wakeLock = null;
  
    // Request a wake lock to keep the screen on
    async function requestWakeLock() {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          console.log("Wake Lock was released");
        });
        console.log("Wake Lock is active");
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  
    requestWakeLock();
  
    // Handle visibility changes to manage wake lock
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      } else if (document.visibilityState === "hidden") {
        // Notifications should still work when the tab is hidden
        // Check if there's an active reminder to trigger notifications
        const activeReminder = JSON.parse(localStorage.getItem("activeReminder"));
        if (activeReminder && Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: `Reminder for task: ${activeReminder.taskText}`,
            icon: "icon-url", // Replace with your own icon URL
            requireInteraction: true, // Ensures notification stays until interacted with
          });
        }
        //Handle background state if needed, for instance, trigger notifications
        if (wakeLock !== null) {
          wakeLock.release();
          wakeLock = null;
        }
      }
    });
  
    async function triggerTaskReminder(taskText) {
      // Wake Lock
      let wakeLock = null;
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
  
      // Notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: `Reminder for task: ${taskText}`,
            icon: "icon-url",
            requireInteraction: true,
          });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification("Task Reminder", {
              body: `Reminder for task: ${taskText}`,
              icon: "icon-url",
              requireInteraction: true,
            });
          }
        }
      }
  
      // Play sound and show modal
      reminderSound.loop = true;
      reminderSound
        .play()
        .then(() => {
          console.log("Sound is playing");
        })
        .catch((error) => {
          console.error("Failed to play sound:", error);
          alert("Please interact with the page to enable sound reminders.");
        });
  
      modalContent.innerText = `Reminder: ${taskText}`;
      modal.style.display = "flex";
  
      // Center the modal content
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      setTimeout(() => {
        if (wakeLock) {
          wakeLock
            .release()
            .then(() => {
              console.log("Wake Lock released");
            })
            .catch((err) => {
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
      const loginForm = document.getElementById("login-form");
      const registerForm = document.getElementById("register-form");
      const tabButtons = document.querySelectorAll(".tab-button");
  
      // Hide both forms by default
      loginForm.style.display = "none";
      registerForm.style.display = "none";
  
      // Remove 'active' class from all tab buttons
      tabButtons.forEach((button) => button.classList.remove("active"));
  
      // Show the selected form
      if (tabId === "login") {
        loginForm.style.display = "block";
        document
          .querySelector(".tab-button[onclick=\"showTab('login')\"]")
          .classList.add("active");
      } else if (tabId === "register") {
        registerForm.style.display = "block";
        document
          .querySelector(".tab-button[onclick=\"showTab('register')\"]")
          .classList.add("active");
      }
    }
  
    // Add task event listener
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", addTask);
    }
  
    // Generate report event listener
    if (generateReportBtn) {
      generateReportBtn.addEventListener("click", generateReport);
    }
  
    // Back button event listener
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "index.html"; // Navigate back to main page
      });
    }
  
    // Function to add a task
    function addTask() {
      const taskText = taskInput.value.trim();
      const taskTime = timeInput.value.trim();
  
      if (taskText === "" || taskTime === "") {
        alert("Please enter a task and time");
        return;
      }
  
      const taskDate = new Date(taskTime);
      const now = new Date();
  
      // Prevent adding tasks with past dates
      if (taskDate < now) {
        alert("Please enter a valid future time.");
        return;
      }
  
      const listItem = document.createElement("li");
      listItem.innerHTML = `
              <input type="checkbox" class="task-checkbox">
              ${taskText} - <small>${taskDate.toLocaleString()}</small>
              <button onclick="removeTask(this)">Remove</button>
          `;
      taskList.appendChild(listItem);
  
      totalTasksCount++;
      incompleteCount++;
      updateCounts();
      scheduleReminder(listItem, taskText, taskDate);
      storeTaskData(taskText, "Incomplete", taskDate.toISOString());
      taskInput.value = "";
      timeInput.value = "";
  
      // Add event listener to checkbox
      const checkbox = listItem.querySelector(".task-checkbox");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          completedCount++;
          incompleteCount--;
          updateTaskStatus(listItem, "Completed");
        } else {
          completedCount--;
          incompleteCount++;
          updateTaskStatus(listItem, "Incomplete");
        }
        updateCounts();
        renderTaskDetails();
      });
    }
  
    function storeTaskData(taskText, status, taskTime) {
      console.log("taskText:------------------ ", taskText);
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      tasks.push({ taskText, status, taskTime });
      localStorage.setItem("tasks", JSON.stringify(tasks));
      console.log("Stored tasks:", tasks);
    }
  
    // Function to schedule a reminder
    function scheduleReminder(listItem, taskText, taskTime) {
      const now = new Date();
      let nextReminderTime = new Date(taskTime);
  
      if (now > nextReminderTime) {
        nextReminderTime.setDate(nextReminderTime.getDate() + 1);
      }
  
      const timeToNextReminder = nextReminderTime - now;
  
      const timerId = setTimeout(() => {
        triggerTaskReminder(taskText);
        setupModalButtons(listItem, taskText);
      }, timeToNextReminder);
  
      listItem.setAttribute("data-timer-id", timerId);
    }
  
    function setupModalButtons(listItem, taskText) {
      stopBtn.onclick = () => {
        stopReminder(taskText);
        const checkBox = listItem.querySelector(".task-checkbox");
        if (checkBox) {
          checkBox.checked = true;
          completedCount++;
          incompleteCount--;
          updateCounts();
          updateTaskStatus(listItem, "Completed"); // Pass listItem instead of taskText
        }
      };
  
      postponeBtn.onclick = () => {
        const newTime = prompt("Enter new reminder time (YYYY-MM-DDTHH:MM:SS):");
        if (newTime) {
          const newReminderTime = new Date(newTime);
          if (newReminderTime > new Date()) {
            stopReminder(taskText);
            rescheduleReminder(listItem, taskText, newReminderTime);
          } else {
            alert("Please enter a valid future time.");
          }
        }
      };
    }
  
    // Function to reschedule the reminder
    function rescheduleReminder(listItem, taskText, newReminderTime) {
      // Clear previous timer
      const previousTimerId = listItem.getAttribute("data-timer-id");
      if (previousTimerId) {
        clearTimeout(parseInt(previousTimerId));
      }
  
      scheduleReminder(listItem, taskText, newReminderTime);
  
      // Update task time in localStorage
      updateTaskTime(listItem, newReminderTime);
    }
  
    // Function to update task time in localStorage
    function updateTaskTime(listItem, newTime) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const taskText = listItem.innerText.split(" - ")[0].trim();
      tasks = tasks.map((task) =>
        task.taskText === taskText
          ? { ...task, taskTime: newTime.toISOString() }
          : task
      );
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  
    function loadTasksFromLocalStorage() {
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      completedCount = tasks.filter((task) => task.status === "Completed").length;
      incompleteCount = tasks.length - completedCount;
      totalTasksCount = tasks.length;
  
      updateCounts();
  
      // Display tasks in the UI
      taskList.innerHTML = "";
      tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <input type="checkbox" class="task-checkbox" ${
            task.status === "Completed" ? "checked" : ""
          }>
          ${task.taskText} - <small>${new Date(
          task.taskTime
        ).toLocaleString()}</small>
          <button onclick="removeTask(this)">Remove</button>
        `;
        taskList.appendChild(listItem);
  
        // Add event listener to checkbox for toggling status
        const checkbox = listItem.querySelector(".task-checkbox");
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            completedCount++;
            incompleteCount--;
            updateTaskStatus(listItem, "Completed");
          } else {
            completedCount--;
            incompleteCount++;
            updateTaskStatus(listItem, "Incomplete");
          }
          updateCounts();
        });
      });
    }
  
    // Function to remove a task and clear the reminder interval
    window.removeTask = function (button) {
      const listItem = button.parentElement;
      const timerId = listItem.getAttribute("data-timer-id");
  
      if (timerId) {
        clearTimeout(parseInt(timerId));
      }
  
      const checkBox = listItem.querySelector(".task-checkbox");
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
    };
  
    function removeTaskFromData(listItem) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      const taskText = listItem.innerText.split(" - ")[0].trim();
      tasks = tasks.filter((task) => task.taskText !== taskText);
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTaskDetails();
    }
  
    function updateCounts() {
      if (completedCountEl)
        completedCountEl.innerText = `Completed Tasks: ${completedCount}`;
      if (incompleteCountEl)
        incompleteCountEl.innerText = `Incomplete Tasks: ${incompleteCount}`;
      if (totalTasksCountEl)
        totalTasksCountEl.innerText = `Total Tasks: ${totalTasksCount}`;
    }
  
    function generateReport() {
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  
      const reportData = {
        completedCount: tasks.filter((task) => task.status === "Completed")
          .length,
        incompleteCount: tasks.filter((task) => task.status === "Incomplete")
          .length,
        totalTasksCount: tasks.length,
        tasks: tasks,
      };
      localStorage.setItem("report", JSON.stringify(reportData));
      window.location.href = "report.html";
    }
  
    if (document.title === "Task Report") {
      const reportData = JSON.parse(localStorage.getItem("report")) || {
        completedCount: 0,
        incompleteCount: 0,
        totalTasksCount: 0,
        tasks: [],
      };
  
      document.getElementById(
        "report-Completed-tasks-count"
      ).innerText = `Completed Tasks: ${reportData.completedCount}`;
      document.getElementById(
        "report-Incomplete-tasks-count"
      ).innerText = `Incomplete Tasks: ${reportData.incompleteCount}`;
      document.getElementById(
        "report-total-tasks-count"
      ).innerText = `Total Tasks: ${reportData.totalTasksCount}`;
  
      const taskDetailsTbody = document.querySelector(
        "#task-details-table tbody"
      );
      taskDetailsTbody.innerHTML = "";
  
      reportData.tasks.forEach((task) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${task.taskText}</td>
          <td>${task.status === "Completed" ? "Completed" : "Incomplete"}</td>
          <td>${new Date(task.taskTime).toLocaleString()}</td>
        `;
        taskDetailsTbody.appendChild(row);
      });
    }
    function stopReminder(taskText) {
      reminderSound.pause();
      reminderSound.currentTime = 0;
      modal.style.display = "none";
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      tasks = tasks.map((task) =>
        task.taskText === taskText ? { ...task, status: "Completed" } : task
      );
      localStorage.setItem("tasks", JSON.stringify(tasks));
      completedCount++;
      incompleteCount--;
      updateCounts();
      const listItems = document.querySelectorAll("#task-list li");
      listItems.forEach((item) => {
        if (item.innerText.includes(taskText)) {
          const checkBox = item.querySelector(".task-checkbox");
          if (checkBox) {
            checkBox.checked = true;
          }
        }
      });
      if (document.title === "Task Report") {
        renderTaskDetails();
      }
    }
  
    function updateTaskStatus(taskText, newStatus) {
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      tasks = tasks.map((task) =>
        task.taskText === taskText ? { ...task, status: newStatus } : task
      );
      localStorage.setItem("tasks", JSON.stringify(tasks));
      console.log("Updated tasks:", tasks);
      renderTaskDetails();
    }
  
    function renderTaskDetails() {
      const taskDetailsTbody = document.querySelector(
        "#task-details-table tbody"
      );
      if (!taskDetailsTbody) {
        console.error("Task details table body not found");
        return;
      }
      taskDetailsTbody.innerHTML = "";
      const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      tasks.forEach((task) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${task.taskText}</td>
          <td>${task.status === "Completed" ? "Completed" : "Incomplete"}</td>
          <td>${new Date(task.taskTime).toLocaleString()}</td>
        `;
        taskDetailsTbody.appendChild(row);
      });
    }
  
    document.addEventListener("DOMContentLoaded", () => {
      loadTasksFromLocalStorage();
      renderTaskDetails();
    });
  });
  