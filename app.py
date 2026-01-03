from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
from database import init_db, get_db_connection

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['DATABASE'] = 'expenses.db'

init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('signin'))
        return f(*args, **kwargs)
    return decorated_function

def get_current_user_id():
    """Get current logged in user ID"""
    return session.get('user_id')

def get_month_range(month_date):
    """Get start and end dates for a given month"""
    month_start = month_date.replace(day=1).strftime('%Y-%m-%d')
    if month_date.month == 12:
        month_end = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
    return month_start, month_end.strftime('%Y-%m-%d')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User sign up"""
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        if not email or not password or not name:
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        conn = get_db_connection()
        existing_user = conn.execute(
            'SELECT id FROM users WHERE email = ?', (email,)
        ).fetchone()
        
        if existing_user:
            conn.close()
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        password_hash = generate_password_hash(password)
        try:
            cursor = conn.execute(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                (email, password_hash, name)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            
            session['user_id'] = user_id
            session['user_name'] = name
            session['user_email'] = email
            
            return jsonify({'success': True, 'message': 'Account created successfully'}), 201
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    return render_template('signup.html')

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """User sign in"""
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT id, email, password, name FROM users WHERE email = ?', (email,)
        ).fetchone()
        conn.close()
        
        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['user_name'] = user[3]
            session['user_email'] = user[1]
            return jsonify({'success': True, 'message': 'Signed in successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
    
    return render_template('signin.html')

@app.route('/signout')
def signout():
    """User sign out"""
    session.clear()
    return redirect(url_for('signin'))

@app.route('/')
def index():
    """Redirect to dashboard or signin"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('signin'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/expenses', methods=['GET', 'POST'])
@login_required
def expenses():
    """Handle expense operations"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            amount = float(data['amount'])
            category = data['category']
            date = data['date']
            payment_mode = data['payment_mode']
            notes = data.get('notes', '')
            
            conn.execute(
                'INSERT INTO expenses (user_id, amount, category, date, payment_mode, notes) VALUES (?, ?, ?, ?, ?, ?)',
                (user_id, amount, category, date, payment_mode, notes)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Expense added successfully'}), 201
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    category = request.args.get('category')
    
    query = 'SELECT * FROM expenses WHERE user_id = ?'
    params = [user_id]
    
    if date_from:
        query += ' AND date >= ?'
        params.append(date_from)
    if date_to:
        query += ' AND date <= ?'
        params.append(date_to)
    if category:
        query += ' AND category = ?'
        params.append(category)
    
    query += ' ORDER BY date DESC, id DESC'
    expenses = conn.execute(query, params).fetchall()
    conn.close()
    
    result = [{
        'id': exp[0],
        'amount': exp[2],
        'category': exp[3],
        'date': exp[4],
        'payment_mode': exp[5],
        'notes': exp[6]
    } for exp in expenses]
    
    return jsonify(result)

@app.route('/api/expenses/<int:expense_id>', methods=['PUT', 'DELETE'])
@login_required
def expense_detail(expense_id):
    """Update or delete a specific expense"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'PUT':
        data = request.get_json()
        try:
            conn.execute(
                '''UPDATE expenses SET amount = ?, category = ?, date = ?, 
                   payment_mode = ?, notes = ? WHERE id = ? AND user_id = ?''',
                (data['amount'], data['category'], data['date'], 
                 data['payment_mode'], data.get('notes', ''), expense_id, user_id)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Expense updated successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    elif request.method == 'DELETE':
        try:
            conn.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user_id))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Expense deleted successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/dashboard/summary')
@login_required
def dashboard_summary():
    """Get summary statistics for dashboard"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    today = datetime.now().strftime('%Y-%m-%d')
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    month_total = conn.execute(
        'SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?',
        (user_id, current_month_start, current_month_end)
    ).fetchone()[0]
    
    today_total = conn.execute(
        'SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND date = ?',
        (user_id, today)
    ).fetchone()[0]
    
    days_in_month = datetime.now().day
    avg_daily = month_total / days_in_month if days_in_month > 0 else 0
    
    budget_row = conn.execute(
        'SELECT amount FROM budget WHERE user_id = ? AND type = ? AND month = ?',
        (user_id, 'monthly', datetime.now().strftime('%Y-%m'))
    ).fetchone()
    monthly_budget = budget_row[0] if budget_row else 0
    remaining_budget = monthly_budget - month_total
    
    conn.close()
    
    return jsonify({
        'month_total': round(month_total, 2),
        'today_total': round(today_total, 2),
        'avg_daily': round(avg_daily, 2),
        'monthly_budget': round(monthly_budget, 2),
        'remaining_budget': round(remaining_budget, 2),
        'budget_usage_percent': round((month_total / monthly_budget * 100) if monthly_budget > 0 else 0, 2)
    })

@app.route('/api/dashboard/charts/category-distribution')
@login_required
def category_distribution():
    """Get category-wise expense distribution for pie chart"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT category, SUM(amount) as total 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           GROUP BY category 
           ORDER BY total DESC''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    categories = [row[0] for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'categories': categories,
        'amounts': amounts
    })

@app.route('/api/dashboard/charts/daily-trend')
@login_required
def daily_trend():
    """Get daily expense trend for line chart"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT date, SUM(amount) as total 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           GROUP BY date 
           ORDER BY date''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    dates = [row[0] for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'dates': dates,
        'amounts': amounts
    })

@app.route('/api/dashboard/charts/category-bar')
@login_required
def category_bar():
    """Get category vs total amount for bar chart"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT category, SUM(amount) as total 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           GROUP BY category 
           ORDER BY total DESC''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    categories = [row[0] for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'categories': categories,
        'amounts': amounts
    })

@app.route('/api/dashboard/charts/payment-mode')
@login_required
def payment_mode():
    """Get payment mode split for donut chart"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT payment_mode, SUM(amount) as total 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           GROUP BY payment_mode 
           ORDER BY total DESC''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    modes = [row[0] for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'modes': modes,
        'amounts': amounts
    })

@app.route('/api/dashboard/charts/monthly-comparison')
@login_required
def monthly_comparison():
    """Get monthly expense comparison"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    months = []
    amounts = []
    
    for i in range(5, -1, -1):
        month_date = datetime.now() - timedelta(days=30*i)
        month_start, month_end = get_month_range(month_date)
        
        result = conn.execute(
            'SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?',
            (user_id, month_start, month_end)
        ).fetchone()[0]
        
        months.append(month_date.strftime('%b %Y'))
        amounts.append(round(result, 2))
    
    conn.close()
    return jsonify({'months': months, 'amounts': amounts})

@app.route('/api/dashboard/charts/top-expenses')
@login_required
def top_expenses():
    """Get top 5 highest expenses"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT category, amount, date 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           ORDER BY amount DESC 
           LIMIT 5''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    labels = [f"{row[0]} ({row[2]})" for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'labels': labels,
        'amounts': amounts
    })

@app.route('/api/dashboard/charts/cumulative')
@login_required
def cumulative_spending():
    """Get cumulative spending over the month"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    results = conn.execute(
        '''SELECT date, SUM(amount) as daily_total 
           FROM expenses 
           WHERE user_id = ? AND date >= ? AND date <= ?
           GROUP BY date 
           ORDER BY date''',
        (user_id, current_month_start, current_month_end)
    ).fetchall()
    
    conn.close()
    
    dates = [row[0] for row in results]
    daily_amounts = [row[1] for row in results]
    
    cumulative = []
    running_total = 0
    for amount in daily_amounts:
        running_total += amount
        cumulative.append(round(running_total, 2))
    
    return jsonify({'dates': dates, 'cumulative': cumulative})

@app.route('/api/budget', methods=['GET', 'POST', 'PUT'])
@login_required
def budget():
    """Handle budget operations"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            amount = float(data['amount'])
            budget_type = data.get('type', 'monthly')
            month = data.get('month', datetime.now().strftime('%Y-%m'))
            category = data.get('category', None)
            
            if category:
                existing = conn.execute(
                    'SELECT id FROM budget WHERE user_id = ? AND type = ? AND month = ? AND category = ?',
                    (user_id, budget_type, month, category)
                ).fetchone()
                if existing:
                    conn.execute(
                        'UPDATE budget SET amount = ? WHERE user_id = ? AND type = ? AND month = ? AND category = ?',
                        (amount, user_id, budget_type, month, category)
                    )
                else:
                    conn.execute(
                        'INSERT INTO budget (user_id, amount, type, month, category) VALUES (?, ?, ?, ?, ?)',
                        (user_id, amount, budget_type, month, category)
                    )
            else:
                existing = conn.execute(
                    'SELECT id FROM budget WHERE user_id = ? AND type = ? AND month = ? AND category IS NULL',
                    (user_id, budget_type, month)
                ).fetchone()
                if existing:
                    conn.execute(
                        'UPDATE budget SET amount = ? WHERE user_id = ? AND type = ? AND month = ? AND category IS NULL',
                        (amount, user_id, budget_type, month)
                    )
                else:
                    conn.execute(
                        'INSERT INTO budget (user_id, amount, type, month, category) VALUES (?, ?, ?, ?, ?)',
                        (user_id, amount, budget_type, month, None)
                    )
            
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Budget set successfully'}), 201
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    budgets = conn.execute(
        'SELECT * FROM budget WHERE user_id = ? AND month = ?',
        (user_id, month)
    ).fetchall()
    conn.close()
    
    result = [{
        'id': row[0],
        'amount': row[2],
        'type': row[3],
        'month': row[4],
        'category': row[5]
    } for row in budgets]
    
    return jsonify(result)

@app.route('/expense-history')
@login_required
def expense_history():
    """Expense history page"""
    return render_template('expense_history.html')

@app.route('/budget')
@login_required
def budget_page():
    """Budget management page"""
    return render_template('budget.html')

@app.route('/savings')
@login_required
def savings_page():
    """Savings dashboard page"""
    return render_template('savings.html')

@app.route('/api/savings', methods=['GET', 'POST'])
@login_required
def savings():
    """Handle savings operations"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            amount = float(data['amount'])
            source = data['source']
            date = data['date']
            notes = data.get('notes', '')
            
            conn.execute(
                'INSERT INTO savings (user_id, amount, source, date, notes) VALUES (?, ?, ?, ?, ?)',
                (user_id, amount, source, date, notes)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Savings added successfully'}), 201
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    source = request.args.get('source')
    
    query = 'SELECT * FROM savings WHERE user_id = ?'
    params = [user_id]
    
    if date_from:
        query += ' AND date >= ?'
        params.append(date_from)
    if date_to:
        query += ' AND date <= ?'
        params.append(date_to)
    if source:
        query += ' AND source = ?'
        params.append(source)
    
    query += ' ORDER BY date DESC, id DESC'
    savings_list = conn.execute(query, params).fetchall()
    conn.close()
    
    result = [{
        'id': saving[0],
        'amount': saving[2],
        'source': saving[3],
        'date': saving[4],
        'notes': saving[5]
    } for saving in savings_list]
    
    return jsonify(result)

@app.route('/api/savings/<int:saving_id>', methods=['PUT', 'DELETE'])
@login_required
def saving_detail(saving_id):
    """Update or delete a specific saving"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'PUT':
        data = request.get_json()
        try:
            conn.execute(
                '''UPDATE savings SET amount = ?, source = ?, date = ?, notes = ? WHERE id = ? AND user_id = ?''',
                (data['amount'], data['source'], data['date'], data.get('notes', ''), saving_id, user_id)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Savings updated successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    elif request.method == 'DELETE':
        try:
            conn.execute('DELETE FROM savings WHERE id = ? AND user_id = ?', (saving_id, user_id))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Savings deleted successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400

@app.route('/api/savings/summary')
@login_required
def savings_summary():
    """Get summary statistics for savings dashboard"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    current_month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
    current_month_end = datetime.now().strftime('%Y-%m-%d')
    
    total_savings = conn.execute(
        'SELECT COALESCE(SUM(amount), 0) FROM savings WHERE user_id = ?',
        (user_id,)
    ).fetchone()[0]
    
    month_savings = conn.execute(
        'SELECT COALESCE(SUM(amount), 0) FROM savings WHERE user_id = ? AND date >= ? AND date <= ?',
        (user_id, current_month_start, current_month_end)
    ).fetchone()[0]
    
    goal_row = conn.execute(
        'SELECT goal_name, target_amount FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        (user_id,)
    ).fetchone()
    
    active_goal_name = goal_row[0] if goal_row else None
    target_amount = goal_row[1] if goal_row else 0
    remaining_to_goal = max(0, target_amount - total_savings) if target_amount > 0 else 0
    
    conn.close()
    
    return jsonify({
        'total_savings': round(total_savings, 2),
        'month_savings': round(month_savings, 2),
        'active_goal_name': active_goal_name,
        'target_amount': round(target_amount, 2),
        'remaining_to_goal': round(remaining_to_goal, 2)
    })

@app.route('/api/savings/charts/growth')
@login_required
def savings_growth():
    """Get savings growth over time (cumulative)"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    results = conn.execute(
        '''SELECT date, SUM(amount) as daily_total 
           FROM savings 
           WHERE user_id = ?
           GROUP BY date 
           ORDER BY date''',
        (user_id,)
    ).fetchall()
    
    conn.close()
    
    dates = [row[0] for row in results]
    daily_amounts = [row[1] for row in results]
    
    cumulative = []
    running_total = 0
    for amount in daily_amounts:
        running_total += amount
        cumulative.append(round(running_total, 2))
    
    return jsonify({'dates': dates, 'cumulative': cumulative})

@app.route('/api/savings/charts/source-distribution')
@login_required
def savings_source_distribution():
    """Get source-wise savings distribution for pie chart"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    results = conn.execute(
        '''SELECT source, SUM(amount) as total 
           FROM savings 
           WHERE user_id = ?
           GROUP BY source 
           ORDER BY total DESC''',
        (user_id,)
    ).fetchall()
    
    conn.close()
    
    sources = [row[0] for row in results]
    amounts = [round(row[1], 2) for row in results]
    
    return jsonify({
        'sources': sources,
        'amounts': amounts
    })

@app.route('/api/savings/charts/monthly-comparison')
@login_required
def savings_monthly_comparison():
    """Get monthly savings comparison"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    months = []
    amounts = []
    
    for i in range(5, -1, -1):
        month_date = datetime.now() - timedelta(days=30*i)
        month_start, month_end = get_month_range(month_date)
        
        result = conn.execute(
            'SELECT COALESCE(SUM(amount), 0) FROM savings WHERE user_id = ? AND date >= ? AND date <= ?',
            (user_id, month_start, month_end)
        ).fetchone()[0]
        
        months.append(month_date.strftime('%b %Y'))
        amounts.append(round(result, 2))
    
    conn.close()
    return jsonify({'months': months, 'amounts': amounts})

@app.route('/api/savings/goals', methods=['GET', 'POST'])
@login_required
def savings_goals():
    """Handle savings goals operations"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    if request.method == 'POST':
        data = request.get_json()
        try:
            goal_name = data['goal_name']
            target_amount = float(data['target_amount'])
            target_date = data.get('target_date', None)
            
            conn.execute(
                'INSERT INTO savings_goals (user_id, goal_name, target_amount, target_date) VALUES (?, ?, ?, ?)',
                (user_id, goal_name, target_amount, target_date)
            )
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Savings goal created successfully'}), 201
        except Exception as e:
            conn.close()
            return jsonify({'success': False, 'message': str(e)}), 400
    
    goals = conn.execute(
        'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    
    total_savings = conn.execute(
        'SELECT COALESCE(SUM(amount), 0) FROM savings WHERE user_id = ?',
        (user_id,)
    ).fetchone()[0]
    conn.close()
    
    result = [{
        'id': goal[0],
        'goal_name': goal[2],
        'target_amount': goal[3],
        'target_date': goal[4],
        'current_amount': round(total_savings, 2),
        'progress_percent': round(min(100, (total_savings / goal[3] * 100) if goal[3] > 0 else 0), 2)
    } for goal in goals]
    
    return jsonify(result)

@app.route('/api/savings/goals/<int:goal_id>', methods=['DELETE'])
@login_required
def savings_goal_detail(goal_id):
    """Delete a specific savings goal"""
    user_id = get_current_user_id()
    conn = get_db_connection()
    
    try:
        conn.execute('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', (goal_id, user_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Savings goal deleted successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # For production (Render, Railway, etc.), always bind to 0.0.0.0
    # If PORT is set by the platform, it's production
    if os.environ.get('PORT'):
        host = '0.0.0.0'
        debug_mode = False  # Disable debug in production
    else:
        # Local development
        host = os.environ.get('HOST', '127.0.0.1')
    
    try:
        app.run(host=host, port=port, debug=debug_mode)
    except OSError as e:
        if 'Address already in use' in str(e):
            print(f"\nError: Port {port} is already in use.")
            print(f"Please either:")
            print(f"  1. Stop the other application using port {port}")
            print(f"  2. Use a different port: set PORT=5001 python app.py")
        else:
            print(f"\nError starting server: {e}")
        raise

