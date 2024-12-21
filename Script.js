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
        'ביטוחים',
        'חינוך'
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
    updateCategories();
    setDefaultDate();
    loadBudgets();
    updateDisplay();

    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('expenseType').addEventListener('change', updateCategories);
    document.getElementById('fixedBudget').addEventListener('change', saveBudgets);
    document.getElementById('variableBudget').addEventListener('change', saveBudgets);
});

// הגדרת תאריך ברירת מחדל
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// עדכון קטגוריות בהתאם לסוג ההוצאה
function updateCategories() {
    const type = document.getElementById('expenseType').value;
    const categorySelect = document.getElementById('category');
    const categories = CATEGORIES[type] || [];
    
    categorySelect.innerHTML = categories
        .map(cat => `<option value="${cat}">${cat}</option>`)
        .join('');
}

// שמירת תקציבים
function saveBudgets() {
    const fixedBudget = Number(document.getElementById('fixedBudget').value) || 0;
    const variableBudget = Number(document.getElementById('variableBudget').value) || 0;
    
    localStorage.setItem('fixedBudget', fixedBudget);
    localStorage.setItem('variableBudget', variableBudget);
    updateDisplay();
}

// טעינת תקציבים
function loadBudgets() {
    const fixedBudget = localStorage.getItem('fixedBudget') || 0;
    const variableBudget = localStorage.getItem('variableBudget') || 0;
    
    document.getElementById('fixedBudget').value = fixedBudget;
    document.getElementById('variableBudget').value = variableBudget;
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
    
    e.target.reset();
    setDefaultDate();
    updateCategories();
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
    updateExpenseList(expenses);
    updateStats(expenses);
    updateChart(expenses);
}

// עדכון רשימת ההוצאות
function updateExpenseList(expenses) {
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(expense => `
            <tr>
                <td class="p-2">${new Date(expense.date).toLocaleDateString('he-IL')}</td>
                <td class="p-2">${expense.type}</td>
                <td class="p-2">${expense.category}</td>
                <td class="p-2 font-bold">${expense.amount.toLocaleString()} ₪</td>
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
function updateStats(expenses) {
    const fixedBudget = Number(localStorage.getItem('fixedBudget')) || 0;
    const variableBudget = Number(localStorage.getItem('variableBudget')) || 0;
    
    const totalFixed = expenses
        .filter(exp => exp.type === 'הוצאות קבועות')
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalVariable = expenses
        .filter(exp => exp.type === 'הוצאות משתנות')
        .reduce((sum, exp) => sum + exp.amount, 0);

    const monthlyStats = document.getElementById('monthlyStats');
    monthlyStats.innerHTML = `
        <div class="space-y-4">
            <div>
                <h3 class="font-bold mb-2">הוצאות קבועות:</h3>
                <div class="flex justify-between">
                    <span>תקציב:</span>
                    <span>${fixedBudget.toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between">
                    <span>הוצאות בפועל:</span>
                    <span>${totalFixed.toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between font-bold">
                    <span>נותר:</span>
                    <span class="${fixedBudget - totalFixed >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${(fixedBudget - totalFixed).toLocaleString()} ₪
                    </span>
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-2">הוצאות משתנות:</h3>
                <div class="flex justify-between">
                    <span>תקציב:</span>
                    <span>${variableBudget.toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between">
                    <span>הוצאות בפועל:</span>
                    <span>${totalVariable.toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between font-bold">
                    <span>נותר:</span>
                    <span class="${variableBudget - totalVariable >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${(variableBudget - totalVariable).toLocaleString()} ₪
                    </span>
                </div>
            </div>
            
            <div class="pt-4 border-t">
                <div class="flex justify-between font-bold">
                    <span>סה"כ תקציב:</span>
                    <span>${(fixedBudget + variableBudget).toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between font-bold">
                    <span>סה"כ הוצאות:</span>
                    <span>${(totalFixed + totalVariable).toLocaleString()} ₪</span>
                </div>
                <div class="flex justify-between font-bold text-lg">
                    <span>נותר סה"כ:</span>
                    <span class="${(fixedBudget + variableBudget) - (totalFixed + totalVariable) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${((fixedBudget + variableBudget) - (totalFixed + totalVariable)).toLocaleString()} ₪
                    </span>
                </div>
            </div>
        </div>
    `;
}

// עדכון גרף
function updateChart(expenses) {
    const ctx = document.getElementById('expenseChart');
    
    if (window.myChart) {
        window.myChart.destroy();
    }

    if (expenses.length === 0) return;

    const categoryTotals = {};
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
    });

    const data = {
        labels: Object.keys(categoryTotals),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#C9CBCF', '#FF99CC',
                '#99FF99', '#99CCFF', '#FFB366', '#FF99FF'
            ]
        }]
    };

    window.myChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// ייצוא לאקסל
function exportToExcel() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    
    // ייצוא הקובץ
    const fileName = `הוצאות-${new Date().toLocaleDateString('he-IL')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// ייצוא ל-PDF
function exportToPDF() {
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("דוח הוצאות", 105, 15, null, null, "center");
    
    const headers = [["תאריך", "סוג", "קטגוריה", "סכום", "תיאור"]];
    const data = expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(exp => [
            new Date(exp.date).toLocaleDateString('he-IL'),
            exp.type,
            exp.category,
            `${exp.amount.toLocaleString()} ₪`,
            exp.description
        ]);

    doc.autoTable({
        head: headers,
        body: data,
        startY: 25,
        theme: 'grid',
        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
            halign: 'right'
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 9
        }
    });

    const fileName = `הוצאות-${new Date().toLocaleDateString('he-IL')}.pdf`;
    doc.save(fileName);
}
```