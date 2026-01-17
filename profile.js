// ============================================
// Profile Page - State
// ============================================
let currentTab = 'diaries';
let currentFilter = 'all';

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
// Initialize Profile Page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateProfile();
    updateStats();
    renderDiaryList();
    renderSharedList();
});

// ============================================
// Profile Functions
// ============================================

/**
 * Update profile display
 */
function updateProfile() {
    const user = getUser();

    // Update avatar initial
    document.getElementById('avatarInitial').textContent = getInitial(user.nickname);

    // Update name
    document.getElementById('profileName').textContent = user.nickname;

    // Update register date
    const registerDate = new Date(user.registerDate);
    document.getElementById('registerDate').textContent =
        `${registerDate.getFullYear()}.${String(registerDate.getMonth() + 1).padStart(2, '0')}`;

    // Update diary count
    const diaries = getDiaries();
    document.getElementById('diaryCount').textContent = diaries.length;
}

/**
 * Update statistics
 */
function updateStats() {
    const stats = calculateStats();

    document.getElementById('monthlyCount').textContent = stats.monthlyCount;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('longestStreak').textContent = stats.longestStreak;
    document.getElementById('totalCount').textContent = stats.totalCount;
}

// ============================================
// Tab Functions
// ============================================

/**
 * Switch tab
 */
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.getElementById('diariesTab').style.display = tab === 'diaries' ? 'block' : 'none';
    document.getElementById('sharedTab').style.display = tab === 'shared' ? 'block' : 'none';
}

// ============================================
// Diary List Functions
// ============================================

/**
 * Render diary list
 */
function renderDiaryList() {
    const diaries = getDiaries();
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
 * Render shared diary list
 */
function renderSharedList() {
    const diaries = getDiaries();
    const sharedDiaries = diaries.filter(d => d.isPublic && d.shareId);
    const sharedList = document.getElementById('sharedList');
    const emptyState = document.getElementById('sharedEmptyState');

    // Clear existing items (except empty state)
    const existingItems = sharedList.querySelectorAll('.diary-card');
    existingItems.forEach(item => item.remove());

    if (sharedDiaries.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Create diary cards with share actions
    sharedDiaries.forEach(diary => {
        const card = createSharedDiaryCard(diary);
        sharedList.appendChild(card);
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
 * Create shared diary card with share link
 */
function createSharedDiaryCard(diary) {
    const card = document.createElement('div');
    card.className = 'diary-card';

    const date = new Date(diary.createdAt);
    const wordCount = countWords(diary.content);
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('profile.html', 'share.html')}?share=${diary.shareId}`;

    card.innerHTML = `
        <div class="diary-card-header">
            <h3 class="diary-card-title">${escapeHtml(diary.title)}</h3>
            <div class="diary-card-visibility">
                <span>🌐 公开</span>
            </div>
        </div>
        <div class="diary-card-content">
            ${escapeHtml(diary.content || '暂无内容')}
        </div>
        <div class="diary-card-footer">
            <span class="diary-card-date">${formatDateDisplay(date)}</span>
            <div class="diary-card-meta">
                <span>${formatTime(date)}</span>
                <span>${wordCount} 字</span>
            </div>
        </div>
        <div class="diary-card-share-link">
            <span class="share-link-label">分享链接：</span>
            <input type="text" class="share-link-input-mini" value="${shareUrl}" readonly>
            <button class="btn-copy-mini" onclick="copyShareLinkFromCard('${shareUrl}')">复制</button>
        </div>
    `;

    // Add click to view
    card.onclick = (e) => {
        // Don't navigate if clicking on share link elements
        if (e.target.classList.contains('share-link-input-mini') ||
            e.target.classList.contains('btn-copy-mini') ||
            e.target.classList.contains('share-link-label')) {
            return;
        }
        window.location.href = `detail.html?id=${diary.id}`;
    };

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
 * Copy share link from card
 */
function copyShareLinkFromCard(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('链接已复制到剪贴板');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('链接已复制到剪贴板');
    });
}

// ============================================
// Edit Profile Functions
// ============================================

/**
 * Open edit profile modal
 */
function openEditProfile() {
    const user = getUser();
    document.getElementById('editNickname').value = user.nickname;
    openModal('editProfileModal');
}

/**
 * Close edit profile modal
 */
function closeEditProfile() {
    closeModal('editProfileModal');
}

/**
 * Save profile
 */
function saveProfile() {
    const nickname = document.getElementById('editNickname').value.trim();

    if (!nickname) {
        showToast('请输入昵称', 'warning');
        return;
    }

    if (nickname.length > 20) {
        showToast('昵称不能超过20个字符', 'warning');
        return;
    }

    updateUserNickname(nickname);
    updateProfile();
    closeEditProfile();
    showToast('资料已更新');
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

// Add CSS for mini share link in card
const style = document.createElement('style');
style.textContent = `
    .diary-card-share-link {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
    }

    .share-link-label {
        font-size: 12px;
        color: var(--text-tertiary);
        white-space: nowrap;
    }

    .share-link-input-mini {
        flex: 1;
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 12px;
        font-family: monospace;
    }

    .btn-copy-mini {
        padding: 4px 12px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
    }

    .btn-copy-mini:hover {
        background: var(--primary-hover);
    }
`;
document.head.appendChild(style);
