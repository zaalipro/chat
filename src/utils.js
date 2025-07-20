import axios from 'axios'
import { WORKING_SESSION, WORKING_HOURS, API } from './constants'

// shamelessly copied from:
// http://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
export function timeDifference(current, previous) {

  var msPerMinute = 60 * 1000;
  var msPerHour = msPerMinute * 60;
  var msPerDay = msPerHour * 24;
  var msPerMonth = msPerDay * 30;
  var msPerYear = msPerDay * 365;

  var elapsed = current - previous;

  if (elapsed < msPerMinute / 3) {
    return 'just now'
  }

  if (elapsed < msPerMinute) {
    return 'less than 1 min ago'
  }

  else if (elapsed < msPerHour) {
    return Math.round(elapsed/msPerMinute) + ' min ago';
  }

  else if (elapsed < msPerDay ) {
    return Math.round(elapsed/msPerHour ) + ' h ago';
  }

  else if (elapsed < msPerMonth) {
    return Math.round(elapsed/msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
    return Math.round(elapsed/msPerMonth) + ' mo ago';
  }

  else {
    return Math.round(elapsed/msPerYear ) + ' years ago';
  }
}

export function timeDifferenceForDate(date) {
  const now = new Date().getTime()
  const updated = new Date(date).getTime()
  return timeDifference(now, updated)
}

export function generateShortStupidName(maxLength) {
  const username = "john"
  if (username.length > maxLength) {
    return generateShortStupidName(maxLength)
  }
  const usernameWithoutSpace = username.replace(' ', '-')
  return usernameWithoutSpace
}

export const isWorkingHours = (session, currentTime) => {
  // Add null check for currentTime
  if (!currentTime || typeof currentTime.hours !== 'function') {
    console.error('Invalid currentTime provided to isWorkingHours')
    return false
  }

  // Convert session to number if it's a string
  const sessionNum = typeof session === 'string' ? parseInt(session, 10) : session;
  
  // Debug info
  console.log('isWorkingHours check:', {
    session: sessionNum,
    currentHour: currentTime.hours(),
    currentTimeObj: currentTime.format('YYYY-MM-DD HH:mm:ss')
  });

  // TEMPORARY FIX: Always return true for testing
  // return true;
  
  // Check if the current hour is within the working hours for the given session
  let isWorking = false;
  
  switch (sessionNum) {
    case WORKING_SESSION.NIGHT:
      isWorking = currentTime.hours() >= WORKING_HOURS[WORKING_SESSION.NIGHT].start && 
                  currentTime.hours() < WORKING_HOURS[WORKING_SESSION.NIGHT].end;
      break;
    case WORKING_SESSION.DAY:
      isWorking = currentTime.hours() >= WORKING_HOURS[WORKING_SESSION.DAY].start && 
                  currentTime.hours() < WORKING_HOURS[WORKING_SESSION.DAY].end;
      break;
    case WORKING_SESSION.EVENING:
      isWorking = currentTime.hours() >= WORKING_HOURS[WORKING_SESSION.EVENING].start && 
                  currentTime.hours() < WORKING_HOURS[WORKING_SESSION.EVENING].end;
      break;
    default:
      console.warn(`Unknown session value: ${sessionNum} (original: ${session})`);
      isWorking = false;
  }
  
  console.log(`Session ${sessionNum}, hour ${currentTime.hours()}, isWorking: ${isWorking}`);
  return isWorking;
}

export const getCurrentTime = () => {
  const apiUrl = process.env.REACT_APP_API_URL || '';
  console.log('API URL:', apiUrl);
  
  if (!apiUrl) {
    // If API URL is not set, return a rejected promise to trigger the fallback
    console.warn('REACT_APP_API_URL is not set, using local time');
    return Promise.reject(new Error('REACT_APP_API_URL is not set'));
  }
  
  return axios.get(`${apiUrl}${API.TIME}`, {
    headers: {"Content-Type" : "application/json"}
  })
}