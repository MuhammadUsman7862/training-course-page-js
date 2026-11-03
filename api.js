// api.js - talks to the data files. It never touches the page (no HTML here).

const COURSES_URL = 'data/courses.json';
const INSTRUCTORS_URL = 'data/instructors.json';

// Pretend the network is slow so you can SEE the loading state and try the Cancel button.
// Set this to 0 to remove the delay.
const FAKE_DELAY_MS = 800;

// Wait for some milliseconds, but stop early if the request is cancelled
function wait(ms, signal) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', function () {
      clearTimeout(timer);
      reject(new DOMException('Request cancelled', 'AbortError'));
    });
  });
}

// Fetch one JSON file and check for the problems that can happen
async function getJson(url, signal) {
  let response;
  try {
    response = await fetch(url, { signal: signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Network problem: could not reach ' + url + '. Check your connection or start a local server.');
  }

  // fetch only fails on network problems, so we must check response.ok ourselves
  if (!response.ok) {
    throw new Error('The server answered ' + response.status + ' for ' + url + '.');
  }

  try {
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('The file ' + url + ' does not contain valid JSON.');
  }
}

// Is this record safe to show? Bad records are skipped, not shown.
function isValidCourse(course) {
  return (
    typeof course === 'object' && course !== null &&
    Number.isFinite(course.id) &&
    typeof course.title === 'string' && course.title.trim() !== '' &&
    Number.isFinite(course.weeks) && course.weeks > 0
  );
}

function isValidInstructor(person) {
  return typeof person === 'object' && person !== null &&
    Number.isFinite(person.id) && typeof person.name === 'string';
}

// Give every course the same shape, with safe defaults for missing fields
function cleanCourse(course) {
  return {
    id: course.id,
    title: course.title.trim(),
    description: typeof course.description === 'string' ? course.description : '',
    instructorId: course.instructorId ?? null,
    weeks: course.weeks,
    level: typeof course.level === 'string' ? course.level : 'Beginner',
    score: Number.isFinite(course.score) ? course.score : 0
  };
}

// Load courses AND instructors at the same time with Promise.all
export async function loadCatalog(signal) {
  await wait(FAKE_DELAY_MS, signal);

  const results = await Promise.all([
    getJson(COURSES_URL, signal),
    getJson(INSTRUCTORS_URL, signal)
  ]);
  const rawCourses = results[0];
  const rawInstructors = results[1];

  if (!Array.isArray(rawCourses) || !Array.isArray(rawInstructors)) {
    throw new Error('Unexpected data: expected a list of courses and a list of instructors.');
  }

  const courses = rawCourses.filter(isValidCourse).map(cleanCourse);
  const instructors = rawInstructors.filter(isValidInstructor);
  return { courses: courses, instructors: instructors, skipped: rawCourses.length - courses.length };
}
