// ============================================
// Write Page - State
// ============================================
let autoSaveTimer = null;
let hasUnsavedChanges = false;
let editDiaryId = null;
let selectedMood = null;

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
// Initialize Write Page
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if editing existing diary
    const diaryId = getUrlParam('id');
    if (diaryId) {
        editDiaryId = diaryId;
        loadDiaryForEdit(diaryId);
    } else {
        // Load draft if exists
        loadDraft();
    }

    // Set current date
    updateWriteDate();

    // Initialize mood selector
    initMoodSelector();

    // Focus on title
    document.getElementById('diaryTitle').focus();
});

// ============================================
// Input Handling & Auto-save
// ============================================

/**
 * Handle input changes
 */
function handleInput() {
    hasUnsavedChanges = true;

    // Update word count
    updateWordCount();

    // Auto-save draft
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        saveDraftData();
    }, CONFIG.AUTO_SAVE_DELAY);
}

/**
 * Update word count
 */
function updateWordCount() {
    const content = document.getElementById('diaryContent').value;
    const count = countWords(content);
    document.getElementById('currentCount').textContent = count;
}

/**
 * Update write date display
 */
function updateWriteDate() {
    const now = new Date();
    document.getElementById('writeDate').textContent = formatDateDisplay(now);
}

/**
 * Initialize mood selector
 */
function initMoodSelector() {
    const moodButtons = document.querySelectorAll('.mood-btn');

    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            moodButtons.forEach(b => b.classList.remove('selected'));

            // Add selected class to clicked button
            btn.classList.add('selected');

            // Store selected mood
            selectedMood = btn.dataset.mood;
            document.getElementById('selectedMood').value = selectedMood;
        });
    });
}

/**
 * Save draft data
 */
function saveDraftData() {
    if (editDiaryId) return; // Don't save draft when editing

    const title = document.getElementById('diaryTitle').value;
    const content = document.getElementById('diaryContent').value;
    const isPublic = document.getElementById('isPublic').checked;

    saveDraft(title, content, isPublic);

    // Show saving status
    const statusEl = document.getElementById('autoSaveStatus');
    statusEl.textContent = '草稿已自动保存';
    statusEl.className = 'auto-save-status';

    setTimeout(() => {
        statusEl.textContent = '';
    }, 2000);
}

// ============================================
// Diary Operations
// ============================================

/**
 * Handle save button click
 */
function handleSaveDiary() {
    const title = document.getElementById('diaryTitle').value.trim();
    const content = document.getElementById('diaryContent').value.trim();
    const isPublic = document.getElementById('isPublic').checked;
    const mood = selectedMood || null;

    // Validate
    if (!content) {
        showToast('请输入日记内容', 'warning');
        document.getElementById('diaryContent').focus();
        return;
    }

    let diary;
    if (editDiaryId) {
        // Update existing diary
        diary = updateDiary(editDiaryId, title, content, isPublic, mood);
        if (diary) {
            showToast('日记已更新');
        } else {
            showToast('更新失败', 'error');
            return;
        }
    } else {
        // Save new diary (call function from script.js)
        diary = window.saveDiaryToStorage(title, content, isPublic, mood);
        showToast('日记已保存');
    }

    hasUnsavedChanges = false;

    // Redirect to detail page
    setTimeout(() => {
        window.location.href = `detail.html?id=${diary.id}`;
    }, 500);
}

/**
 * Load diary for editing
 */
function loadDiaryForEdit(id) {
    const diary = getDiaryById(id);
    if (!diary) {
        showToast('日记不存在', 'error');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('diaryTitle').value = diary.title;
    document.getElementById('diaryContent').value = diary.content;
    document.getElementById('isPublic').checked = diary.isPublic;

    // Load mood if exists
    if (diary.mood) {
        selectedMood = diary.mood;
        document.getElementById('selectedMood').value = diary.mood;

        // Find and select the mood button
        const moodBtn = document.querySelector(`.mood-btn[data-mood="${diary.mood}"]`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
        }
    }

    // Update word count
    updateWordCount();
}

/**
 * Cancel write
 */
function cancelWrite() {
    if (!hasUnsavedChanges) {
        goBack();
        return;
    }

    openModal('cancelModal');
}

/**
 * Close cancel modal
 */
function closeCancelModal() {
    closeModal('cancelModal');
}

/**
 * Confirm cancel
 */
function confirmCancel() {
    hasUnsavedChanges = false;
    closeModal('cancelModal');
    goBack();
}

/**
 * Go back to previous page
 */
function goBack() {
    // Check if there's a referrer
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// Warn before leaving with unsaved changes
// ============================================
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
