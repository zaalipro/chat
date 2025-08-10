import axios from 'axios'

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

export function sortConversationByDateCreated(conversation1, conversation2) {

  const lastMessage1 = conversation1.messages[0]
  const lastMessage2 = conversation2.messages[0]

  if (!lastMessage1 || !lastMessage2) {
    return 0
  }

  const date1 = new Date(lastMessage1.createdAt).getTime()
  const date2 = new Date(lastMessage2.createdAt).getTime()
  if (date1 > date2) {
    return -1
  }
  if (date1 < date2) {
    return 1
  }
  return 0

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
  switch (session) {
    case 1:
      return currentTime.hours() >= 0 && currentTime.hours() < 8
    case 2:
      return currentTime.hours() >= 8 && currentTime.hours() < 16
    case 3:
      return currentTime.hours() >= 16 && currentTime.hours() < 24
    default:
      return "non existing"
  }
}

export const getCurrentTime = () => {
  return axios.get(process.env.REACT_APP_API_URL + '/api/time', {
    headers: {"Content-Type" : "application/json"}
  })
}

/**
 * Detects the client's IP address using a third-party service
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<string|null>} - IP address string or null on failure
 */
export const detectIPAddress = async (timeout = 3000) => {
  try {
    const response = await axios.get(process.env.REACT_APP_IPIFY_URL, {
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Validate response structure
    if (!response.data || typeof response.data.ip !== 'string') {
      console.error('IP detection failed: Invalid response format', response.data)
      return null
    }

    // Basic IP address validation (IPv4 or IPv6)
    const ipAddress = response.data.ip.trim()
    if (!ipAddress) {
      console.error('IP detection failed: Empty IP address received')
      return null
    }

    return ipAddress
  } catch (error) {
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      console.error('IP detection failed: Request timeout after', timeout, 'ms')
    } else if (error.response) {
      console.error('IP detection failed: HTTP error', error.response.status, error.response.statusText)
    } else if (error.request) {
      console.error('IP detection failed: Network error - no response received')
    } else {
      console.error('IP detection failed: Unexpected error', error.message)
    }
    
    return null
  }
}