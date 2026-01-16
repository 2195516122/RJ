// ============================================
// Share Page - Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Try both old (share) and new (data) URL parameters
    const dataParam = getUrlParam('data');
    const shareId = getUrlParam('share');

    if (dataParam) {
        // New method: data encoded in URL
        loadSharedDiaryFromData(dataParam);
    } else if (shareId) {
        // Old method: lookup by shareId (for backward compatibility)
        loadSharedDiaryById(shareId);
    } else {
        showError();
    }
});

// ============================================
// Load Shared Diary
// ============================================

/**
 * Load diary from encoded URL data
 */
function loadSharedDiaryFromData(encodedData) {
    try {
        // Decode the data
        const decodedData = JSON.parse(decodeURIComponent(escape(atob(encodedData))));

        const diary = {
            title: decodedData.title,
            content: decodedData.content,
            createdAt: decodedData.date
        };

        renderSharedDiary(diary);
    } catch (error) {
        console.error('Error decoding share data:', error);
        showError();
    }
}

/**
 * Load diary by share ID (legacy method)
 */
function loadSharedDiaryById(shareId) {
    // This method only works for the same browser (localStorage)
    const diary = getDiaryByShareId(shareId);

    if (!diary) {
        showError();
        return;
    }

    renderSharedDiary(diary);
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
