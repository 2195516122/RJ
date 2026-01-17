// ============================================
// Configuration
// ============================================
const CONFIG = {
    STORAGE_KEYS: {
        DIARIES: 'rj_diaries',
        USER: 'rj_user',
        DRAFT: 'rj_draft'
    },
    AUTO_SAVE_DELAY: 1000, // milliseconds
    TOAST_DURATION: 3000
};

// ============================================
// State Management
// ============================================
const state = {
    user: null,
    diaries: [],
    currentViewDate: new Date()
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format date to display format
 */
function formatDateDisplay(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[d.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
}

/**
 * Format time to HH:mm
 */
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Count words in text
 */
function countWords(text) {
    return text.length;
}

/**
 * Get first character of nickname
 */
function getInitial(nickname) {
    return nickname ? nickname.charAt(0).toUpperCase() : '用';
}

// ============================================
// Storage Functions
// ============================================

/**
 * Get data from localStorage
 */
function getStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
    }
}

/**
 * Save data to localStorage
 */
function saveStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

/**
 * Remove data from localStorage
 */
function removeStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from storage:', error);
        return false;
    }
}

// ============================================
// User Functions
// ============================================

/**
 * Initialize user
 */
function initUser() {
    let user = getStorage(CONFIG.STORAGE_KEYS.USER);

    if (!user) {
        // Create new user
        user = {
            id: generateId(),
            nickname: '用户',
            registerDate: new Date().toISOString()
        };
        saveStorage(CONFIG.STORAGE_KEYS.USER, user);
    }

    state.user = user;
    return user;
}

/**
 * Get current user
 */
function getUser() {
    if (!state.user) {
        state.user = initUser();
    }
    return state.user;
}

/**
 * Update user nickname
 */
function updateUserNickname(nickname) {
    const user = getUser();
    user.nickname = nickname;
    saveStorage(CONFIG.STORAGE_KEYS.USER, user);
    state.user = user;
    return user;
}

// ============================================
// Diary CRUD Functions
// ============================================

/**
 * Load all diaries from storage
 */
function loadDiaries() {
    const diaries = getStorage(CONFIG.STORAGE_KEYS.DIARIES);
    state.diaries = diaries || [];
    return state.diaries;
}

/**
 * Get all diaries
 */
function getDiaries() {
    if (!state.diaries.length) {
        loadDiaries();
    }
    return state.diaries;
}

/**
 * Get diary by ID
 */
function getDiaryById(id) {
    const diaries = getDiaries();
    return diaries.find(d => d.id === id);
}

/**
 * Save new diary
 */
function saveDiary(title, content, isPublic, mood, tags) {
    const now = new Date();
    const diary = {
        id: generateId(),
        title: title || '无标题日记',
        content: content || '',
        isPublic: isPublic || false,
        shareId: isPublic ? generateId() : null,
        mood: mood || null,
        tags: tags || [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };

    const diaries = getDiaries();
    diaries.unshift(diary);
    saveStorage(CONFIG.STORAGE_KEYS.DIARIES, diaries);
    state.diaries = diaries;

    // Clear draft
    removeStorage(CONFIG.STORAGE_KEYS.DRAFT);

    return diary;
}

/**
 * Global function to save diary (exposed for write.js)
 */
window.saveDiaryToStorage = saveDiary;

/**
 * Update existing diary
 */
function updateDiary(id, title, content, isPublic, mood, tags) {
    const diaries = getDiaries();
    const index = diaries.findIndex(d => d.id === id);

    if (index === -1) {
        return null;
    }

    const diary = diaries[index];
    diary.title = title || diary.title;
    diary.content = content || diary.content;
    diary.isPublic = isPublic !== undefined ? isPublic : diary.isPublic;
    diary.mood = mood !== undefined ? mood : diary.mood;
    diary.tags = tags !== undefined ? tags : diary.tags;

    // Generate or remove share ID based on visibility
    if (diary.isPublic && !diary.shareId) {
        diary.shareId = generateId();
    } else if (!diary.isPublic) {
        diary.shareId = null;
    }

    diary.updatedAt = new Date().toISOString();

    diaries[index] = diary;
    saveStorage(CONFIG.STORAGE_KEYS.DIARIES, diaries);
    state.diaries = diaries;

    return diary;
}

/**
 * Delete diary
 */
function deleteDiary(id) {
    const diaries = getDiaries();
    const filtered = diaries.filter(d => d.id !== id);

    if (filtered.length === diaries.length) {
        return false;
    }

    saveStorage(CONFIG.STORAGE_KEYS.DIARIES, filtered);
    state.diaries = filtered;
    return true;
}

/**
 * Get diary by share ID
 */
function getDiaryByShareId(shareId) {
    const diaries = getDiaries();
    return diaries.find(d => d.shareId === shareId && d.isPublic);
}

/**
 * Filter diaries by visibility
 */
function filterDiariesByVisibility(diaries, filter) {
    if (filter === 'all') return diaries;
    if (filter === 'public') return diaries.filter(d => d.isPublic);
    if (filter === 'private') return diaries.filter(d => !d.isPublic);
    return diaries;
}

/**
 * Search diaries by query
 */
function searchDiaries(query) {
    const diaries = getDiaries();
    if (!query || query.trim() === '') return diaries;

    const searchTerms = query.toLowerCase().trim();

    return diaries.filter(diary => {
        // Search in title
        if (diary.title && diary.title.toLowerCase().includes(searchTerms)) {
            return true;
        }

        // Search in content
        if (diary.content && diary.content.toLowerCase().includes(searchTerms)) {
            return true;
        }

        // Search in tags
        if (diary.tags && diary.tags.some(tag => tag.toLowerCase().includes(searchTerms))) {
            return true;
        }

        return false;
    });
}

/**
 * Get diaries by date
 */
function getDiariesByDate(date) {
    const diaries = getDiaries();
    const targetDate = formatDate(date);
    return diaries.filter(d => {
        const diaryDate = formatDate(d.createdAt);
        return diaryDate === targetDate;
    });
}

// ============================================
// Statistics Functions
// ============================================

/**
 * Calculate statistics
 */
function calculateStats() {
    const diaries = getDiaries();
    const now = new Date();

    // Total count
    const totalCount = diaries.length;

    // Get diary dates
    const dates = diaries.map(d => formatDate(d.createdAt)).sort().reverse();

    // Remove duplicates for consecutive day calculation
    const uniqueDates = [...new Set(dates)];

    // Current month count
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyCount = diaries.filter(d => {
        const date = new Date(d.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    // Calculate streaks
    const today = formatDate(now);
    const yesterday = formatDate(new Date(now - 86400000));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date();

    // Check if today or yesterday has a diary (for current streak)
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
        // Start from today and work backwards
        let streakDate = new Date();
        while (uniqueDates.includes(formatDate(streakDate))) {
            currentStreak++;
            streakDate = new Date(streakDate - 86400000);
        }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const currentDate = new Date(uniqueDates[i]);
            const prevDate = new Date(uniqueDates[i - 1]);
            const diffDays = (prevDate - currentDate) / 86400000;

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
        totalCount,
        monthlyCount,
        currentStreak,
        longestStreak
    };
}

/**
 * Calculate weekly word count
 */
function calculateWeeklyWordCount() {
    const diaries = getDiaries();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate start of week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Filter diaries from this week
    const weeklyDiaries = diaries.filter(d => {
        const diaryDate = new Date(d.createdAt);
        return diaryDate >= startOfWeek;
    });

    // Calculate total words
    const totalWords = weeklyDiaries.reduce((sum, diary) => {
        return sum + countWords(diary.content || '');
    }, 0);

    return totalWords;
}

/**
 * Analyze writing peak hours
 */
function analyzeWritingPeakHours() {
    const diaries = getDiaries();

    // Count diaries by hour
    const hourCounts = new Array(24).fill(0);
    diaries.forEach(diary => {
        const hour = new Date(diary.createdAt).getHours();
        hourCounts[hour]++;
    });

    // Find peak hours (top 3)
    const peaks = [];
    for (let i = 0; i < 24; i++) {
        if (hourCounts[i] > 0) {
            peaks.push({ hour: i, count: hourCounts[i] });
        }
    }

    // Sort by count descending and take top 3
    peaks.sort((a, b) => b.count - a.count);
    const topPeaks = peaks.slice(0, 3);

    // Format result
    const timeRanges = {
        morning: { start: 6, end: 11, label: '早晨' },
        afternoon: { start: 12, end: 17, label: '下午' },
        evening: { start: 18, end: 23, label: '晚上' },
        night: { start: 0, end: 5, label: '深夜' }
    };

    if (topPeaks.length === 0) {
        return { period: '暂无数据', hour: null };
    }

    const peak = topPeaks[0];
    let period = '其他';

    for (const [key, range] of Object.entries(timeRanges)) {
        if (peak.hour >= range.start && peak.hour <= range.end) {
            period = range.label;
            break;
        }
    }

    return {
        period: period,
        hour: peak.hour,
        count: peak.count,
        allPeaks: topPeaks
    };
}

/**
 * Get diary counts per date for calendar
 */
function getDiaryCountsByMonth(year, month) {
    const diaries = getDiaries();
    const counts = {};

    diaries.forEach(diary => {
        const date = new Date(diary.createdAt);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const day = date.getDate();
            if (!counts[day]) {
                counts[day] = { count: 0, mood: diary.mood };
            }
            counts[day].count += 1;
        }
    });

    return counts;
}

// ============================================
// Draft Functions
// ============================================

/**
 * Save draft
 */
function saveDraft(title, content, isPublic) {
    const draft = {
        title,
        content,
        isPublic,
        savedAt: new Date().toISOString()
    };
    saveStorage(CONFIG.STORAGE_KEYS.DRAFT, draft);
}

/**
 * Load draft
 */
function loadDraft() {
    return getStorage(CONFIG.STORAGE_KEYS.DRAFT);
}

/**
 * Clear draft
 */
function clearDraft() {
    removeStorage(CONFIG.STORAGE_KEYS.DRAFT);
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================
// URL Parameter Functions
// ============================================

/**
 * Get URL parameter
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Set URL parameter
 */
function setUrlParam(name, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// ============================================
// Initialize on page load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize user
    getUser();

    // Load diaries
    loadDiaries();
});
