// ui.js - only draws things on the page. It does not fetch or filter anything.

// Data comes from outside, so we turn special characters into safe text before using innerHTML
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function clearStatus(statusBox) {
  statusBox.innerHTML = '';
}

// Loading state: a spinner, a message and a Cancel button
export function showLoading(statusBox, listBox, summaryBox) {
  listBox.innerHTML = '';
  summaryBox.textContent = '';
  statusBox.innerHTML =
    '<div class="state"><span class="spinner" aria-hidden="true"></span> Loading courses... ' +
    '<button type="button" class="btn" data-action="cancel">Cancel</button></div>';
}

// Empty, error and info states all use this one function.
// buttons is a list like [{ action: 'reload', label: 'Try again' }]
export function showMessage(statusBox, kind, title, text, buttons) {
  const buttonHtml = buttons
    .map(function (button) {
      return '<button type="button" class="btn" data-action="' + button.action + '">' + escapeHtml(button.label) + '</button>';
    })
    .join(' ');
  const role = kind === 'error' ? ' role="alert"' : '';
  statusBox.innerHTML =
    '<div class="state state--' + kind + '"' + role + '>' +
    '<strong>' + escapeHtml(title) + '</strong><p>' + escapeHtml(text) + '</p>' + buttonHtml + '</div>';
}

// One card for each course
export function renderCourses(listBox, courses, instructorsById) {
  listBox.innerHTML = courses
    .map(function (course) {
      const instructor = instructorsById.get(course.instructorId);
      const instructorName = instructor ? instructor.name : 'To be announced';
      return (
        '<article class="card">' +
        '<h3>' + escapeHtml(course.title) + '</h3>' +
        '<p>' + escapeHtml(course.description) + '</p>' +
        '<p class="meta">' + course.weeks + ' weeks | ' + escapeHtml(course.level) + ' | Score ' + course.score + '/5</p>' +
        '<p class="meta">Instructor: ' + escapeHtml(instructorName) + '</p>' +
        '<a class="card-link" href="#lesson" aria-label="Start lesson: ' + escapeHtml(course.title) + '">Start lesson</a>' +
        '</article>'
      );
    })
    .join('');
}

export function renderSummary(summaryBox, shown, total, levelCounts, skipped) {
  const parts = Object.entries(levelCounts).map(function (entry) {
    return entry[0] + ': ' + entry[1];
  });
  let text = 'Showing ' + shown + ' of ' + total + ' courses (' + parts.join(', ') + ').';
  if (skipped > 0) text += ' ' + skipped + ' invalid record(s) were skipped.';
  summaryBox.textContent = text;
}
