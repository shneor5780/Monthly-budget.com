// הגדרת קטגוריות קבועות
const CATEGORIES = {
    fixed: [
        'שכירות/משכנתא',
        'ארנונה',
        'חשמל',
        'מים',
        'גז',
        'ועד בית',
        'אינטרנט',
        'ביטוחים'
    ],
    variable: [
        'מזון וסופר',
        'תחבורה/דלק',
        'קניות',
        'בילויים',
        'בריאות',
        'ביגוד',
        'מתנות',
        'אחר'
    ]
};

// אתחול המערכת
document.addEventListener('DOMContentLoaded', () => {
    // טעינת נתונים מהזיכרון המקומי
    let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    let monthlyBudget = Number(localStorage.getItem('monthlyBudget') || '0');
    updateDisplay();
    updateCategories();

    // הגדרת מאזינים לאירועים
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('expenseType').addEventListener('change', updateCategories);
});

// עדכון קטגוריות בהתאם לסוג ההוצאה
function updateCategories() {
    const type = document.getElementById('expenseType').value;
    const categorySelect = document.getElementById('category');
    const categories = type === 'fixed' ? CATEGORIES.fixed : CATEGORIES.variable;
    
    categorySelect.innerHTML = categories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

// הוספת הוצאה חדשה
function addExpense(e) {
    e.preventDefault();
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    const expense = {
        id: Date.now(),
        type: document.getElementById('expenseType').value,
        category: document.getElementById('category').value,
        amount: Number(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    document.getElementById('expenseForm').reset();
    updateDisplay();
}

// מחיקת הוצאה
function deleteExpense(id) {
    let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    updateDisplay();
}

// עדכון התצוגה
function updateDisplay() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    // עדכון רשימת ההוצאות
    document.getElementById('expenseList').innerHTML = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(expense => `
            <tr>
                <td class="p-2">${new Date(expense.date).toLocaleDateString('he-IL')}</td>
                <td class="p-2">${expense.type === 'fixed' ? 'קבועה' : 'משתנה'}</td>
                <td class="p-2">${expense.category}</td>
                <td class="p-2 font-bold">${expense.amount} ₪</td>
                <td class="p-2">${expense.description}</td>
                <td class="p-2">
                    <button onclick="deleteExpense(${expense.id})" class="text-red-600 hover:text-red-800">
                        מחק
                    </button>
                </td>
            </tr>
        `).join('');

    // עדכון סטטיסטיקות חודשיות
    const stats = document.getElementById('monthlyStats');
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyBudget = Number(localStorage.getItem('monthlyBudget') || '0');
    
    stats.innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span>תקציב חודשי:</span>
                <span class="font-bold">${monthlyBudget} ₪</span>
            </div>
            <div class="flex justify-between">
                <span>סה"כ הוצאות:</span>
                <span class="font-bold">${totalExpenses} ₪</span>
            </div>
            <div class="flex justify-between">
                <span>נשאר בתקציב:</span>
                <span class="font-bold ${monthlyBudget - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${monthlyBudget - totalExpenses} ₪
                </span>
            </div>
        </div>
    `;

    // עדכון גרף
    updateChart(expenses);
}

// עדכון הגרף
function updateChart(expenses) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const categories = [...CATEGORIES.fixed, ...CATEGORIES.variable];
    const data = categories.map(category => ({
        category,
        amount: expenses
            .filter(exp => exp.category === category)
            .reduce((sum, exp) => sum + exp.amount, 0)
    })).filter(item => item.amount > 0);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.category),
            datasets: [{
                data: data.map(item => item.amount),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// ייצוא לאקסל
function exportToExcel() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "expenses.xlsx");
}

// ייצוא ל-PDF
function exportToPDF() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length === 0) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("דוח הוצאות", 105, 20, null, null, "center");
    
    const headers = [["תאריך", "סוג", "קטגוריה", "סכום", "תיאור"]];
    const data = expenses.map(exp => [
        new Date(exp.date).toLocaleDateString('he-IL'),
        exp.type === 'fixed' ? 'קבועה' : 'משתנה',
        exp.category,
        `${exp.amount} ₪`,
        exp.description
    ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 30,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10, halign: 'right' },
        headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save("expenses.pdf");
}
