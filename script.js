const API_URL = 'https://btu-ex-2025-0bf797fecbae.herokuapp.com/news';
let pendingDeleteId = null;
let pendingDeleteTitle = '';
let pendingDeleteAuthor = '';

document.addEventListener('DOMContentLoaded', () => {

  const newsContainer = document.getElementById('news-container');
  if (newsContainer) {
    loadNews();
    setupDeleteConfirmModal();
    checkForRedirectMessage();
  }

  const newsForm = document.getElementById('news-form');
  if (newsForm) {
    populateCategories();
    const urlParams = new URLSearchParams(window.location.search);
    const existingId = urlParams.get('id');
    if (existingId) {
      fetchSingleNews(existingId).then(newsItem => {
        if (newsItem) {
          document.getElementById('title').value = newsItem.title || '';
          document.getElementById('description').value = newsItem.description || '';
          document.getElementById('category').value = newsItem.category || '';
          document.getElementById('firstName').value = newsItem.firstName || '';
          document.getElementById('lastName').value = newsItem.lastName || '';
          document.getElementById('form-title').textContent = 'Edit News';
        }
      });
    }
    newsForm.addEventListener('submit', e => handleFormSubmit(e, existingId));
  }

});

async function loadNews() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error();
    const news = await response.json();
    renderNewsList(news);
  } catch {
    showMessage('error', 'Failed to load news. Please try again.');
  }
}

function renderNewsList(newsArray) {
  const container = document.getElementById('news-container');
  container.innerHTML = '';
  newsArray.forEach(item => {
    const shortenedDescription = item.description && item.description.length > 100
      ? item.description.substring(0, 100) + '...'
      : item.description || '';
    const newsElem = document.createElement('div');
    newsElem.classList.add('news-item');
    newsElem.setAttribute('data-id', item.id);
    newsElem.innerHTML = `
      <div>
        <h3>${item.title || 'Untitled'}</h3>
        <p>${shortenedDescription}</p>
        <small>Category: ${item.category || ''} | Author: ${item.firstName || ''} ${item.lastName || ''}</small>
      </div>
      <div class="button-container">
        <a class="edit-button" href="create.html?id=${item.id}">Update</a>
        <button class="delete-button" onclick="openDeleteConfirmModal('${item.id}','${item.title}','${item.firstName} ${item.lastName}')">Delete</button>
      </div>
    `;
    container.appendChild(newsElem);
  });
}

function openDeleteConfirmModal(id, title, author) {
  pendingDeleteId = id;
  pendingDeleteTitle = title;
  pendingDeleteAuthor = author;
  const modal = document.getElementById('delete-confirm-modal');
  const confirmText = document.getElementById('delete-confirm-text');
  confirmText.innerHTML = `<small>Are you sure you want to delete news </small><b>"${title}"</b><small> by </small><b>${author}</b><small>?</small>`;
  modal.style.display = 'block';
}

function setupDeleteConfirmModal() {
  const confirmButton = document.getElementById('delete-confirm-button');
  confirmButton.addEventListener('click', () => {
    if (pendingDeleteId) {
      deleteNews(pendingDeleteId, pendingDeleteTitle, pendingDeleteAuthor);
    }
    closeDeleteConfirmModal();
  });
}

function closeDeleteConfirmModal() {
  document.getElementById('delete-confirm-modal').style.display = 'none';
  pendingDeleteId = null;
  pendingDeleteTitle = '';
  pendingDeleteAuthor = '';
}

async function deleteNews(id, title, author) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error();
    const itemElem = document.querySelector(`.news-item[data-id="${id}"]`);
    if (itemElem) {
      itemElem.classList.add('deleting');
      itemElem.addEventListener('transitionend', () => itemElem.remove());
    }
    showMessage('success', `Deleted "${title}" by ${author}.`);
  } catch {
    showMessage('error', 'Failed to delete news. Please try again.');
  }
}

function checkForRedirectMessage() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('msg')) {
    const messageText = decodeURIComponent(params.get('msg'));
    showMessage('success', messageText);
    params.delete('msg');
    history.replaceState(null, '', window.location.pathname);
  }
}

async function fetchSingleNews(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error();
  return await response.json();
}

async function handleFormSubmit(event, existingId) {
  event.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const newsData = { title, description, category, firstName, lastName };
  try {
    if (existingId) {
      const response = await fetch(`${API_URL}/${existingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData)
      });
      if (!response.ok) throw new Error();
      window.location.href = 'index.html?msg=News+successfully+updated.';
    } else {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData)
      });
      if (!response.ok) throw new Error();
      window.location.href = 'index.html?msg=News+successfully+created.';
    }
  } catch {
    showMessage('error', 'Error occurred while processing. Please try again.');
  }
}

const DEFAULT_CATEGORIES = ['Technology','Sports','Politics'];

function populateCategories() {
  const savedCategories = loadCategoriesFromLocalStorage();
  const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...savedCategories]));
  const categorySelect = document.getElementById('category');
  if (!categorySelect) return;
  categorySelect.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select Category';
  categorySelect.appendChild(defaultOption);
  mergedCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function openAddCategoryModal() {
  document.getElementById('add-category-modal').style.display = 'block';
}

function closeAddCategoryModal() {
  document.getElementById('add-category-modal').style.display = 'none';
}

function addCategory() {
  const newCategoryInput = document.getElementById('new-category-input');
  const newCategory = newCategoryInput.value.trim();
  if (!newCategory) {
    alert('Please enter a valid category name.');
    return;
  }
  const existing = loadCategoriesFromLocalStorage();
  if (!existing.includes(newCategory) && !DEFAULT_CATEGORIES.includes(newCategory)) {
    existing.push(newCategory);
    saveCategoriesToLocalStorage(existing);
    populateCategories();
    document.getElementById('category').value = newCategory;
    closeAddCategoryModal();
  } else {
    alert('This category already exists.');
  }
  newCategoryInput.value = '';
}

function loadCategoriesFromLocalStorage() {
  const data = localStorage.getItem('myCategories');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

function saveCategoriesToLocalStorage(categories) {
  localStorage.setItem('myCategories', JSON.stringify(categories));
}

function showMessage(type, message) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.classList.add('toast-message');
  if (type === 'success') {
    toast.classList.add('toast-success');
  } else {
    toast.classList.add('toast-error');
  }
  toast.innerHTML = `<span>${message}</span><span class="toast-close">&times;</span>`;
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}
