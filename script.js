// ============================================
// LEITURA FLOW - APP DE INCENTIVO À LEITURA
// ============================================

// DADOS LOCAIS
let appData = {
    books: [],
    readings: [],
    dailyGoal: 20,
    achievements: [],
};

// CONQUISTAS DISPONÍVEIS
const allAchievements = [
    {
        id: 'first-pages',
        name: 'Primeiras Páginas',
        description: 'Registre sua primeira leitura',
        icon: '📖',
        requirement: () => appData.readings.length >= 1,
    },
    {
        id: 'read-100',
        name: '100 Páginas',
        description: 'Leia 100 páginas no total',
        icon: '💯',
        requirement: () => getTotalPages() >= 100,
    },
    {
        id: 'read-500',
        name: '500 Páginas',
        description: 'Leia 500 páginas no total',
        icon: '🔥',
        requirement: () => getTotalPages() >= 500,
    },
    {
        id: 'read-1000',
        name: '1000 Páginas',
        description: 'Leia 1000 páginas no total',
        icon: '⭐',
        requirement: () => getTotalPages() >= 1000,
    },
    {
        id: 'first-book',
        name: 'Livro Completo',
        description: 'Complete seu primeiro livro',
        icon: '✅',
        requirement: () => appData.books.filter(b => b.currentPages >= b.totalPages).length >= 1,
    },
    {
        id: 'streak-7',
        name: 'Sequência de 7 Dias',
        description: 'Leia por 7 dias seguidos',
        icon: '🔥',
        requirement: () => getStreak() >= 7,
    },
    {
        id: 'streak-30',
        name: 'Leitor Dedicado',
        description: 'Leia por 30 dias seguidos',
        icon: '👑',
        requirement: () => getStreak() >= 30,
    },
    {
        id: 'three-books',
        name: 'Colecionador',
        description: 'Adicione 3 livros na sua lista',
        icon: '📚',
        requirement: () => appData.books.length >= 3,
    },
];

// ============================================
// FUNÇÕES DE DADOS
// ============================================

function saveData() {
    localStorage.setItem('leituraflow-data', JSON.stringify(appData));
}

function loadData() {
    const saved = localStorage.getItem('leituraflow-data');
    if (saved) {
        appData = JSON.parse(saved);
    }
    updateAchievements();
    renderAll();
}

function getTotalPages() {
    return appData.readings.reduce((sum, reading) => sum + reading.pages, 0);
}

function getTodayPages() {
    const today = new Date().toDateString();
    return appData.readings
        .filter(r => new Date(r.date).toDateString() === today)
        .reduce((sum, r) => sum + r.pages, 0);
}

function getStreak() {
    if (appData.readings.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
        const dateString = currentDate.toDateString();
        const hasReading = appData.readings.some(r => new Date(r.date).toDateString() === dateString);

        if (!hasReading) break;
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

function getCompletedBooks() {
    return appData.books.filter(b => b.currentPages >= b.totalPages).length;
}

function getLastSevenDays() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        const pages = appData.readings
            .filter(r => new Date(r.date).toDateString() === dateString)
            .reduce((sum, r) => sum + r.pages, 0);
        days.push(pages);
    }
    return days;
}

function getCompletionPercentage(book) {
    return Math.min(100, Math.round((book.currentPages / book.totalPages) * 100));
}

// ============================================
// CONQUISTAS
// ============================================

function updateAchievements() {
    appData.achievements = allAchievements
        .filter(a => a.requirement())
        .map(a => a.id);
    saveData();
}

// ============================================
// NAVEGAÇÃO DE ABAS
// ============================================

function switchTab(tabName) {
    // Esconder todas as abas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Mostrar aba selecionada
    document.getElementById(tabName).classList.add('active');

    // Atualizar botões de navegação
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Renderizar conteúdo específico
    if (tabName === 'books') renderBooks();
    if (tabName === 'achievements') renderAchievements();
    if (tabName === 'add-reading') renderBookSelect();
}

// ============================================
// RENDERIZAÇÃO DO DASHBOARD
// ============================================

function renderDashboard() {
    // Streak
    document.getElementById('streak-value').textContent = getStreak();

    // Páginas hoje
    document.getElementById('today-pages').textContent = getTodayPages();

    // Total páginas
    document.getElementById('total-pages').textContent = getTotalPages();

    // Livros completos
    document.getElementById('completed-books').textContent = getCompletedBooks();

    // Meta diária
    const todayPages = getTodayPages();
    const percentage = Math.min(100, (todayPages / appData.dailyGoal) * 100);
    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('goal-current').textContent = todayPages;
    document.getElementById('goal-target').textContent = appData.dailyGoal;

    // Histórico
    const today = new Date().toDateString();
    const todayReadings = appData.readings.filter(r => new Date(r.date).toDateString() === today);
    const historyList = document.getElementById('history-list');

    if (todayReadings.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Nenhuma leitura registrada hoje</p>';
    } else {
        historyList.innerHTML = todayReadings.map(reading => {
            const book = appData.books.find(b => b.id === reading.bookId);
            return `
                <div class="history-item">
                    <div class="history-item-info">
                        <h4>${book?.title || 'Livro desconhecido'}</h4>
                        <p>${reading.time || 0} min</p>
                    </div>
                    <div class="history-item-pages">+${reading.pages}</div>
                </div>
            `;
        }).join('');
    }

    // Gráfico semanal
    const weekData = getLastSevenDays();
    const maxPages = Math.max(...weekData, appData.dailyGoal);
    weekData.forEach((pages, index) => {
        const bar = document.getElementById(`bar-${index}`);
        const height = (pages / maxPages) * 150;
        bar.style.height = height + 'px';
    });
}

// ============================================
// ADICIONAR LEITURA
// ============================================

function openAddReading() {
    switchTab('add-reading');
}

function renderBookSelect() {
    const select = document.getElementById('book-select');
    select.innerHTML = '<option value="">Selecione um livro</option>' +
        appData.books
            .filter(b => b.currentPages < b.totalPages)
            .map(b => `<option value="${b.id}">${b.title}</option>`)
            .join('');
}

function addReading(e) {
    e.preventDefault();

    const bookId = document.getElementById('book-select').value;
    const pages = parseInt(document.getElementById('pages-input').value);
    const time = parseInt(document.getElementById('time-input').value) || 0;
    const notes = document.getElementById('notes-input').value;

    if (!bookId || !pages) return;

    // Adicionar leitura
    appData.readings.push({
        id: Date.now(),
        bookId,
        pages,
        time,
        notes,
        date: new Date().toISOString(),
    });

    // Atualizar livro
    const book = appData.books.find(b => b.id === bookId);
    if (book) {
        book.currentPages = Math.min(book.currentPages + pages, book.totalPages);
    }

    saveData();
    updateAchievements();

    // Limpar formulário
    document.querySelector('.form').reset();

    // Voltar ao dashboard
    switchTab('dashboard');
    renderDashboard();

    // Mostrar notificação
    showNotification('✅ Leitura registrada com sucesso!');
}

// ============================================
// LIVROS
// ============================================

function openAddBook() {
    document.getElementById('add-book-form').style.display = 'block';
}

function closeAddBook() {
    document.getElementById('add-book-form').style.display = 'none';
}

function renderBooks() {
    const booksList = document.getElementById('books-list');

    if (appData.books.length === 0) {
        booksList.innerHTML = '<p class="empty-state">Nenhum livro adicionado. Crie um novo!</p>';
        return;
    }

    booksList.innerHTML = appData.books.map(book => {
        const percentage = getCompletionPercentage(book);
        const isCompleted = book.currentPages >= book.totalPages;

        return `
            <div class="book-card">
                <div class="book-header">
                    <div>
                        <div class="book-title">${book.title}</div>
                        <div class="book-author">por ${book.author}</div>
                        <span class="book-genre">${book.genre}</span>
                    </div>
                    <div style="font-size: 24px;">${isCompleted ? '✅' : '📖'}</div>
                </div>
                <div class="book-progress">
                    <div class="book-progress-bar">
                        <div class="book-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="book-progress-text">${book.currentPages}/${book.totalPages} páginas (${percentage}%)</div>
                </div>
                <div class="book-actions">
                    <button onclick="editBook('${book.id}')">✏️ Editar</button>
                    <button onclick="deleteBook('${book.id}')" class="btn-delete">🗑️ Deletar</button>
                </div>
            </div>
        `;
    }).join('');
}

function addBook(e) {
    e.preventDefault();

    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const totalPages = parseInt(document.getElementById('book-pages').value);
    const currentPages = parseInt(document.getElementById('book-current').value) || 0;
    const genre = document.getElementById('book-genre').value;

    appData.books.push({
        id: Date.now().toString(),
        title,
        author,
        totalPages,
        currentPages,
        genre,
    });

    saveData();
    updateAchievements();

    // Limpar formulário
    document.getElementById('add-book-form').reset();
    closeAddBook();
    renderBooks();

    showNotification('📚 Livro adicionado com sucesso!');
}

function deleteBook(bookId) {
    if (confirm('Tem certeza que deseja deletar este livro?')) {
        appData.books = appData.books.filter(b => b.id !== bookId);
        appData.readings = appData.readings.filter(r => r.bookId !== bookId);
        saveData();
        renderBooks();
        showNotification('🗑️ Livro deletado');
    }
}

function editBook(bookId) {
    const book = appData.books.find(b => b.id === bookId);
    if (book) {
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-pages').value = book.totalPages;
        document.getElementById('book-current').value = book.currentPages;
        document.getElementById('book-genre').value = book.genre;
        openAddBook();

        // Remover livro anterior após salvar novo
        const oldId = bookId;
        const oldOnSubmit = document.getElementById('add-book-form').onsubmit;
        document.getElementById('add-book-form').onsubmit = (e) => {
            oldOnSubmit.call(this, e);
            deleteBook(oldId);
        };
    }
}

// ============================================
// CONQUISTAS
// ============================================

function renderAchievements() {
    const grid = document.getElementById('achievements-grid');

    grid.innerHTML = allAchievements.map(achievement => {
        const unlocked = appData.achievements.includes(achievement.id);

        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${unlocked ? '<div class="achievement-badge">DESBLOQUEADO</div>' : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// SETTINGS
// ============================================

function openSettings() {
    document.getElementById('settings-modal').style.display = 'flex';
    document.getElementById('daily-goal').value = appData.dailyGoal;
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveDailyGoal() {
    const newGoal = parseInt(document.getElementById('daily-goal').value);
    if (newGoal > 0) {
        appData.dailyGoal = newGoal;
        saveData();
        renderDashboard();
        closeSettings();
        showNotification('🎯 Meta atualizada!');
    }
}

function resetAllData() {
    if (confirm('⚠️ Tem certeza? Todos os dados serão apagados!')) {
        appData = {
            books: [],
            readings: [],
            dailyGoal: 20,
            achievements: [],
        };
        saveData();
        renderAll();
        closeSettings();
        showNotification('🗑️ Dados apagados');
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        animation: slideUp 0.3s ease;
        z-index: 2000;
        max-width: 400px;
        margin: 0 auto;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================
// RENDER GERAL
// ============================================

function renderAll() {
    renderDashboard();
    renderBooks();
    renderAchievements();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

window.addEventListener('load', () => {
    loadData();
    renderAll();

    // Verificar conquistas a cada minuto
    setInterval(updateAchievements, 60000);

    // Register Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('settings-modal');
    if (e.target === modal) {
        closeSettings();
    }
});