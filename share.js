// ============================================
// Share Page - Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const shareId = getUrlParam('share');

    if (!shareId) {
        showError();
        return;
    }

    loadSharedDiary(shareId);
});

// ============================================
// Load Shared Diary
// ============================================

/**
 * Load diary by share ID
 */
function loadSharedDiary(shareId) {
    // Simulate loading delay for better UX
    setTimeout(() => {
        const diary = getDiaryByShareId(shareId);

        if (!diary) {
            showError();
            return;
        }

        renderSharedDiary(diary);
    }, 300);
}

/**
 * Render shared diary
 */
function renderSharedDiary(diary) {
    // Hide loading, show detail
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('shareDetail').style.display = 'block';

    const date = new Date(diary.createdAt);
    const wordCount = countWords(diary.content);

    // Title
    document.getElementById('shareTitle').textContent = diary.title;

    // Date and time
    document.getElementById('shareDate').textContent = formatDateDisplay(date);
    document.getElementById('shareTime').textContent = formatTime(date);

    // Content
    document.getElementById('shareText').textContent = diary.content;

    // Word count
    document.getElementById('shareWordCount').textContent = wordCount;

    // Update page title
    document.title = `${diary.title} - 日日记`;
}

/**
 * Show error state
 */
function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('shareDetail').style.display = 'none';
}
