/**
 * Research Opportunity Portal - Frontend Application
 * Step 3 Implementation: Complete REST API Interaction
 */

// Localhost REST API endpoint
const API_BASE = '/api/opportunities';

// State management
let opportunitiesData = [];
let currentFilter = 'All';
let currentSearchTerm = '';
let opportunityToDeleteId = null;

// DOM Elements
const opportunitiesList = document.getElementById('opportunities-list');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const refreshBtn = document.getElementById('refresh-btn');

// Metrics elements
const totalCountEl = document.getElementById('total-count');
const openCountEl = document.getElementById('open-count');
const closedCountEl = document.getElementById('closed-count');
const positionsCountEl = document.getElementById('positions-count');

// Opportunity Modal (Create / Edit)
const oppModal = document.getElementById('opp-modal');
const oppModalTitle = document.getElementById('opp-modal-title');
const oppForm = document.getElementById('opp-form');
const oppIdInput = document.getElementById('opp-id');
const openCreateModalBtn = document.getElementById('open-create-modal-btn');
const emptyCreateBtn = document.getElementById('empty-create-btn');
const closeOppModalBtn = document.getElementById('close-opp-modal-btn');
const cancelOppBtn = document.getElementById('cancel-opp-btn');

// View Details Modal
const detailsModal = document.getElementById('details-modal');
const closeDetailsModalBtn = document.getElementById('close-details-modal-btn');
const detailsContent = document.getElementById('details-content');

// Delete Confirmation Modal
const deleteModal = document.getElementById('delete-modal');
const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteOppTitleEl = document.getElementById('delete-opp-title');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// ==========================================
// Toast Notification System
// ==========================================
function showToast(type, title, message, duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

function removeToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  toast.classList.add('removing');
  setTimeout(() => {
    if (toast.parentElement) toast.parentElement.removeChild(toast);
  }, 250);
}

// ==========================================
// Utility Functions
// ==========================================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    // If format is like '2026-10-15'
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function normalizeDateForInput(dateStr) {
  if (!dateStr) return '';
  // Check if it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

// ==========================================
// API Operations
// ==========================================

/**
 * 1. Fetch & Display All Research Opportunities (GET /api/opportunities)
 */
async function fetchOpportunities() {
  setLoadingState(true);
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    opportunitiesData = Array.isArray(data) ? data : [];
    updateMetrics();
    renderOpportunities();
  } catch (error) {
    console.error('Fetch opportunities error:', error);
    showToast('error', 'Failed to Load Opportunities', `${error.message}. Is the backend running on port 5000?`);
    renderErrorState(error.message);
  } finally {
    setLoadingState(false);
  }
}

/**
 * 2. Fetch Single Opportunity Details (GET /api/opportunities/:id)
 */
async function fetchOpportunityById(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Opportunity #${id} not found`);
    }
    return await response.json();
  } catch (error) {
    showToast('error', 'Error Fetching Details', error.message);
    throw error;
  }
}

/**
 * 3. Create Research Opportunity (POST /api/opportunities)
 */
async function createOpportunity(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || `Failed to create opportunity (HTTP ${response.status})`);
  }
  return resData;
}

/**
 * 4. Update Research Opportunity (PUT /api/opportunities/:id)
 */
async function updateOpportunity(id, payload) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || `Failed to update opportunity (HTTP ${response.status})`);
  }
  return resData;
}

/**
 * 5. Quick Toggle Status (PUT /api/opportunities/:id with { status })
 */
async function toggleOpportunityStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
  try {
    await updateOpportunity(id, { status: newStatus });
    showToast('success', 'Status Updated', `Opportunity #${id} is now marked as "${newStatus}"`);
    
    // Update local state quickly
    const opp = opportunitiesData.find(item => item.id === id);
    if (opp) opp.status = newStatus;
    updateMetrics();
    renderOpportunities();
    
    // Also if details modal is open for this item, update it
    if (detailsModal.classList.contains('active')) {
      openDetailsModal(id);
    }
  } catch (error) {
    showToast('error', 'Status Update Failed', error.message);
  }
}

/**
 * 6. Delete Research Opportunity (DELETE /api/opportunities/:id)
 */
async function deleteOpportunity(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE'
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || `Failed to delete opportunity (HTTP ${response.status})`);
  }
  return resData;
}

// ==========================================
// UI Rendering & Dashboard Metrics
// ==========================================

function updateMetrics() {
  const total = opportunitiesData.length;
  const open = opportunitiesData.filter(o => o.status === 'Open').length;
  const closed = opportunitiesData.filter(o => o.status === 'Closed').length;
  const positions = opportunitiesData.reduce((sum, o) => sum + (parseInt(o.available_positions, 10) || 0), 0);

  totalCountEl.textContent = total;
  openCountEl.textContent = open;
  closedCountEl.textContent = closed;
  positionsCountEl.textContent = positions;
}

function setLoadingState(loading) {
  if (loading && opportunitiesData.length === 0) {
    opportunitiesList.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Connecting to backend API...</p>
      </div>
    `;
  }
}

function renderErrorState(message) {
  opportunitiesList.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Connection Issue</h3>
      <p>Could not load research opportunities: <strong>${escapeHtml(message)}</strong></p>
      <p style="font-size:0.85rem; color:#64748b;">Make sure Flask server is active: <code>python app.py</code></p>
      <button class="btn btn-primary" onclick="fetchOpportunities()">Try Again</button>
    </div>
  `;
}

function renderOpportunities() {
  // Filter by status
  let filtered = opportunitiesData;
  if (currentFilter !== 'All') {
    filtered = filtered.filter(opp => opp.status === currentFilter);
  }

  // Filter by search query
  if (currentSearchTerm.trim() !== '') {
    const term = currentSearchTerm.toLowerCase();
    filtered = filtered.filter(opp => 
      (opp.research_title && opp.research_title.toLowerCase().includes(term)) ||
      (opp.research_area && opp.research_area.toLowerCase().includes(term)) ||
      (opp.faculty_name && opp.faculty_name.toLowerCase().includes(term)) ||
      (opp.department && opp.department.toLowerCase().includes(term)) ||
      (opp.required_skills && opp.required_skills.toLowerCase().includes(term))
    );
  }

  if (filtered.length === 0) {
    const hasSearch = currentSearchTerm.trim() !== '' || currentFilter !== 'All';
    opportunitiesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${hasSearch ? '🔍' : '📋'}</div>
        <h3>${hasSearch ? 'No matching opportunities found' : 'No Research Opportunities Posted Yet'}</h3>
        <p>${hasSearch ? 'Try adjusting your search criteria or filter.' : 'Be the first faculty member to publish a new research opening.'}</p>
        ${!hasSearch ? `<button class="btn btn-primary" onclick="openCreateModal()">+ Create First Opportunity</button>` : ''}
      </div>
    `;
    return;
  }

  opportunitiesList.innerHTML = filtered.map(opp => {
    const isOpen = opp.status === 'Open';
    const skillsList = opp.required_skills 
      ? opp.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    return `
      <div class="opp-card" data-id="${opp.id}">
        <div>
          <div class="opp-card-header">
            <div class="opp-badge-group">
              <span class="opp-id-pill">#${opp.id}</span>
              <span class="status-badge ${isOpen ? 'open' : 'closed'}">
                ${escapeHtml(opp.status)}
              </span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="toggleOpportunityStatus(${opp.id}, '${opp.status}')" title="Click to change status to ${isOpen ? 'Closed' : 'Open'}">
              ${isOpen ? 'Mark Closed' : 'Mark Open'}
            </button>
          </div>

          <h3 class="opp-title">${escapeHtml(opp.research_title)}</h3>

          <div class="opp-meta-list">
            <div class="opp-meta-item">
              <span class="icon">🔬</span>
              <span><strong>Area:</strong> ${escapeHtml(opp.research_area)}</span>
            </div>
            <div class="opp-meta-item">
              <span class="icon">👤</span>
              <span><strong>Faculty:</strong> ${escapeHtml(opp.faculty_name)} (${escapeHtml(opp.department)})</span>
            </div>
            <div class="opp-meta-item">
              <span class="icon">👥</span>
              <span><strong>Positions:</strong> ${escapeHtml(opp.available_positions)} opening(s)</span>
            </div>
            <div class="opp-meta-item">
              <span class="icon">📅</span>
              <span><strong>Deadline:</strong> ${formatDate(opp.application_deadline)}</span>
            </div>
          </div>

          <div class="opp-description">
            ${escapeHtml(opp.research_description)}
          </div>

          ${skillsList.length > 0 ? `
            <div class="skills-wrapper">
              <div class="skills-title">Required Skills</div>
              <div class="skills-tags">
                ${skillsList.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="opp-card-footer">
          <button class="btn btn-secondary btn-sm" onclick="openDetailsModal(${opp.id})">
            👁️ View Details
          </button>
          <div class="action-buttons">
            <button class="btn btn-outline btn-sm" onclick="openEditModal(${opp.id})" title="Edit opportunity">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="promptDelete(${opp.id}, '${escapeHtml(opp.research_title)}')" title="Delete opportunity">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// Modal Handlers
// ==========================================

function openCreateModal() {
  clearFormValidation();
  oppForm.reset();
  oppIdInput.value = '';
  oppModalTitle.textContent = 'Post New Research Opportunity';
  document.getElementById('opp-status').value = 'Open';
  oppModal.classList.add('active');
}

async function openEditModal(id) {
  clearFormValidation();
  oppForm.reset();
  
  try {
    const opp = await fetchOpportunityById(id);
    oppIdInput.value = opp.id;
    oppModalTitle.textContent = `Edit Research Opportunity #${opp.id}`;

    document.getElementById('opp-title').value = opp.research_title || '';
    document.getElementById('opp-faculty').value = opp.faculty_name || '';
    document.getElementById('opp-dept').value = opp.department || '';
    document.getElementById('opp-area').value = opp.research_area || '';
    document.getElementById('opp-positions').value = opp.available_positions || '';
    document.getElementById('opp-deadline').value = normalizeDateForInput(opp.application_deadline);
    document.getElementById('opp-status').value = opp.status || 'Open';
    document.getElementById('opp-skills').value = opp.required_skills || '';
    document.getElementById('opp-description').value = opp.research_description || '';

    oppModal.classList.add('active');
  } catch (error) {
    // Error handled in fetchOpportunityById
  }
}

function closeOppModal() {
  oppModal.classList.remove('active');
  oppForm.reset();
  clearFormValidation();
}

async function openDetailsModal(id) {
  detailsContent.innerHTML = `
    <div class="loading-container" style="padding: 2rem;">
      <div class="spinner"></div>
      <p>Loading details...</p>
    </div>
  `;
  detailsModal.classList.add('active');

  try {
    const opp = await fetchOpportunityById(id);
    const isOpen = opp.status === 'Open';
    const skillsList = opp.required_skills 
      ? opp.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    detailsContent.innerHTML = `
      <div class="detail-header-card">
        <div>
          <span class="opp-id-pill" style="font-size:0.8rem;">Opportunity #${opp.id}</span>
          <h2 style="font-size:1.3rem; margin-top:0.35rem; font-weight:700;">${escapeHtml(opp.research_title)}</h2>
        </div>
        <span class="status-badge ${isOpen ? 'open' : 'closed'}">
          ${escapeHtml(opp.status)}
        </span>
      </div>

      <div class="form-grid" style="margin-top: 1rem;">
        <div class="detail-section">
          <div class="detail-label">Faculty Member</div>
          <div class="detail-value">👨‍🏫 ${escapeHtml(opp.faculty_name)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Department</div>
          <div class="detail-value">🏢 ${escapeHtml(opp.department)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Research Area</div>
          <div class="detail-value">🔬 ${escapeHtml(opp.research_area)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Available Positions</div>
          <div class="detail-value">👥 ${escapeHtml(opp.available_positions)} opening(s)</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Application Deadline</div>
          <div class="detail-value">📅 ${formatDate(opp.application_deadline)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Status Action</div>
          <div>
            <button class="btn btn-outline btn-sm" onclick="toggleOpportunityStatus(${opp.id}, '${opp.status}')">
              ${isOpen ? 'Close This Position' : 'Reopen This Position'}
            </button>
          </div>
        </div>
      </div>

      <div class="detail-section" style="margin-top: 1rem;">
        <div class="detail-label">Required Skills & Prerequisites</div>
        <div class="skills-tags" style="margin-top:0.25rem;">
          ${skillsList.map(s => `<span class="skill-tag" style="font-size:0.85rem; padding:0.3rem 0.7rem;">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <div class="detail-section" style="margin-top: 1rem;">
        <div class="detail-label">Research Project Description</div>
        <div class="detail-value desc">${escapeHtml(opp.research_description)}</div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <button class="btn btn-secondary" onclick="closeDetailsModal()">Close</button>
        <button class="btn btn-primary" onclick="closeDetailsModal(); openEditModal(${opp.id})">✏️ Edit</button>
        <button class="btn btn-danger" onclick="closeDetailsModal(); promptDelete(${opp.id}, '${escapeHtml(opp.research_title)}')">🗑️ Delete</button>
      </div>
    `;
  } catch (error) {
    detailsContent.innerHTML = `
      <div class="empty-state">
        <p style="color:var(--danger);">Error loading details: ${escapeHtml(error.message)}</p>
        <button class="btn btn-secondary" onclick="closeDetailsModal()">Close</button>
      </div>
    `;
  }
}

function closeDetailsModal() {
  detailsModal.classList.remove('active');
}

function promptDelete(id, title) {
  opportunityToDeleteId = id;
  deleteOppTitleEl.textContent = `"${title}" (ID: #${id})`;
  deleteModal.classList.add('active');
}

function closeDeleteModal() {
  deleteModal.classList.remove('active');
  opportunityToDeleteId = null;
}

// ==========================================
// Form Validation & Submission
// ==========================================

function clearFormValidation() {
  const inputs = oppForm.querySelectorAll('.form-input, .form-textarea, .form-select');
  inputs.forEach(input => input.classList.remove('error'));
  const errorMsgs = oppForm.querySelectorAll('.error-message');
  errorMsgs.forEach(msg => {
    msg.classList.remove('active');
    msg.textContent = '';
  });
}

function validateField(id, errorId, errorText) {
  const el = document.getElementById(id);
  const errEl = document.getElementById(errorId);
  const val = el.value.trim();

  if (!val) {
    el.classList.add('error');
    if (errEl) {
      errEl.textContent = errorText;
      errEl.classList.add('active');
    }
    return false;
  }

  el.classList.remove('error');
  if (errEl) errEl.classList.remove('active');
  return true;
}

function validateForm() {
  let isValid = true;

  if (!validateField('opp-title', 'title-error', 'Research title is required')) isValid = false;
  if (!validateField('opp-faculty', 'faculty-error', 'Faculty name is required')) isValid = false;
  if (!validateField('opp-dept', 'dept-error', 'Department is required')) isValid = false;
  if (!validateField('opp-area', 'area-error', 'Research area is required')) isValid = false;
  
  const positionsEl = document.getElementById('opp-positions');
  const positionsErr = document.getElementById('positions-error');
  const posVal = parseInt(positionsEl.value, 10);
  if (isNaN(posVal) || posVal < 1) {
    positionsEl.classList.add('error');
    positionsErr.textContent = 'Please enter at least 1 position';
    positionsErr.classList.add('active');
    isValid = false;
  } else {
    positionsEl.classList.remove('error');
    positionsErr.classList.remove('active');
  }

  if (!validateField('opp-deadline', 'deadline-error', 'Application deadline is required')) isValid = false;
  if (!validateField('opp-skills', 'skills-error', 'Required skills are required')) isValid = false;
  if (!validateField('opp-description', 'description-error', 'Research description is required')) isValid = false;

  return isValid;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    showToast('error', 'Validation Error', 'Please fill in all required fields correctly.');
    return;
  }

  const id = oppIdInput.value;
  const isEditing = Boolean(id);

  const payload = {
    research_title: document.getElementById('opp-title').value.trim(),
    faculty_name: document.getElementById('opp-faculty').value.trim(),
    department: document.getElementById('opp-dept').value.trim(),
    research_area: document.getElementById('opp-area').value.trim(),
    available_positions: parseInt(document.getElementById('opp-positions').value, 10),
    application_deadline: document.getElementById('opp-deadline').value,
    status: document.getElementById('opp-status').value,
    required_skills: document.getElementById('opp-skills').value.trim(),
    research_description: document.getElementById('opp-description').value.trim()
  };

  const submitBtn = document.getElementById('submit-opp-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="width:1rem;height:1rem;border-width:2px;"></span> Saving...';

  try {
    if (isEditing) {
      await updateOpportunity(id, payload);
      showToast('success', 'Opportunity Updated', `Research opportunity #${id} was updated successfully!`);
    } else {
      const created = await createOpportunity(payload);
      showToast('success', 'Opportunity Created', `New opportunity #${created.id} was created successfully!`);
    }

    closeOppModal();
    await fetchOpportunities();
  } catch (error) {
    showToast('error', isEditing ? 'Update Failed' : 'Creation Failed', error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function handleConfirmDelete() {
  if (!opportunityToDeleteId) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    await deleteOpportunity(opportunityToDeleteId);
    showToast('success', 'Deleted Successfully', `Opportunity #${opportunityToDeleteId} has been removed.`);
    closeDeleteModal();
    await fetchOpportunities();
  } catch (error) {
    showToast('error', 'Delete Failed', error.message);
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Yes, Delete';
  }
}

// ==========================================
// Event Listeners Initialization
// ==========================================

function initEventListeners() {
  // Search & Filter
  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    renderOpportunities();
  });

  statusFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderOpportunities();
  });

  refreshBtn.addEventListener('click', () => {
    fetchOpportunities();
    showToast('info', 'Refreshing', 'Fetching latest opportunities from server...');
  });

  // Modal Buttons
  openCreateModalBtn.addEventListener('click', openCreateModal);
  closeOppModalBtn.addEventListener('click', closeOppModal);
  cancelOppBtn.addEventListener('click', closeOppModal);

  closeDetailsModalBtn.addEventListener('click', closeDetailsModal);

  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Form Submission
  oppForm.addEventListener('submit', handleFormSubmit);

  // Close modals when clicking on backdrop
  [oppModal, detailsModal, deleteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [oppModal, detailsModal, deleteModal].forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

// Expose necessary functions to window for inline onclick handlers
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.promptDelete = promptDelete;
window.toggleOpportunityStatus = toggleOpportunityStatus;
window.fetchOpportunities = fetchOpportunities;

// Start app
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  fetchOpportunities();
});
