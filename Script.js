```javascript
// הגדרת קטגוריות קבועות
const CATEGORIES = {
    'הוצאות קבועות': [
        'שכירות/משכנתא',
        'ארנונה',
        'חשמל',
        'מים',
        'גז',
        'ועד בית',
        'אינטרנט',
        'ביטוחים'
    ],
    'הוצאות משתנות': [
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
    const categories = CATEGORIES[type] || CATEGORIES['הוצאות קבועות'];
    
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
    document.getElementById('expenseType').value = 'הוצאות קבועות';
    updateDisplay();
    updateCategories();
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
    const expenseList = document.getElementById('expenseList');
    if (expenseList) {
        expenseList.innerHTML = expenses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(expense => `
                <tr>
                    <td class="p-2">${new Date(expense.date).toLocaleDateString('he-IL')}</td>
                    <td class="p-2">${expense.type}</td>
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
    }

    // עדכון סטטיסטיקות
    const monthlyStats = document.getElementById('monthlyStats');
    if (monthlyStats) {
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const monthlyBudget = Number(localStorage.getItem('monthlyBudget') || '0');
        
        monthlyStats.innerHTML = `
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
    }

    // עדכון גרף
    updateChart();
}

// עדכון הגרף
function updateChart() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const chartElement = document.getElementById('expenseChart');
    
    if (chartElement && expenses.length > 0) {
        const categoryTotals = {};
        expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        const data = Object.entries(categoryTotals).map(([category, amount]) => ({
            name: category,
            value: amount
        }));

        // עדכון או יצירת גרף חדש
        if (window.myChart) {
            window.myChart.data.labels = data.map(d => d.name);
            window.myChart.data.datasets[0].data = data.map(d => d.value);
            window.myChart.update();
        } else {
            window.myChart = new Chart(chartElement, {
                type: 'pie',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.value),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#C9CBCF', '#4D5360'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            rtl: true
                        }
                    }
                }
            });
        }
    }
}

// ייצוא לאקסל
function exportToExcel() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `הוצאות-${new Date().toLocaleDateString('he-IL')}.xlsx`);
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
        exp.type,
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

    doc.save(`הוצאות-${new Date().toLocaleDateString('he-IL')}.pdf`);
}




