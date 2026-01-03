// Budget Management JavaScript

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupMonthlyBudgetForm();
    setupCategoryBudgetForm();
    loadBudgets();
    setDefaultMonth();
});

// Set default month to current month
function setDefaultMonth() {
    const monthInputs = document.querySelectorAll('input[type="month"]');
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthInputs.forEach(input => {
        if (!input.value) {
            input.value = currentMonth;
        }
    });
}

// Setup monthly budget form
function setupMonthlyBudgetForm() {
    const form = document.getElementById('monthlyBudgetForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            amount: parseFloat(document.getElementById('monthly-budget-amount').value),
            type: 'monthly',
            month: document.getElementById('budget-month').value
        };

        try {
            const response = await fetch('/api/budget', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Monthly budget set successfully!');
                form.reset();
                setDefaultMonth();
                loadBudgets();
                updateBudgetStatus();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error setting budget:', error);
            alert('Error setting budget. Please try again.');
        }
    });
}

// Setup category budget form
function setupCategoryBudgetForm() {
    const form = document.getElementById('categoryBudgetForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            amount: parseFloat(document.getElementById('category-budget-amount').value),
            type: 'category',
            month: document.getElementById('category-budget-month').value,
            category: document.getElementById('category-budget-category').value
        };

        try {
            const response = await fetch('/api/budget', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Category budget set successfully!');
                form.reset();
                setDefaultMonth();
                loadBudgets();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error setting budget:', error);
            alert('Error setting budget. Please try again.');
        }
    });
}

// Load budgets
async function loadBudgets() {
    const container = document.getElementById('budgets-list');
    container.innerHTML = '<p class="loading">Loading budgets...</p>';

    try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const response = await fetch(`/api/budget?month=${currentMonth}`);
        const budgets = await response.json();

        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>No budgets set for this month. Set your first budget above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = budgets.map(budget => {
            const budgetType = budget.type === 'monthly' ? 'Monthly Budget' : `Category: ${budget.category}`;
            return `
                <div class="budget-item">
                    <div class="budget-item-info">
                        <h4>${budgetType}</h4>
                        <p>Amount: ₹${budget.amount.toLocaleString('en-IN')} | Month: ${budget.month}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading budgets:', error);
        container.innerHTML = '<p class="loading">Error loading budgets. Please try again.</p>';
    }
}

// Update budget status
async function updateBudgetStatus() {
    try {
        const response = await fetch('/api/dashboard/summary');
        const data = await response.json();

        const statusDiv = document.getElementById('monthly-budget-status');
        
        if (data.monthly_budget === 0) {
            statusDiv.innerHTML = '';
            return;
        }

        const percent = data.budget_usage_percent;
        let statusClass = 'success';
        let statusText = '';

        if (percent >= 100) {
            statusClass = 'danger';
            statusText = `⚠️ Budget exceeded! You've spent ${percent.toFixed(1)}% of your monthly budget.`;
        } else if (percent >= 80) {
            statusClass = 'warning';
            statusText = `⚠️ Budget warning! You've used ${percent.toFixed(1)}% of your monthly budget.`;
        } else {
            statusText = `✓ Budget on track. You've used ${percent.toFixed(1)}% of your monthly budget.`;
        }

        statusDiv.className = `budget-status ${statusClass}`;
        statusDiv.textContent = statusText;
    } catch (error) {
        console.error('Error updating budget status:', error);
    }
}

// Call updateBudgetStatus periodically
setInterval(() => {
    updateBudgetStatus().catch(err => console.error('Error updating budget status:', err));
}, 30000); // Update every 30 seconds
updateBudgetStatus().catch(err => console.error('Error updating budget status:', err));

