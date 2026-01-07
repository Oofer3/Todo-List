// API configuration
const API_BASE = 'https://demo2.z-bit.ee/'; // Base URL for the REST API

// Global variables for DOM elements and authentication
let token = localStorage.getItem('token'); // JWT token for API authentication, stored in browser localStorage
let taskList; // UL element holding the list of tasks
let addTask; // Button to add a new task
let authSection; // Div containing login/create user form
let taskSection; // Div containing task list and controls
let usernameInput; // Input field for username
let passwordInput; // Input field for password
let loginBtn; // Button to log in
let createUserBtn; // Button to create a new user account
let logoutBtn; // Button to log out

// Window load event: Initialize the app, set up DOM references, and check authentication
window.addEventListener('load', () => {
    authSection = document.querySelector('#auth-section');
    taskSection = document.querySelector('#task-section');
    usernameInput = document.querySelector('#username');
    passwordInput = document.querySelector('#password');
    loginBtn = document.querySelector('#login-btn');
    createUserBtn = document.querySelector('#create-user-btn');
    logoutBtn = document.querySelector('#logout-btn');
    taskList = document.querySelector('#task-list');
    addTask = document.querySelector('#add-task');

    if (token) {
        showTaskSection();
        loadTasks();
    } else {
        showAuthSection();
    }

    loginBtn.addEventListener('click', login);
    createUserBtn.addEventListener('click', createUser);
    logoutBtn.addEventListener('click', logout);
    addTask.addEventListener('click', addTaskHandler);

    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset is not available. Please create a new account or contact support.');
    });

    // Clear error messages when user starts typing
    usernameInput.addEventListener('input', () => {
        document.getElementById('username-error').textContent = '';
    });
    passwordInput.addEventListener('input', () => {
        document.getElementById('password-error').textContent = '';
    });

    // Toggle password visibility
    document.getElementById('toggle-password').addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type; // Switch between hidden and visible password
    });
});

// Login function: Validates inputs, sends credentials to server, stores token, and loads tasks
async function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let hasError = false;
    if (!username) {
        document.getElementById('username-error').textContent = 'Username is required';
        hasError = true;
    }
    if (!password) {
        document.getElementById('password-error').textContent = 'Password is required';
        hasError = true;
    } else if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        hasError = true;
    }
    if (hasError) return; // Stop if validation fails
    try {
        const response = await fetch(`${API_BASE}users/get-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        console.log('Login response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            token = data.access_token; // Store the JWT token
            localStorage.setItem('token', token); // Persist token in browser storage
            showTaskSection(); // Switch to task UI
            loadTasks(); // Load user's tasks
        } else {
            const text = await response.text();
            console.log('Login response text:', text);
            document.getElementById('password-error').textContent = 'Invalid username or password'; // Show error for any failure
        }
    } catch (error) {
        alert('Login error: ' + error.message); // Network or other errors
    }
}

// Create user function: Validates inputs, creates new account on server, stores token, and loads tasks
async function createUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let hasError = false;
    if (!username) {
        document.getElementById('username-error').textContent = 'Username is required';
        hasError = true;
    }
    if (!password) {
        document.getElementById('password-error').textContent = 'Password is required';
        hasError = true;
    } else if (password.length < 6) {
        document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
        hasError = true;
    }
    if (hasError) return; // Stop if validation fails
    try {
        const response = await fetch(`${API_BASE}users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, firstname: '', lastname: '', newPassword: password })
        });
        console.log('Create user response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            token = data.access_token; // Store the JWT token
            localStorage.setItem('token', token); // Persist token
            showTaskSection(); // Switch to task UI
            loadTasks(); // Load tasks for new user
        } else {
            const text = await response.text();
            console.log('Create user response text:', text);
            try {
                const errors = JSON.parse(text); // Parse validation errors from server
                if (Array.isArray(errors)) {
                    errors.forEach(err => {
                        if (err.field === 'username') {
                            document.getElementById('username-error').textContent = err.message; // Show username error
                        } else if (err.field === 'newPassword') {
                            document.getElementById('password-error').textContent = err.message; // Show password error
                        }
                    });
                } else {
                    alert('Create user failed: ' + response.status + ' - ' + text); // Fallback for other errors
                }
            } catch (e) {
                alert('Create user failed: ' + response.status + ' - ' + text); // If not JSON
            }
        }
    } catch (error) {
        alert('Create user error: ' + error.message); // Network errors
    }
}

// Show authentication section (login form)
function showAuthSection() {
    authSection.style.display = 'block';
    taskSection.style.display = 'none';
}

// Show task management section
function showTaskSection() {
    authSection.style.display = 'none';
    taskSection.style.display = 'block';
}

// Logout: Clear token and show login
function logout() {
    localStorage.removeItem('token'); // Remove stored token
    token = null; // Clear global token
    showAuthSection(); // Back to login
}

// Load tasks from server and render them
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}tasks`, {
            headers: { 'Authorization': `Bearer ${token}` } // Include JWT token
        });
        if (response.ok) {
            const tasks = await response.json(); // Array of task objects
            taskList.innerHTML = ''; // Clear existing tasks
            tasks.forEach(renderTask); // Render each task
        } else {
            alert('Failed to load tasks'); // Show error if fetch fails
        }
    } catch (error) {
        alert('Load tasks error: ' + error.message); // Network errors
    }
}

// Handler for add task button
function addTaskHandler() {
    createTaskOnServer(); // Create new task on server
}

// Create a new task on the server
async function createTaskOnServer() {
    try {
        const response = await fetch(`${API_BASE}tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Auth header
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'New Task', desc: '' }) // Default task data
        });
        if (response.ok) {
            const task = await response.json(); // Get created task with ID
            renderTask(task); // Add to UI
        } else {
            alert('Failed to create task');
        }
    } catch (error) {
        alert('Create task error: ' + error.message);
    }
}

// Render a task: Create DOM element and append to list
function renderTask(task) {
    const taskRow = createTaskRow(task); // Build the task element
    taskList.appendChild(taskRow); // Add to task list
}

// Create a task row element from task data
function createTaskRow(task) {
    let taskRow = document.querySelector('[data-template="task-row"]').cloneNode(true); // Clone template
    taskRow.removeAttribute('data-template'); // Remove template marker

    // Populate form fields with task data
    const name = taskRow.querySelector("[name='name']"); // Task name input
    name.value = task.title; // Set title
    name.dataset.oldTitle = task.title; // Store original title for reversion
    if (task.title === 'New Task') {
        name.readOnly = true; // Make new tasks readonly initially
        name.style.color = 'gray'; // Gray color for placeholder
    }

    const deadline = taskRow.querySelector("[name='deadline']"); // Deadline input
    deadline.value = task.desc || ''; // Set deadline from desc
    deadline.dataset.oldDeadline = task.desc || ''; // Store original deadline

    const checkbox = taskRow.querySelector("[name='completed']"); // Completion checkbox
    checkbox.checked = task.marked_as_done; // Set checked state

    const deleteButton = taskRow.querySelector('.delete-task'); // Delete button
    deleteButton.addEventListener('click', () => {
        deleteTask(task.id, taskRow); // Delete on click
    });

    // Event listeners for updates
    name.addEventListener('blur', () => { // Update title on blur
        const newTitle = name.value.trim();
        if (newTitle && newTitle !== name.dataset.oldTitle) {
            updateTask(task.id, { title: newTitle }); // Send update
            name.dataset.oldTitle = newTitle; // Update stored title
        } else if (!newTitle) {
            name.value = name.dataset.oldTitle; // Revert if empty
        }
    });

    deadline.addEventListener('blur', () => { // Update deadline on blur
        const newDeadline = deadline.value;
        if (newDeadline !== deadline.dataset.oldDeadline) {
            updateTask(task.id, { desc: newDeadline }); // Send update to desc
            deadline.dataset.oldDeadline = newDeadline; // Update stored deadline
            // Update overdue status
            if (newDeadline && new Date(newDeadline) < new Date() && !checkbox.checked) {
                taskRow.classList.add('overdue');
            } else {
                taskRow.classList.remove('overdue');
            }
        }
    });

    name.addEventListener('focus', () => { // Handle focus for new tasks
        if (name.readOnly) {
            name.readOnly = false; // Make editable
            name.value = ''; // Clear placeholder
            name.style.color = 'white'; // Change color for dark theme
            name.dataset.oldTitle = ''; // Reset old title
        }
    });

    checkbox.addEventListener('change', () => { // Update completion
        updateTask(task.id, { marked_as_done: checkbox.checked });
        // Update overdue status
        if (checkbox.checked) {
            taskRow.classList.remove('overdue');
        } else if (deadline.value && new Date(deadline.value) < new Date()) {
            taskRow.classList.add('overdue');
        }
    });

    // Check if overdue
    if (deadline.value && new Date(deadline.value) < new Date() && !checkbox.checked) {
        taskRow.classList.add('overdue');
    }

    // Style checkboxes
    hydrateAntCheckboxes(taskRow);

    return taskRow; // Return the built element
}

// Update a task on the server
async function updateTask(id, updates) {
    try {
        const response = await fetch(`${API_BASE}tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates) // Partial update (e.g., { title: 'new' } or { marked_as_done: true })
        });
        if (!response.ok) {
            alert('Failed to update task'); // Show error if update fails
        }
    } catch (error) {
        alert('Update task error: ' + error.message); // Network errors
    }
}

// Delete a task from server and UI
async function deleteTask(id, taskRow) {
    try {
        const response = await fetch(`${API_BASE}tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            taskList.removeChild(taskRow); // Remove from DOM if successful
        } else {
            alert('Failed to delete task');
        }
    } catch (error) {
        alert('Delete task error: ' + error.message);
    }
}


// Hydrate Ant Design checkboxes: Add event listeners for styling
function hydrateAntCheckboxes(element) {
    const elements = element.querySelectorAll('.ant-checkbox-wrapper'); // Find all checkbox wrappers
    for (let i = 0; i < elements.length; i++) {
        let wrapper = elements[i];

        // Skip if already processed
        if (wrapper.__hydrated) continue;
        wrapper.__hydrated = true; // Mark as processed

        const checkbox = wrapper.querySelector('.ant-checkbox'); // Visual checkbox
        const input = wrapper.querySelector('.ant-checkbox-input'); // Hidden input

        // Set initial checked state
        if (input.checked) {
            checkbox.classList.add('ant-checkbox-checked'); // Add checked class
        }
        
        // Toggle checked class on input change
        input.addEventListener('change', () => {
            checkbox.classList.toggle('ant-checkbox-checked');
        });
    }
}