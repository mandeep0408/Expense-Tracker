// Expense History JavaScript

let editingExpenseId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadExpenses();
    setupExpenseForm();
    setDefaultDate();
});

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// Load expenses with optional filters
async function loadExpenses() {
    const container = document.getElementById('expense-list-container');
    container.innerHTML = '<p class="loading">Loading expenses...</p>';

    try {
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;
        const category = document.getElementById('filter-category').value;

        let url = '/api/expenses?';
        const params = [];
        
        if (dateFrom) params.push(`date_from=${dateFrom}`);
        if (dateTo) params.push(`date_to=${dateTo}`);
        if (category) params.push(`category=${category}`);

        url += params.join('&');

        const response = await fetch(url);
        const expenses = await response.json();

        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>No expenses found. Add your first expense!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <h3>₹${expense.amount.toLocaleString('en-IN')}</h3>
                    <p><strong>Category:</strong> ${expense.category}</p>
                    <p><strong>Date:</strong> ${formatDate(expense.date)}</p>
                    <p><strong>Payment Mode:</strong> ${expense.payment_mode}</p>
                    ${expense.notes ? `<p><strong>Notes:</strong> ${expense.notes}</p>` : ''}
                </div>
                <div class="expense-actions">
                    <button class="btn-edit" onclick="editExpense(${expense.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading expenses:', error);
        container.innerHTML = '<p class="loading">Error loading expenses. Please try again.</p>';
    }
}

// Apply filters
function applyFilters() {
    loadExpenses();
}

// Clear filters
function clearFilters() {
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-category').value = '';
    loadExpenses();
}

// Edit expense
async function editExpense(id) {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        const expense = expenses.find(e => e.id === id);

        if (!expense) {
            alert('Expense not found');
            return;
        }

        editingExpenseId = id;
        document.getElementById('expense-id').value = id;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('date').value = expense.date;
        document.getElementById('payment_mode').value = expense.payment_mode;
        document.getElementById('notes').value = expense.notes || '';
        document.getElementById('modal-title').textContent = 'Edit Expense';
        openExpenseModal();
    } catch (error) {
        console.error('Error loading expense:', error);
        alert('Error loading expense details');
    }
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Expense deleted successfully!');
            loadExpenses();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense. Please try again.');
    }
}

// Setup expense form
function setupExpenseForm() {
    const form = document.getElementById('expenseForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const expenseId = document.getElementById('expense-id').value;
        const formData = {
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            payment_mode: document.getElementById('payment_mode').value,
            notes: document.getElementById('notes').value
        };

        try {
            let response;
            if (expenseId) {
                // Update existing expense
                response = await fetch(`/api/expenses/${expenseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new expense
                response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();

            if (result.success) {
                alert(expenseId ? 'Expense updated successfully!' : 'Expense added successfully!');
                closeExpenseModal();
                loadExpenses();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Error saving expense. Please try again.');
        }
    });
}

// Modal functions
function openExpenseModal() {
    document.getElementById('expenseModal').style.display = 'block';
    if (!editingExpenseId) {
        setDefaultDate();
    }
}

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    document.getElementById('expenseForm').reset();
    document.getElementById('expense-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Expense';
    editingExpenseId = null;
    setDefaultDate();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('expenseModal');
    if (event.target == modal) {
        closeExpenseModal();
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

