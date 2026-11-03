// utils.js - small helper functions with no page code: filter, sort, URL and debounce.

export const DEFAULT_FILTERS = { search: '', level: 'all', sort: 'title' };

const LEVELS = ['all', 'Beginner', 'Intermediate', 'Advanced'];
const SORTS = ['title', 'weeks', 'score'];

// Debounce: wait until the user stops typing before running the function.
// The returned function "remembers" the timer (a closure).
export function debounce(callback, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback(...args);
    }, delay);
  };
}

export function filterCourses(courses, filters) {
  const text = filters.search.trim().toLowerCase();
  return courses.filter(function (course) {
    const matchesText =
      course.title.toLowerCase().includes(text) ||
      course.description.toLowerCase().includes(text);
    const matchesLevel = filters.level === 'all' || course.level === filters.level;
    return matchesText && matchesLevel;
  });
}

// Sort a COPY, so the original list stays the same
export function sortCourses(courses, sortBy) {
  const copy = [...courses];
  if (sortBy === 'weeks') {
    copy.sort(function (a, b) { return a.weeks - b.weeks; });       // shortest first
  } else if (sortBy === 'score') {
    copy.sort(function (a, b) { return b.score - a.score; });       // best score first
  } else {
    copy.sort(function (a, b) { return a.title.localeCompare(b.title); });
  }
  return copy;
}

// Read ?search=...&level=...&sort=... from the URL. Wrong values fall back to the defaults.
export function readFilters(queryString) {
  const params = new URLSearchParams(queryString);
  const level = params.get('level') ?? 'all';
  const sort = params.get('sort') ?? 'title';
  return {
    search: params.get('search') ?? '',
    level: LEVELS.includes(level) ? level : 'all',
    sort: SORTS.includes(sort) ? sort : 'title'
  };
}

// Turn the filters into a query string. Default values are left out to keep the URL short.
export function buildQueryString(filters) {
  const params = new URLSearchParams();
  if (filters.search.trim() !== '') params.set('search', filters.search.trim());
  if (filters.level !== 'all') params.set('level', filters.level);
  if (filters.sort !== 'title') params.set('sort', filters.sort);
  return params.toString();
}

// Grouping with reduce: { Beginner: 3, Intermediate: 4, Advanced: 1 }
export function countByLevel(courses) {
  return courses.reduce(function (counts, course) {
    counts[course.level] = (counts[course.level] ?? 0) + 1;
    return counts;
  }, {});
}
