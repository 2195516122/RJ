// ============================================
// Detail Page - State
// ============================================
let currentDiary = null;

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

    // If not public, prompt to make public first
    if (!currentDiary.isPublic) {
        showToast('请先将日记设置为公开', 'warning');
        return;
    }

    if (!currentDiary.shareId) {
        showToast('分享链接生成失败', 'error');
        return;
    }

    // Generate share URL
    const shareUrl = `${window.location.origin}${window.location.pathname.replace('detail.html', 'share.html')}?share=${currentDiary.shareId}`;

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
