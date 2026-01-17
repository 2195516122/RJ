// ============================================
// Detail Page - State
// ============================================
let currentDiary = null;

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
// Initialize Detail Page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const diaryId = getUrlParam('id');
    if (!diaryId) {
        showToast('日记ID不存在', 'error');
        window.location.href = 'index.html';
        return;
    }

    loadDiary(diaryId);
});

// ============================================
// Load Diary
// ============================================

/**
 * Load diary details
 */
function loadDiary(id) {
    const diary = getDiaryById(id);

    if (!diary) {
        showToast('日记不存在', 'error');
        window.location.href = 'index.html';
        return;
    }

    currentDiary = diary;
    renderDiary(diary);
}

/**
 * Render diary content
 */
function renderDiary(diary) {
    const date = new Date(diary.createdAt);
    const wordCount = countWords(diary.content);

    // Title
    document.getElementById('detailTitle').textContent = diary.title;

    // Mood
    const moodEl = document.getElementById('detailMood');
    if (diary.mood && MOOD_EMOJIS[diary.mood]) {
        moodEl.querySelector('.mood-icon').textContent = MOOD_EMOJIS[diary.mood];
        moodEl.style.display = 'inline-flex';
    } else {
        moodEl.style.display = 'none';
    }

    // Date and time
    document.getElementById('detailDate').textContent = formatDateDisplay(date);
    document.getElementById('detailTime').textContent = formatTime(date);

    // Visibility badge
    const visibilityEl = document.getElementById('detailVisibility');
    if (diary.isPublic) {
        visibilityEl.innerHTML = `
            <span class="visibility-icon">🌐</span>
            <span class="visibility-text">公开</span>
        `;
    } else {
        visibilityEl.innerHTML = `
            <span class="visibility-icon">🔒</span>
            <span class="visibility-text">私密</span>
        `;
    }

    // Tags
    const tagsEl = document.getElementById('detailTags');
    if (diary.tags && diary.tags.length > 0) {
        const tagLabels = {
            '工作': '💼',
            '学习': '📚',
            '情绪': '💭',
            '旅行': '✈️'
        };

        tagsEl.innerHTML = diary.tags.map(tag =>
            `<span class="detail-tag">${tagLabels[tag] || '#'} ${tag}</span>`
        ).join('');
        tagsEl.style.display = 'flex';
    } else {
        tagsEl.style.display = 'none';
    }

    // Content
    document.getElementById('detailText').textContent = diary.content;

    // Word count
    document.getElementById('detailWordCount').textContent = wordCount;
}

// ============================================
// Diary Actions
// ============================================

/**
 * Edit diary
 */
function editDiary() {
    if (!currentDiary) return;
    window.location.href = `write.html?id=${currentDiary.id}`;
}

/**
 * Handle delete button click
 */
function handleDeleteDiary() {
    if (!currentDiary) return;
    openModal('deleteModal');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    closeModal('deleteModal');
}

/**
 * Confirm delete
 */
function confirmDelete() {
    if (!currentDiary) return;

    const success = deleteDiaryFromStorage(currentDiary.id);

    if (success) {
        showToast('日记已删除');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } else {
        showToast('删除失败', 'error');
    }

    closeModal('deleteModal');
}

/**
 * Delete diary from storage (wrapper to avoid name conflict)
 */
function deleteDiaryFromStorage(id) {
    const diaries = getDiaries();
    const filtered = diaries.filter(d => d.id !== id);

    if (filtered.length === diaries.length) {
        return false;
    }

    saveStorage(CONFIG.STORAGE_KEYS.DIARIES, filtered);
    state.diaries = filtered;
    return true;
}

// ============================================
// Share Functions
// ============================================

/**
 * Share diary
 */
function shareDiary() {
    if (!currentDiary) return;

    // Encode diary data into URL (base64)
    const diaryData = {
        title: currentDiary.title,
        content: currentDiary.content,
        date: currentDiary.createdAt
    };

    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(diaryData))));

    // Generate share URL with encoded data
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('detail.html', 'share.html')}?data=${encodedData}`;

    // Show modal with link
    document.getElementById('shareLinkInput').value = shareUrl;
    openModal('shareModal');
}

/**
 * Close share modal
 */
function closeShareModal() {
    closeModal('shareModal');
}

/**
 * Copy share link
 */
function copyShareLink() {
    const shareLinkInput = document.getElementById('shareLinkInput');
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999); // For mobile

    try {
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            showToast('链接已复制到剪贴板');
            setTimeout(() => {
                closeShareModal();
            }, 1000);
        });
    } catch (err) {
        // Fallback for older browsers
        document.execCommand('copy');
        showToast('链接已复制到剪贴板');
        setTimeout(() => {
            closeShareModal();
        }, 1000);
    }
}

// ============================================
// Navigation
// ============================================

/**
 * Go back
 */
function goBack() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}
