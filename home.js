// ============================================
// Home Page - State
// ============================================
let currentFilter = 'all';
let currentSearchQuery = '';
let viewDate = new Date();

// Mood emoji mapping
const MOOD_EMOJIS = {
    happy: '😊',
    neutral: '😐',
    sad: '😢',
    angry: '😡',
    sleepy: '😴',
    love: '😍'
};

// ============================================
// Initialize Home Page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderCalendar();
    renderDiaryList();
});

// ============================================
// Statistics Update
// ============================================
function updateStats() {
    const stats = calculateStats();

    document.getElementById('monthlyCount').textContent = stats.monthlyCount;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('longestStreak').textContent = stats.longestStreak;
    document.getElementById('totalCount').textContent = stats.totalCount;

    // Update weekly word count
    const weeklyWords = calculateWeeklyWordCount();
    document.getElementById('weeklyWords').textContent = weeklyWords.toLocaleString();

    // Update peak writing time
    const peakTime = analyzeWritingPeakHours();
    document.getElementById('peakTime').textContent = peakTime.period;
    document.getElementById('peakTimeUnit').textContent = peakTime.hour !== null ? `${peakTime.hour}:00` : '暂无数据';
}

// ============================================
// Calendar Functions
// ============================================

/**
 * Render calendar
 */
function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Update title
    document.getElementById('calendarTitle').textContent =
        `${year}年${month + 1}月`;

    // Get diary counts for this month
    const diaryCounts = getDiaryCountsByMonth(year, month);

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Clear calendar
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.innerHTML = `<span class="calendar-day-number">${day}</span>`;

        // Check if today
        if (year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()) {
            dayElement.classList.add('today');
        }

        // Check if has diary
        if (diaryCounts[day]) {
            dayElement.classList.add('has-diary');

            // Add mood emoji if available
            if (diaryCounts[day].mood && MOOD_EMOJIS[diaryCounts[day].mood]) {
                const moodIndicator = document.createElement('span');
                moodIndicator.className = 'calendar-day-mood';
                moodIndicator.textContent = MOOD_EMOJIS[diaryCounts[day].mood];
                dayElement.appendChild(moodIndicator);
            }
        }

        // Add click event
        dayElement.addEventListener('click', () => {
            const clickedDate = new Date(year, month, day);
            showDiariesForDate(clickedDate);
        });

        calendarDays.appendChild(dayElement);
    }
}

/**
 * Change month
 */
function changeMonth(delta) {
    viewDate.setMonth(viewDate.getMonth() + delta);
    renderCalendar();
}

/**
 * Show diaries for selected date
 */
function showDiariesForDate(date) {
    const diaries = getDiariesByDate(date);

    if (diaries.length === 0) {
        showToast(`${formatDateDisplay(date)} 没有日记`, 'warning');
        return;
    }

    // For now, just filter the list
    // In a full implementation, you might want to highlight/filter
    if (diaries.length === 1) {
        window.location.href = `detail.html?id=${diaries[0].id}`;
    } else {
        showToast(`${formatDateDisplay(date)} 有 ${diaries.length} 篇日记`);
    }
}

// ============================================
// Diary List Functions
// ============================================

/**
 * Render diary list
 */
function renderDiaryList() {
    let diaries = getDiaries();

    // Apply search filter
    if (currentSearchQuery) {
        diaries = searchDiaries(currentSearchQuery);
    }

    // Apply visibility filter
    const filteredDiaries = filterDiariesByVisibility(diaries, currentFilter);
    const diaryList = document.getElementById('diaryList');
    const emptyState = document.getElementById('emptyState');

    // Clear existing items (except empty state)
    const existingItems = diaryList.querySelectorAll('.diary-card');
    existingItems.forEach(item => item.remove());

    if (filteredDiaries.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Create diary cards
    filteredDiaries.forEach(diary => {
        const card = createDiaryCard(diary);
        diaryList.appendChild(card);
    });
}

/**
 * Create diary card element
 */
function createDiaryCard(diary) {
    const card = document.createElement('div');
    card.className = 'diary-card';
    card.onclick = () => {
        window.location.href = `detail.html?id=${diary.id}`;
    };

    const date = new Date(diary.createdAt);
    const wordCount = countWords(diary.content);

    // Build mood indicator
    let moodIndicator = '';
    if (diary.mood && MOOD_EMOJIS[diary.mood]) {
        moodIndicator = `<span class="card-mood">${MOOD_EMOJIS[diary.mood]}</span>`;
    }

    // Build tags
    let tagsHtml = '';
    if (diary.tags && diary.tags.length > 0) {
        const tagLabels = {
            '工作': '💼',
            '学习': '📚',
            '情绪': '💭',
            '旅行': '✈️'
        };

        tagsHtml = `<div class="card-tags">
            ${diary.tags.map(tag => `<span class="card-tag">${tagLabels[tag] || '#'} ${tag}</span>`).join('')}
        </div>`;
    }

    card.innerHTML = `
        <div class="diary-card-header">
            <h3 class="diary-card-title">${escapeHtml(diary.title)}</h3>
            <div class="diary-card-meta-inline">
                ${moodIndicator}
                <div class="diary-card-visibility">
                    <span>${diary.isPublic ? '🌐 公开' : '🔒 私密'}</span>
                </div>
            </div>
        </div>
        <div class="diary-card-content">
            ${escapeHtml(diary.content || '暂无内容')}
        </div>
        ${tagsHtml}
        <div class="diary-card-footer">
            <span class="diary-card-date">${formatDateDisplay(date)}</span>
            <div class="diary-card-meta">
                <span>${formatTime(date)}</span>
                <span>${wordCount} 字</span>
            </div>
        </div>
    `;

    return card;
}

/**
 * Filter diaries
 */
function filterDiaries() {
    const filterSelect = document.getElementById('filterSelect');
    currentFilter = filterSelect.value;
    renderDiaryList();
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentSearchQuery = searchInput.value;
    renderDiaryList();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
