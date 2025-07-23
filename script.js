/**
 * To-Do List Application
 * A complete task management application with local storage
 */

class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.pendingTasks = document.getElementById('pendingTasks');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission for adding tasks
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        // Task list interactions (event delegation)
        this.tasksList.addEventListener('click', (e) => this.handleTaskAction(e));
        this.tasksList.addEventListener('keypress', (e) => this.handleKeyPress(e));
        
        // Auto-save when editing (blur event)
        this.tasksList.addEventListener('blur', (e) => {
            if (e.target.classList.contains('editing')) {
                this.saveEdit(e.target);
            }
        }, true);
    }

    /**
     * Handle adding new tasks
     */
    handleAddTask(e) {
        e.preventDefault();
        const taskText = this.taskInput.value.trim();
        
        // Validation
        if (!taskText) {
            this.showError('Please enter a task description');
            return;
        }

        if (taskText.length > 200) {
            this.showError('Task description is too long (max 200 characters)');
            return;
        }

        // Create new task object
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Add task to beginning of array
        this.tasks.unshift(newTask);
        
        // Update storage and UI
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.taskInput.value = '';
        this.showSuccess('Task added successfully!');
    }

    /**
     * Handle task interactions (toggle, edit, delete)
     */
    handleTaskAction(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = parseInt(taskItem.dataset.id);

        // Determine action based on clicked element
        if (e.target.classList.contains('task-checkbox')) {
            this.toggleTask(taskId);
        } else if (e.target.classList.contains('edit-btn')) {
            this.startEdit(taskId);
        } else if (e.target.classList.contains('delete-btn')) {
            this.deleteTask(taskId);
        } else if (e.target.classList.contains('save-btn')) {
            const textElement = taskItem.querySelector('.task-text');
            this.saveEdit(textElement);
        } else if (e.target.classList.contains('cancel-btn')) {
            this.cancelEdit(taskId);
        }
    }

    /**
     * Handle keyboard shortcuts while editing
     */
    handleKeyPress(e) {
        if (e.key === 'Enter' && e.target.classList.contains('editing')) {
            e.preventDefault();
            this.saveEdit(e.target);
        } else if (e.key === 'Escape' && e.target.classList.contains('editing')) {
            const taskId = parseInt(e.target.closest('.task-item').dataset.id);
            this.cancelEdit(taskId);
        }
    }

    /**
     * Toggle task completion status
     */
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending';
            this.showSuccess(message);
        }
    }

    /**
     * Start editing a task
     */
    startEdit(taskId) {
        // Cancel any existing edit
        if (this.currentEditId !== null) {
            this.cancelEdit(this.currentEditId);
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditId = taskId;
        const taskItem = document.querySelector(`[data-id="${taskId}"]`);
        const textElement = taskItem.querySelector('.task-text');
        const actionsElement = taskItem.querySelector('.task-actions');

        // Make text editable
        textElement.contentEditable = true;
        textElement.classList.add('editing');
        textElement.focus();

        // Select all text for easy editing
        const range = document.createRange();
        range.selectNodeContents(textElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Update action buttons
        actionsElement.innerHTML = `
            <button class="action-btn save-btn">Save</button>
            <button class="action-btn cancel-btn">Cancel</button>
        `;
    }

    /**
     * Save edited task
     */
    saveEdit(textElement) {
        const taskItem = textElement.closest('.task-item');
        const taskId = parseInt(taskItem.dataset.id);
        const newText = textElement.textContent.trim();

        // Validation
        if (!newText) {
            this.showError('Task description cannot be empty');
            return;
        }

        if (newText.length > 200) {
            this.showError('Task description is too long (max 200 characters)');
            return;
        }

        // Update task if text changed
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.text !== newText) {
            task.text = newText;
            this.saveTasks();
            this.showSuccess('Task updated successfully!');
        }

        // Reset edit state
        this.currentEditId = null;
        textElement.contentEditable = false;
        textElement.classList.remove('editing');
        this.renderTasks();
    }

    /**
     * Cancel editing a task
     */
    cancelEdit(taskId) {
        this.currentEditId = null;
        this.renderTasks();
    }

    /**
     * Delete a task with confirmation
     */
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showSuccess('Task deleted successfully!');
        }
    }

    /**
     * Render all tasks to the DOM
     */
    renderTasks() {
        // Show empty state if no tasks
        if (this.tasks.length === 0) {
            this.tasksList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        // Show tasks list
        this.tasksList.style.display = 'block';
        this.emptyState.style.display = 'none';

        // Generate HTML for all tasks
        this.tasksList.innerHTML = this.tasks.map(task => {
            const isEditing = this.currentEditId === task.id;
            const editActions = isEditing 
                ? `<button class="action-btn save-btn">Save</button>
                   <button class="action-btn cancel-btn">Cancel</button>`
                : `<button class="action-btn edit-btn">Edit</button>
                   <button class="action-btn delete-btn">Delete</button>`;

            return `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
                    <div class="task-text ${task.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}" 
                         ${isEditing ? 'contenteditable="true"' : ''}>${task.text}</div>
                    <div class="task-actions">
                        ${editActions}
                    </div>
                </li>
            `;
        }).join('');

        // Focus on editing task if any
        if (this.currentEditId) {
            const editingElement = document.querySelector('.task-text.editing');
            if (editingElement) {
                editingElement.focus();
            }
        }
    }

    /**
     * Update task statistics
     */
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.totalTasks.textContent = total;
        this.completedTasks.textContent = completed;
        this.pendingTasks.textContent = pending;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideMessages();
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => this.hideMessages(), 3000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.hideMessages();
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        setTimeout(() => this.hideMessages(), 2000);
    }

    /**
     * Hide all messages
     */
    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    /**
     * Save tasks to local storage
     */
    saveTasks() {
        try {
            localStorage.setItem('todoAppTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks to localStorage:', error);
            this.showError('Failed to save tasks. Please try again.');
        }
    }

    /**
     * Load tasks from local storage
     */
    loadTasks() {
        try {
            const tasksData = localStorage.getItem('todoAppTasks');
            if (tasksData) {
                return JSON.parse(tasksData);
            }
        } catch (error) {
            console.error('Failed to load tasks from localStorage:', error);
            this.showError('Failed to load saved tasks.');
        }
        return [];
    }

    /**
     * Clear all tasks (utility method for future use)
     */
    clearAllTasks() {
        if (confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showSuccess('All tasks cleared!');
        }
    }

    /**
     * Export tasks as JSON (utility method for future use)
     */
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Optional: Add global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Quick add task with Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const taskInput = document.getElementById('taskInput');
        if (taskInput) {
            taskInput.focus();
        }
    }
});