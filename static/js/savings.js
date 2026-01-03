// Savings JavaScript

// Chart instances
let growthChart, sourceChart, monthlySavingsChart;
let editingSavingId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavingsData();
    setupSavingsForm();
    setupGoalForm();
    setDefaultDate();
});

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('savings-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

// Load all savings data
async function loadSavingsData() {
    try {
        // Load summary cards
        const summaryResponse = await fetch('/api/savings/summary');
        const summaryData = await summaryResponse.json();
        updateSummaryCards(summaryData);

        // Load goals
        await loadGoals();

        // Load all charts
        await Promise.all([
            loadSavingsGrowth(),
            loadSourceDistribution(),
            loadMonthlyComparison()
        ]);
    } catch (error) {
        console.error('Error loading savings data:', error);
    }
}

// Update summary cards
function updateSummaryCards(data) {
    document.getElementById('total-savings').textContent = `₹${data.total_savings.toLocaleString('en-IN')}`;
    document.getElementById('month-savings').textContent = `₹${data.month_savings.toLocaleString('en-IN')}`;
    document.getElementById('active-goal-name').textContent = data.active_goal_name || 'None';
    document.getElementById('remaining-to-goal').textContent = `₹${data.remaining_to_goal.toLocaleString('en-IN')}`;
}

// Load savings growth chart
async function loadSavingsGrowth() {
    try {
        const response = await fetch('/api/savings/charts/growth');
        const data = await response.json();

        const ctx = document.getElementById('growthChart').getContext('2d');
        
        if (growthChart) {
            growthChart.destroy();
        }

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates.map(date => formatDate(date)),
                datasets: [{
                    label: 'Cumulative Savings',
                    data: data.cumulative,
                    borderColor: '#6BA292',
                    backgroundColor: 'rgba(107, 162, 146, 0.08)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#6B7280'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error loading savings growth:', error);
    }
}

// Load source distribution chart
async function loadSourceDistribution() {
    try {
        const response = await fetch('/api/savings/charts/source-distribution');
        const data = await response.json();

        const ctx = document.getElementById('sourceChart').getContext('2d');
        
        if (sourceChart) {
            sourceChart.destroy();
        }

        sourceChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.sources,
                datasets: [{
                    data: data.amounts,
                    backgroundColor: [
                        '#3A5BA0', '#2F8F9D', '#6BA292', '#8B5E83', '#A3A3A3'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error loading source distribution:', error);
    }
}

// Load monthly comparison chart
async function loadMonthlyComparison() {
    try {
        const response = await fetch('/api/savings/charts/monthly-comparison');
        const data = await response.json();

        const ctx = document.getElementById('monthlySavingsChart').getContext('2d');
        
        if (monthlySavingsChart) {
            monthlySavingsChart.destroy();
        }

        monthlySavingsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.months,
                datasets: [{
                    label: 'Monthly Savings',
                    data: data.amounts,
                    backgroundColor: '#6BA292'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#6B7280'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error loading monthly comparison:', error);
    }
}

// Load goals
async function loadGoals() {
    const container = document.getElementById('goals-list');
    
    try {
        const response = await fetch('/api/savings/goals');
        const goals = await response.json();

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>No savings goals set. Create your first goal!</p>
                </div>
            `;
            updateGoalProgress([]);
            return;
        }

        // Display goals
        container.innerHTML = goals.map(goal => `
            <div class="budget-item">
                <div class="budget-item-info" style="flex: 1;">
                    <h4>${goal.goal_name}</h4>
                    <p>Target: ₹${goal.target_amount.toLocaleString('en-IN')} | 
                       Current: ₹${goal.current_amount.toLocaleString('en-IN')} | 
                       ${goal.target_date ? `Target Date: ${formatDate(goal.target_date)}` : 'No target date'}
                    </p>
                    <div class="progress-bar-wrapper" style="margin-top: 10px;">
                        <div class="progress-bar" style="width: ${Math.min(goal.progress_percent, 100)}%;">
                            <span>${goal.progress_percent.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <button class="btn-delete" onclick="deleteGoal(${goal.id})">Delete</button>
            </div>
        `).join('');

        // Update goal progress visualization
        updateGoalProgress(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
        container.innerHTML = '<p class="loading">Error loading goals. Please try again.</p>';
    }
}

// Update goal progress visualization
function updateGoalProgress(goals) {
    const container = document.getElementById('goal-progress-container');
    
    if (goals.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9CA3AF;">No goals to display</p>';
        return;
    }

    container.innerHTML = goals.map(goal => `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong style="color: #1F2937; font-weight: 600;">${goal.goal_name}</strong>
                <span style="color: #6B7280; font-weight: 500;">${goal.progress_percent.toFixed(1)}%</span>
            </div>
            <div class="progress-bar-wrapper">
                <div class="progress-bar ${goal.progress_percent >= 100 ? 'success' : goal.progress_percent >= 80 ? 'warning' : ''}" 
                     style="width: ${Math.min(goal.progress_percent, 100)}%; background: ${goal.progress_percent >= 100 ? '#4CAF8E' : goal.progress_percent >= 80 ? '#E0B84E' : '#6BA292'};">
                    <span>₹${goal.current_amount.toLocaleString('en-IN')} / ₹${goal.target_amount.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup savings form
function setupSavingsForm() {
    const form = document.getElementById('savingsForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const savingId = document.getElementById('saving-id').value;
        const formData = {
            amount: parseFloat(document.getElementById('savings-amount').value),
            source: document.getElementById('savings-source').value,
            date: document.getElementById('savings-date').value,
            notes: document.getElementById('savings-notes').value
        };

        try {
            let response;
            if (savingId) {
                // Update existing saving
                response = await fetch(`/api/savings/${savingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new saving
                response = await fetch('/api/savings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();

            if (result.success) {
                alert(savingId ? 'Savings updated successfully!' : 'Savings added successfully!');
                closeSavingsModal();
                loadSavingsData();
                if (document.getElementById('history-section').style.display !== 'none') {
                    loadSavingsHistory();
                }
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving savings:', error);
            alert('Error saving savings. Please try again.');
        }
    });
}

// Setup goal form
function setupGoalForm() {
    const form = document.getElementById('goalForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            goal_name: document.getElementById('goal-name').value,
            target_amount: parseFloat(document.getElementById('goal-target-amount').value),
            target_date: document.getElementById('goal-target-date').value || null
        };

        try {
            const response = await fetch('/api/savings/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Savings goal created successfully!');
                closeGoalModal();
                form.reset();
                loadGoals();
                loadSavingsData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Error creating goal. Please try again.');
        }
    });
}

// Load savings history
async function loadSavingsHistory() {
    const container = document.getElementById('savings-list-container');
    container.innerHTML = '<p class="loading">Loading savings...</p>';

    try {
        const dateFrom = document.getElementById('savings-filter-date-from').value;
        const dateTo = document.getElementById('savings-filter-date-to').value;
        const source = document.getElementById('savings-filter-source').value;

        let url = '/api/savings?';
        const params = [];
        
        if (dateFrom) params.push(`date_from=${dateFrom}`);
        if (dateTo) params.push(`date_to=${dateTo}`);
        if (source) params.push(`source=${source}`);

        url += params.join('&');

        const response = await fetch(url);
        const savings = await response.json();

        if (savings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>No savings found. Add your first savings entry!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = savings.map(saving => `
            <div class="expense-item">
                <div class="expense-info">
                    <h3>₹${saving.amount.toLocaleString('en-IN')}</h3>
                    <p><strong>Source:</strong> ${saving.source}</p>
                    <p><strong>Date:</strong> ${formatDate(saving.date)}</p>
                    ${saving.notes ? `<p><strong>Notes:</strong> ${saving.notes}</p>` : ''}
                </div>
                <div class="expense-actions">
                    <button class="btn-edit" onclick="editSaving(${saving.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteSaving(${saving.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading savings:', error);
        container.innerHTML = '<p class="loading">Error loading savings. Please try again.</p>';
    }
}

// Edit saving
async function editSaving(id) {
    try {
        const response = await fetch('/api/savings');
        const savings = await response.json();
        const saving = savings.find(s => s.id === id);

        if (!saving) {
            alert('Savings entry not found');
            return;
        }

        editingSavingId = id;
        document.getElementById('saving-id').value = id;
        document.getElementById('savings-amount').value = saving.amount;
        document.getElementById('savings-source').value = saving.source;
        document.getElementById('savings-date').value = saving.date;
        document.getElementById('savings-notes').value = saving.notes || '';
        document.getElementById('savings-modal-title').textContent = 'Edit Savings';
        openSavingsModal();
    } catch (error) {
        console.error('Error loading saving:', error);
        alert('Error loading savings details');
    }
}

// Delete saving
async function deleteSaving(id) {
    if (!confirm('Are you sure you want to delete this savings entry?')) {
        return;
    }

    try {
        const response = await fetch(`/api/savings/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Savings deleted successfully!');
            loadSavingsHistory();
            loadSavingsData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting saving:', error);
        alert('Error deleting savings. Please try again.');
    }
}

// Delete goal
async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this savings goal?')) {
        return;
    }

    try {
        const response = await fetch(`/api/savings/goals/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Savings goal deleted successfully!');
            loadGoals();
            loadSavingsData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Error deleting goal. Please try again.');
    }
}

// Apply filters
function applySavingsFilters() {
    loadSavingsHistory();
}

// Clear filters
function clearSavingsFilters() {
    document.getElementById('savings-filter-date-from').value = '';
    document.getElementById('savings-filter-date-to').value = '';
    document.getElementById('savings-filter-source').value = '';
    loadSavingsHistory();
}

// Show history
function showHistory() {
    document.getElementById('history-section').style.display = 'block';
    loadSavingsHistory();
}

// Hide history
function hideHistory() {
    document.getElementById('history-section').style.display = 'none';
}

// Modal functions
function openSavingsModal() {
    document.getElementById('savingsModal').style.display = 'block';
    if (!editingSavingId) {
        setDefaultDate();
    }
}

function closeSavingsModal() {
    document.getElementById('savingsModal').style.display = 'none';
    document.getElementById('savingsForm').reset();
    document.getElementById('saving-id').value = '';
    document.getElementById('savings-modal-title').textContent = 'Add Savings';
    editingSavingId = null;
    setDefaultDate();
}

function openGoalModal() {
    document.getElementById('goalModal').style.display = 'block';
}

function closeGoalModal() {
    document.getElementById('goalModal').style.display = 'none';
    document.getElementById('goalForm').reset();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const savingsModal = document.getElementById('savingsModal');
    const goalModal = document.getElementById('goalModal');
    
    if (event.target == savingsModal) {
        closeSavingsModal();
    }
    if (event.target == goalModal) {
        closeGoalModal();
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

