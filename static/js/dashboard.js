// Dashboard JavaScript

// Chart instances
let pieChart, lineChart, barChart, donutChart, monthlyChart, topExpensesChart, cumulativeChart;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
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

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load summary cards
        const summaryResponse = await fetch('/api/dashboard/summary');
        const summaryData = await summaryResponse.json();
        updateSummaryCards(summaryData);
        updateBudgetProgress(summaryData);

        // Load all charts
        await Promise.all([
            loadCategoryDistribution(),
            loadDailyTrend(),
            loadCategoryBar(),
            loadPaymentMode(),
            loadMonthlyComparison(),
            loadTopExpenses(),
            loadCumulativeSpending()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update summary cards
function updateSummaryCards(data) {
    document.getElementById('month-total').textContent = `₹${data.month_total.toLocaleString('en-IN')}`;
    document.getElementById('today-total').textContent = `₹${data.today_total.toLocaleString('en-IN')}`;
    document.getElementById('avg-daily').textContent = `₹${data.avg_daily.toLocaleString('en-IN')}`;
    
    const remainingBudgetCard = document.getElementById('remaining-budget-card');
    const remainingBudgetValue = document.getElementById('remaining-budget');
    
    // Check if budget is exceeded
    if (data.remaining_budget < 0 || data.budget_usage_percent >= 100) {
        // Budget exceeded - show red styling
        remainingBudgetCard.classList.add('out-of-budget');
        const exceededAmount = Math.abs(data.remaining_budget);
        remainingBudgetValue.textContent = `-₹${exceededAmount.toLocaleString('en-IN')}`;
        remainingBudgetValue.style.color = 'var(--error)';
        remainingBudgetValue.style.fontWeight = '700';
        
        // Update label to show warning
        const label = remainingBudgetCard.querySelector('.card-label');
        if (label) {
            label.textContent = 'Budget Exceeded!';
            label.style.color = 'var(--error)';
        }
    } else {
        // Within budget - normal styling
        remainingBudgetCard.classList.remove('out-of-budget');
        remainingBudgetValue.textContent = `₹${data.remaining_budget.toLocaleString('en-IN')}`;
        remainingBudgetValue.style.color = '';
        remainingBudgetValue.style.fontWeight = '';
        
        // Reset label
        const label = remainingBudgetCard.querySelector('.card-label');
        if (label) {
            label.textContent = 'This Month';
            label.style.color = '';
        }
    }
}

// Update budget progress bar
function updateBudgetProgress(data) {
    const progressBar = document.getElementById('budget-progress');
    const percentSpan = document.getElementById('budget-percent');
    const percent = data.budget_usage_percent;

    progressBar.style.width = `${Math.min(percent, 100)}%`;
    percentSpan.textContent = `${percent.toFixed(1)}%`;

    // Change color based on usage
    progressBar.classList.remove('warning', 'danger');
    if (percent >= 100) {
        progressBar.classList.add('danger');
    } else if (percent >= 80) {
        progressBar.classList.add('warning');
    }
}

// Load category distribution (Pie Chart)
async function loadCategoryDistribution() {
    try {
        const response = await fetch('/api/dashboard/charts/category-distribution');
        const data = await response.json();

        const ctx = document.getElementById('pieChart').getContext('2d');
        
        if (pieChart) {
            pieChart.destroy();
        }

        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.categories,
                datasets: [{
                    data: data.amounts,
                    backgroundColor: [
                        '#3A5BA0', '#2F8F9D', '#6BA292', '#8B5E83',
                        '#A3A3A3', '#3A5BA0', '#2F8F9D', '#6BA292',
                        '#8B5E83', '#A3A3A3'
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
        console.error('Error loading category distribution:', error);
    }
}

// Load daily trend (Line Chart)
async function loadDailyTrend() {
    try {
        const response = await fetch('/api/dashboard/charts/daily-trend');
        const data = await response.json();

        const ctx = document.getElementById('lineChart').getContext('2d');
        
        if (lineChart) {
            lineChart.destroy();
        }

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates.map(date => formatDate(date)),
                datasets: [{
                    label: 'Daily Expense',
                    data: data.amounts,
                    borderColor: '#3A5BA0',
                    backgroundColor: 'rgba(58, 91, 160, 0.08)',
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
        console.error('Error loading daily trend:', error);
    }
}

// Load category bar chart
async function loadCategoryBar() {
    try {
        const response = await fetch('/api/dashboard/charts/category-bar');
        const data = await response.json();

        const ctx = document.getElementById('barChart').getContext('2d');
        
        if (barChart) {
            barChart.destroy();
        }

        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.categories,
                datasets: [{
                    label: 'Amount',
                    data: data.amounts,
                    backgroundColor: '#3A5BA0'
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
        console.error('Error loading category bar:', error);
    }
}

// Load payment mode (Donut Chart)
async function loadPaymentMode() {
    try {
        const response = await fetch('/api/dashboard/charts/payment-mode');
        const data = await response.json();

        const ctx = document.getElementById('donutChart').getContext('2d');
        
        if (donutChart) {
            donutChart.destroy();
        }

        donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.modes,
                datasets: [{
                    data: data.amounts,
                    backgroundColor: ['#3A5BA0', '#2F8F9D', '#6BA292']
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
        console.error('Error loading payment mode:', error);
    }
}

// Load monthly comparison
async function loadMonthlyComparison() {
    try {
        const response = await fetch('/api/dashboard/charts/monthly-comparison');
        const data = await response.json();

        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.months,
                datasets: [{
                    label: 'Monthly Expense',
                    data: data.amounts,
                    backgroundColor: '#3A5BA0'
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

// Load top expenses
async function loadTopExpenses() {
    try {
        const response = await fetch('/api/dashboard/charts/top-expenses');
        const data = await response.json();

        const ctx = document.getElementById('topExpensesChart').getContext('2d');
        
        if (topExpensesChart) {
            topExpensesChart.destroy();
        }

        topExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Amount',
                    data: data.amounts,
                    backgroundColor: '#2F8F9D'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading top expenses:', error);
    }
}

// Load cumulative spending
async function loadCumulativeSpending() {
    try {
        const response = await fetch('/api/dashboard/charts/cumulative');
        const data = await response.json();

        const ctx = document.getElementById('cumulativeChart').getContext('2d');
        
        if (cumulativeChart) {
            cumulativeChart.destroy();
        }

        cumulativeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates.map(date => formatDate(date)),
                datasets: [{
                    label: 'Cumulative Spending',
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
        console.error('Error loading cumulative spending:', error);
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Modal functions
function openExpenseModal() {
    document.getElementById('expenseModal').style.display = 'block';
    setDefaultDate();
}

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    document.getElementById('expenseForm').reset();
    setDefaultDate();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('expenseModal');
    if (event.target == modal) {
        closeExpenseModal();
    }
}

// Setup expense form
function setupExpenseForm() {
    const form = document.getElementById('expenseForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            payment_mode: document.getElementById('payment_mode').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Expense added successfully!');
                closeExpenseModal();
                // Reload dashboard data
                loadDashboardData();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Error adding expense. Please try again.');
        }
    });
}

