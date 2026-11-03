// app.js - connects the controls on the page to the data (api.js), helpers (utils.js) and drawing (ui.js).

import { loadCatalog } from './api.js';
import { DEFAULT_FILTERS, debounce, filterCourses, sortCourses, readFilters, buildQueryString, countByLevel } from './utils.js';
import { showLoading, showMessage, clearStatus, renderCourses, renderSummary } from './ui.js';

// ----- Page elements -----
const searchInput = document.getElementById('search');
const levelSelect = document.getElementById('level');
const sortSelect = document.getElementById('sort');
const reloadButton = document.getElementById('reload');
const controlsForm = document.getElementById('controls');
const summaryBox = document.getElementById('summary');
const statusBox = document.getElementById('status');
const listBox = document.getElementById('course-list');

// ----- Data we keep while the page is open -----
let allCourses = [];
let instructorsById = new Map();
let skippedCount = 0;
let hasLoaded = false;
let currentController = null; // lets us cancel the request that is running

function readControls() {
  return { search: searchInput.value, level: levelSelect.value, sort: sortSelect.value };
}

function writeControls(filters) {
  searchInput.value = filters.search;
  levelSelect.value = filters.level;
  sortSelect.value = filters.sort;
}

// Filter + sort the loaded data, update the URL and draw the result
function showResults() {
  if (!hasLoaded) return; // nothing to show while loading or after an error
  clearStatus(statusBox);

  // Empty state 1: the data itself has no records
  if (allCourses.length === 0) {
    listBox.innerHTML = '';
    summaryBox.textContent = '';
    showMessage(statusBox, 'empty', 'No courses yet', 'The course list is empty. Please check again soon.', [
      { action: 'reload', label: 'Check again' }
    ]);
    return;
  }

  const filters = readControls();
  const visible = sortCourses(filterCourses(allCourses, filters), filters.sort);

  // Keep the filters in the address bar, so the link can be shared
  const query = buildQueryString(filters);
  history.replaceState(null, '', query === '' ? location.pathname : '?' + query);

  renderCourses(listBox, visible, instructorsById);
  renderSummary(summaryBox, visible.length, allCourses.length, countByLevel(visible), skippedCount);

  // Empty state 2: records exist, but none match the search
  if (visible.length === 0) {
    showMessage(statusBox, 'empty', 'No matching courses', 'Nothing matches your search. Try another word or clear the filters.', [
      { action: 'clear', label: 'Clear filters' }
    ]);
  }
}

// Load the data (loading -> success / empty / error)
async function loadData() {
  // Cancel an older request that is still running
  if (currentController !== null) currentController.abort();
  const controller = new AbortController();
  currentController = controller;

  hasLoaded = false;
  showLoading(statusBox, listBox, summaryBox);

  try {
    const catalog = await loadCatalog(controller.signal);
    allCourses = catalog.courses;
    instructorsById = new Map(catalog.instructors.map(function (person) { return [person.id, person]; }));
    skippedCount = catalog.skipped;
    hasLoaded = true;
    showResults();
  } catch (error) {
    if (controller !== currentController) return; // a newer request took over, so ignore this one
    if (error.name === 'AbortError') {
      showMessage(statusBox, 'info', 'Loading cancelled', 'The request was stopped.', [{ action: 'reload', label: 'Load again' }]);
    } else {
      showMessage(statusBox, 'error', 'Could not load the courses', error.message, [{ action: 'reload', label: 'Try again' }]);
    }
  }
}

// ----- Events -----
const updateAfterTyping = debounce(showResults, 300); // wait 300 ms after the last key
searchInput.addEventListener('input', updateAfterTyping);
levelSelect.addEventListener('change', showResults);
sortSelect.addEventListener('change', showResults);
reloadButton.addEventListener('click', loadData);
controlsForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Enter in the search box must not reload the page
});

// Event delegation: one listener for every button inside the status box
statusBox.addEventListener('click', function (event) {
  const button = event.target.closest('[data-action]');
  if (button === null) return;
  if (button.dataset.action === 'cancel') currentController.abort();
  if (button.dataset.action === 'reload') loadData();
  if (button.dataset.action === 'clear') {
    writeControls(DEFAULT_FILTERS);
    showResults();
  }
});

// ----- Start -----
writeControls(readFilters(location.search)); // use ?search=...&level=...&sort=... from the URL
loadData();
