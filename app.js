const STORAGE_KEY = 'pocketpilot-figma-demo-v3';
const START_DATE = '2025-06-18';
const CATEGORY_DEFAULTS = {
  'Food & drinks': {limit: 200, color: 'food'},
  Transport: {limit: 80, color: 'transport'},
  Education: {limit: 200, color: 'education'},
  'Everything else': {limit: 320, color: 'other'}
};
const START_EXPENSES = [
  {id:'cafe', name:'Campus café', amount:6.5, category:'Food & drinks', date:'2025-06-18', note:'Coffee before the morning lecture'},
  {id:'bus', name:'Bus to campus', amount:2.5, category:'Transport', date:'2025-06-18', note:'Morning commute'},
  {id:'lunch', name:'Lunch bowl', amount:20, category:'Food & drinks', date:'2025-06-18', note:'Lunch between classes'},
  {id:'snack', name:'Fruit and snack', amount:15, category:'Food & drinks', date:'2025-06-18', note:''},
  {id:'tea', name:'Tea with friends', amount:30, category:'Food & drinks', date:'2025-06-18', note:''},
  {id:'dinner', name:'Dinner with friends', amount:25, category:'Food & drinks', date:'2025-06-18', note:'A meal after class'},
  {id:'coffee', name:'Coffee refill', amount:18, category:'Food & drinks', date:'2025-06-18', note:''},
  {id:'meal', name:'Campus canteen', amount:21, category:'Food & drinks', date:'2025-06-18', note:''},
  {id:'water', name:'Water and sandwich', amount:20.5, category:'Food & drinks', date:'2025-06-18', note:''},
  {id:'travel', name:'Bus pass', amount:15, category:'Transport', date:'2025-06-17', note:'Campus commute'},
  {id:'metro', name:'Metro card', amount:24.5, category:'Transport', date:'2025-06-17', note:'Commute to campus'},
  {id:'textbook', name:'Design textbook', amount:32, category:'Education', date:'2025-06-17', note:'Course reading'},
  {id:'supplies', name:'Class supplies', amount:38, category:'Education', date:'2025-06-17', note:''},
  {id:'printing', name:'Project printing', amount:40, category:'Education', date:'2025-06-17', note:''},
  {id:'groceries', name:'Grocery run', amount:24.8, category:'Everything else', date:'2025-06-17', note:''},
  {id:'spotify', name:'Spotify Student', amount:5.99, category:'Everything else', date:'2025-06-17', note:''},
  {id:'movie', name:'Movie night', amount:40, category:'Everything else', date:'2025-06-17', note:''},
  {id:'weekend', name:'Weekend plans', amount:49.21, category:'Everything else', date:'2025-06-17', note:''}
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.expenses) && saved.categories) return saved;
  } catch (error) { /* Use the sample budget when local storage is unavailable. */ }
  return {expenses: START_EXPENSES.map(item => ({...item})), categories: structuredClone(CATEGORY_DEFAULTS)};
}

let state = loadState();
let activeScreen = 'home';
let activeFilter = 'All';
let selectedExpenseId = null;
let selectedCategory = 'Food & drinks';

const screenNodes = [...document.querySelectorAll('[data-screen]')];
const bottomNav = document.querySelector('.bottom-nav');
const appFrame = document.querySelector('#appFrame');
const toast = bootstrap.Toast.getOrCreateInstance(document.querySelector('#appToast'), {delay:2400});

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* The page remains usable without persistence. */ }
}

function money(amount, decimals = true) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString('en-IN', {minimumFractionDigits:decimals ? 2 : 0, maximumFractionDigits:decimals ? 2 : 0})}`;
}

function totalSpent() {
  return state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
}

function categorySpent(name) {
  return state.expenses.filter(item => item.category === name).reduce((sum, item) => sum + Number(item.amount), 0);
}

function totalBudget() {
  return Object.values(state.categories).reduce((sum, item) => sum + Number(item.limit), 0);
}

function safeText(text) {
  return String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function categoryIcon(name) {
  if (name === 'Food & drinks') return '<svg viewBox="0 0 24 24"><path d="M4 9h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM17 11h1a3 3 0 0 1 0 6h-2M7 4c0 1 1 1 1 2M11 3c0 1 1 1 1 2M15 4c0 1 1 1 1 2"/></svg>';
  if (name === 'Transport') return '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 9h16M7 18v2M17 18v2M8 13h.01M16 13h.01M7 6h10"/></svg>';
  if (name === 'Education') return '<svg viewBox="0 0 24 24"><path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3zM6.5 8h3M6.5 11h3M16 8h1.5M16 11h1.5"/></svg>';
  return '<svg viewBox="0 0 24 24"><path d="M5 8h14l1 12H4zM9 8V6a3 3 0 0 1 6 0v2"/></svg>';
}

function categoryClass(name) {
  return CATEGORY_DEFAULTS[name]?.color || 'other';
}

function dateLabel(value) {
  if (value === START_DATE) return 'Today';
  if (value === '2025-06-17') return 'Yesterday';
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('en-IN', {day:'numeric',month:'short'});
}

function orderedExpenses(list = state.expenses) {
  return [...list].sort((a,b) => b.date.localeCompare(a.date));
}

function expenseRow(item, compact = false) {
  const kind = categoryClass(item.category);
  return `<button class="expense-row ${compact ? 'compact' : ''}" type="button" data-expense-id="${safeText(item.id)}">
    <span class="expense-icon ${kind}" aria-hidden="true">${categoryIcon(item.category)}</span>
    <span class="expense-copy"><b>${safeText(item.name)}</b><small>${safeText(item.category)} · ${dateLabel(item.date)}</small></span>
    <span class="expense-amount">−${money(item.amount)}</span>
  </button>`;
}

function renderHome() {
  const spent = totalSpent();
  const budget = totalBudget();
  const balance = budget - spent;
  const ratio = budget ? Math.min(100, spent / budget * 100) : 0;
  document.querySelector('#homeBalance').textContent = money(Math.max(0,balance));
  document.querySelector('#balancePill').textContent = `${money(Math.max(0,balance),false)} left`;
  document.querySelector('#spentSummary').textContent = `${money(spent,false)} of ${money(budget,false)} spent`;
  document.querySelector('#homeProgress').style.width = `${ratio}%`;
  document.querySelector('.budget-progress').setAttribute('aria-valuenow', String(Math.round(ratio)));
  document.querySelector('#budgetMessage').textContent = balance >= 0 ? 'You’re on track. Keep it up!' : 'A little over budget. Take it one spend at a time.';
  document.querySelector('#homeExpenses').innerHTML = orderedExpenses().slice(0,2).map(item => expenseRow(item,true)).join('');
}

function renderBudgets() {
  const spent = totalSpent();
  const budget = totalBudget();
  const available = budget - spent;
  const summary = document.querySelector('.budget-summary-card');
  summary.querySelector('.budget-big-total').textContent = money(budget);
  summary.querySelector('.budget-summary-foot').innerHTML = `<span>${money(spent,false)} spent</span><span>${money(Math.max(0,available),false)} available</span>`;
  const container = document.querySelector('#categoryBudgetList');
  container.innerHTML = Object.entries(state.categories).map(([name,entry]) => {
    const current = categorySpent(name);
    const remaining = Number(entry.limit) - current;
    const percentage = entry.limit ? Math.min(100,current / entry.limit * 100) : 0;
    const kind = categoryClass(name);
    return `<article class="category-budget-card" data-category-detail="${safeText(name)}" tabindex="0" role="button" aria-label="View ${safeText(name)} budget details">
      <span class="category-icon ${kind}" aria-hidden="true">${categoryIcon(name)}</span>
      <div class="category-budget-info"><div class="category-budget-head"><b>${safeText(name)}</b><span>${money(current,false)} / ${money(entry.limit,false)}</span></div>
      <div class="category-track ${kind}" role="progressbar" aria-label="${safeText(name)} budget used" aria-valuenow="${Math.round(percentage)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percentage}%"></span></div>
      <div class="category-left">${money(Math.max(0,remaining),false)} left</div></div>
      <button class="category-edit" type="button" data-edit-category="${safeText(name)}" aria-label="Edit ${safeText(name)} budget">···</button>
    </article>`;
  }).join('');
}

function renderActivity() {
  const query = document.querySelector('#expenseSearch').value.trim().toLowerCase();
  const list = orderedExpenses().filter(item => {
    const matchesText = `${item.name} ${item.category} ${item.note || ''}`.toLowerCase().includes(query);
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter;
    return matchesText && matchesFilter;
  });
  let previousDate = '';
  document.querySelector('#activityExpenses').innerHTML = list.map(item => {
    const heading = item.date !== previousDate && item.date !== START_DATE ? `<div class="activity-date-label">${dateLabel(item.date)}, June 17</div>` : '';
    previousDate = item.date;
    return heading + expenseRow(item);
  }).join('');
  document.querySelector('#activityTotal').textContent = money(totalSpent());
  document.querySelector('#expenseCount').textContent = `${list.length} ${list.length === 1 ? 'expense' : 'expenses'}`;
  document.querySelector('#emptyMessage').hidden = list.length > 0;
}

function renderWeekly() {
  const values = [8,12,10,18,13,28,7.5];
  const max = Math.max(...values);
  document.querySelector('#weekChart').innerHTML = values.map((value,index) => `<span class="chart-bar ${index === 5 ? 'peak' : ''}" style="--height:${Math.max(14,value/max*100)}%" title="${money(value)}"></span>`).join('');
  const recent = orderedExpenses().slice(0,3);
  document.querySelector('#weeklyExpenses').innerHTML = recent.map(item => expenseRow(item)).join('');
}

function renderAll() {
  renderHome();
  renderBudgets();
  renderActivity();
  renderWeekly();
}

function showScreen(name) {
  const valid = screenNodes.some(node => node.dataset.screen === name);
  if (!valid) name = 'home';
  activeScreen = name;
  screenNodes.forEach(node => {
    const visible = node.dataset.screen === name;
    node.hidden = !visible;
    node.classList.toggle('active',visible);
  });
  bottomNav.hidden = !['home','activity','budgets'].includes(name);
  document.querySelector('.floating-add').hidden = !['home','activity','budgets'].includes(name);
  appFrame.classList.toggle('is-form-screen',['add-expense','edit-budget','expense-detail','category-detail','insights'].includes(name));
  document.querySelectorAll('.bottom-nav-item').forEach(button => button.classList.toggle('active',button.dataset.go === name));
  document.querySelector('#appScroll').scrollTop = 0;
  renderAll();
}

function showToast(message) {
  document.querySelector('#toastMessage').textContent = message;
  toast.show();
}

function editCategory(name) {
  selectedCategory = state.categories[name] ? name : 'Food & drinks';
  const currentLimit = Number(state.categories[selectedCategory].limit);
  const spent = categorySpent(selectedCategory);
  document.querySelector('#editCategoryBadge').innerHTML = `<span class="category-icon ${categoryClass(selectedCategory)}">${categoryIcon(selectedCategory)}</span><span>${safeText(selectedCategory)}</span>`;
  document.querySelector('#budgetAmount').value = currentLimit;
  document.querySelector('#editSpent').textContent = money(spent,false);
  document.querySelector('#editRemaining').textContent = money(Math.max(0,currentLimit-spent),false);
  showScreen('edit-budget');
}

function openCategory(name) {
  if (!state.categories[name]) return;
  selectedCategory = name;
  const limit = Number(state.categories[name].limit);
  const spent = categorySpent(name);
  const remaining = limit - spent;
  const ratio = limit ? Math.min(100, spent / limit * 100) : 0;
  document.querySelector('#categoryDetailTitle').textContent = name;
  document.querySelector('#categoryDetailIcon').innerHTML = categoryIcon(name);
  document.querySelector('#categoryDetailIcon').className = `category-icon ${categoryClass(name)}`;
  document.querySelector('#categoryDetailTotal').textContent = money(limit);
  document.querySelector('#categoryDetailLimit').textContent = money(limit,false);
  document.querySelector('#categoryDetailSpent').textContent = `${money(spent,false)} spent`;
  document.querySelector('#categoryDetailRemaining').textContent = `${money(Math.max(0,remaining),false)} left`;
  document.querySelector('#categoryDetailProgress').style.width = `${ratio}%`;
  document.querySelector('#categoryExpenses').innerHTML = orderedExpenses().filter(item => item.category === name).map(item => expenseRow(item)).join('') || '<p class="empty-message">No expenses in this category yet.</p>';
  const tips = {
    'Food & drinks':['Small swaps, bigger plans.','Pack lunch twice a week. Save around ₹40/month.'],
    Transport:['Plan your campus route.','A shared ride or student pass can stretch your travel budget.'],
    Education:['Invest in your next big idea.','Check the library and second-hand book groups before buying.'],
    'Everything else':['Make room for what matters.','A quick weekly check-in keeps little spends in view.']
  };
  document.querySelector('#categoryTipTitle').textContent = tips[name][0];
  document.querySelector('#categoryTipText').textContent = tips[name][1];
  showScreen('category-detail');
}

function openExpense(id) {
  const item = state.expenses.find(expense => String(expense.id) === String(id));
  if (!item) return;
  selectedExpenseId = item.id;
  document.querySelector('#detailIcon').className = `detail-icon ${categoryClass(item.category)}`;
  document.querySelector('#detailIcon').innerHTML = categoryIcon(item.category);
  document.querySelector('#detailCategory').textContent = item.category.toUpperCase();
  document.querySelector('#detailName').textContent = item.name;
  document.querySelector('#detailAmount').textContent = `−${money(item.amount)}`;
  document.querySelector('#detailCategoryName').textContent = item.category;
  document.querySelector('#detailDate').textContent = dateLabel(item.date);
  document.querySelector('#detailNote').textContent = item.note || 'No note added';
  showScreen('expense-detail');
}

document.addEventListener('click', event => {
  const expenseButton = event.target.closest('[data-expense-id]');
  if (expenseButton) { openExpense(expenseButton.dataset.expenseId); return; }
  const categoryButton = event.target.closest('[data-edit-category]');
  if (categoryButton) { editCategory(categoryButton.dataset.editCategory); return; }
  const categoryCard = event.target.closest('[data-category-detail]');
  if (categoryCard) { openCategory(categoryCard.dataset.categoryDetail); return; }
  if (event.target.closest('#categoryDetailEdit')) { editCategory(selectedCategory); return; }
  const routeButton = event.target.closest('[data-go]');
  if (routeButton) {
    const destination = routeButton.dataset.go;
    if (destination === 'edit-budget') editCategory(routeButton.dataset.editCategory || selectedCategory);
    else showScreen(destination);
  }
});

document.querySelector('#categoryBudgetList').addEventListener('keydown',event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-category-detail]')) {
    event.preventDefault();
    openCategory(event.target.dataset.categoryDetail);
  }
});

document.querySelector('#expenseSearch').addEventListener('input',renderActivity);
document.querySelector('.category-choice-grid').addEventListener('change',event => {
  if (!event.target.matches('input[name="category"]')) return;
  document.querySelectorAll('.category-choice').forEach(choice => choice.classList.toggle('selected',choice.contains(event.target)));
});
document.querySelector('#filterPills').addEventListener('click',event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.toggle('active',pill === button));
  renderActivity();
});

document.querySelector('#expenseForm').addEventListener('submit',event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const amount = Number(data.get('amount'));
  const name = String(data.get('name')).trim();
  if (!name || !Number.isFinite(amount) || amount <= 0) return;
  state.expenses.unshift({id:`expense-${Date.now()}`,name,amount,category:String(data.get('category')),date:String(data.get('date')),note:String(data.get('note')||'').trim()});
  saveState();
  form.reset();
  document.querySelector('#expenseDate').value = START_DATE;
  showScreen('home');
  showToast('Expense added. Your totals are up to date.');
});

document.querySelector('#budgetForm').addEventListener('submit',event => {
  event.preventDefault();
  const amount = Number(document.querySelector('#budgetAmount').value);
  if (!Number.isFinite(amount) || amount < 1) return;
  state.categories[selectedCategory].limit = amount;
  saveState();
  showScreen('budgets');
  showToast(`${selectedCategory} budget updated.`);
});

document.querySelector('#deleteExpense').addEventListener('click',() => {
  state.expenses = state.expenses.filter(item => String(item.id) !== String(selectedExpenseId));
  saveState();
  showScreen('activity');
  showToast('Expense removed.');
});

document.querySelector('#notificationButton').addEventListener('click',() => showToast('You’re all caught up. Nice work, Alex!'));
document.querySelector('#expenseDate').value = START_DATE;
const initialScreen = location.hash.slice(1);
renderAll();
if (initialScreen && screenNodes.some(node => node.dataset.screen === initialScreen)) showScreen(initialScreen);
