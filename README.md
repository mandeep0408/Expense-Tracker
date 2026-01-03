# Personal Expense Tracker

A comprehensive web application for tracking personal expenses with a data-rich dashboard for expense analysis.

## Features

### 📊 Dashboard
- **Summary Cards**: Total expenses, today's spending, average daily spend, remaining monthly budget
- **8 Different Charts**:
  - Pie chart - Category-wise expense distribution
  - Line chart - Daily expense trend
  - Bar chart - Category vs total amount
  - Donut chart - Payment mode split (Cash/UPI/Card)
  - Bar chart - Monthly expense comparison
  - Progress bar - Budget usage percentage
  - Horizontal bar - Top 5 highest expenses
  - Line chart - Cumulative spending over the month

### 💰 Expense Management
- Add expenses with amount, category, date, payment mode, and notes
- View expense history with filters
- Edit and delete expenses
- Fast expense entry (under 10 seconds)

### 📈 Budget Management
- Set monthly budget
- Optional category-wise budget
- Budget alerts when exceeding 80% or 100%

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Charts**: Chart.js
- **Database**: SQLite

## Installation

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variable (optional for local development)**:
   ```bash
   # Windows PowerShell
   $env:SECRET_KEY="your-secret-key-here"
   
   # Mac/Linux
   export SECRET_KEY="your-secret-key-here"
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

## Deployment

For detailed deployment instructions to free hosting platforms (Render, Railway, PythonAnywhere, Fly.io), see [DEPLOYMENT.md](DEPLOYMENT.md).

## Project Structure

```
Analysis/
├── app.py                 # Main Flask application
├── database.py            # Database initialization and connection
├── requirements.txt       # Python dependencies
├── expenses.db            # SQLite database (created automatically)
├── templates/
│   ├── dashboard.html     # Main dashboard page
│   ├── expense_history.html  # Expense history page
│   └── budget.html        # Budget management page
└── static/
    ├── css/
    │   └── style.css      # Stylesheet
    └── js/
        ├── dashboard.js   # Dashboard JavaScript
        ├── expense_history.js  # Expense history JavaScript
        └── budget.js      # Budget management JavaScript
```

## Database Schema

### Expenses Table
- `id` - Primary key
- `amount` - Expense amount
- `category` - Expense category
- `date` - Expense date
- `payment_mode` - Payment mode (Cash/UPI/Card)
- `notes` - Optional notes
- `created_at` - Timestamp

### Categories Table
- `id` - Primary key
- `name` - Category name

### Budget Table
- `id` - Primary key
- `amount` - Budget amount
- `type` - Budget type (monthly/category)
- `month` - Month (YYYY-MM format)
- `category` - Category (for category-wise budgets)
- `created_at` - Timestamp

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses (with optional filters)
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/<id>` - Update expense
- `DELETE /api/expenses/<id>` - Delete expense

### Dashboard
- `GET /api/dashboard/summary` - Get summary statistics
- `GET /api/dashboard/charts/category-distribution` - Category distribution data
- `GET /api/dashboard/charts/daily-trend` - Daily expense trend
- `GET /api/dashboard/charts/category-bar` - Category bar chart data
- `GET /api/dashboard/charts/payment-mode` - Payment mode split
- `GET /api/dashboard/charts/monthly-comparison` - Monthly comparison
- `GET /api/dashboard/charts/top-expenses` - Top 5 expenses
- `GET /api/dashboard/charts/cumulative` - Cumulative spending

### Budget
- `GET /api/budget` - Get budgets
- `POST /api/budget` - Set budget

## Default Categories

- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Healthcare
- Education
- Travel
- Personal Care
- Others

## Usage

1. **Add Expense**: Click the "+ Add Expense" button on the dashboard or history page
2. **View History**: Navigate to the History page to see all expenses with filters
3. **Set Budget**: Go to the Budget page to set monthly or category-wise budgets
4. **Analyze**: View the dashboard for comprehensive expense analysis with charts

## Notes

- The database is automatically created on first run
- All dates are stored in YYYY-MM-DD format
- Budget alerts appear when usage exceeds 80% or 100%
- The application is mobile-friendly and responsive

## Production Deployment

For production deployment:
1. Change the `secret_key` in `app.py`
2. Set `debug=False` in `app.py`
3. Use a production WSGI server like Gunicorn
4. Configure proper database backups

