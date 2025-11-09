import axios from 'axios'
import { CONTRACT_STATUS } from './constants/chatStatus'

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
    return Math.round(elapsed / msPerMinute) + ' min ago';
  }

  else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + ' h ago';
  }

  else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + ' days ago';
  }

  else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + ' mo ago';
  }

  else {
    return Math.round(elapsed / msPerYear) + ' years ago';
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
  return axios.get(import.meta.env.VITE_API_URL + '/api/time', {
    headers: { "Content-Type": "application/json" }
  })
}

/**
 * Maps UTC hour to session number based on time zones
 * @param {number} utcHour - UTC hour (0-23)
 * @returns {number} - Session number (1, 2, or 3)
 */
export const getSessionForTime = (utcHour) => {
  if (utcHour >= 0 && utcHour < 8) {
    return 1 // Asian time zone (00:00-08:00 UTC)
  } else if (utcHour >= 8 && utcHour < 16) {
    return 2 // European time zone (08:00-16:00 UTC)
  } else if (utcHour >= 16 && utcHour < 24) {
    return 3 // American time zone (16:00-24:00 UTC)
  } else {
    // Invalid hour, default to session 1
    return 1
  }
}

/**
 * Gets the current session based on UTC time from API or fallback to local time
 * @returns {Promise<number>} - Promise that resolves to session number (1, 2, or 3)
 */
export const getCurrentSession = async () => {
  try {
    const response = await getCurrentTime()
    const utcTime = new Date(response.data)
    const utcHour = utcTime.getUTCHours()
    return getSessionForTime(utcHour)
  } catch (error) {
    // Fallback to local browser time converted to UTC
    console.warn('Failed to get time from API, falling back to local time:', error.message)
    const localTime = new Date()
    const utcHour = localTime.getUTCHours()
    return getSessionForTime(utcHour)
  }
}

/**
 * Filters contracts to only include those with active status
 * @param {Array} contracts - Array of contract objects
 * @returns {Array} - Array of active contracts
 */
export const filterActiveContracts = (contracts) => {
  if (!Array.isArray(contracts)) {
    return []
  }

  return contracts.filter(contract => {
    return contract &&
      contract.status === CONTRACT_STATUS.ACTIVE &&
      contract.id &&
      typeof contract.session === 'number'
  })
}

/**
 * Filters contracts by session number
 * @param {Array} contracts - Array of contract objects
 * @param {number} session - Session number (1, 2, or 3)
 * @returns {Array} - Array of contracts matching the session
 */
export const getContractsForSession = (contracts, session) => {
  if (!Array.isArray(contracts) || typeof session !== 'number') {
    return []
  }

  return contracts.filter(contract => {
    return contract && contract.session === session
  })
}

/**
 * Selects the first available contract from a list (for backward compatibility)
 * @param {Array} contracts - Array of contract objects
 * @returns {Object|null} - First contract or null if none available
 */
export const selectContract = (contracts) => {
  if (!Array.isArray(contracts) || contracts.length === 0) {
    return null
  }

  return contracts[0]
}

/**
 * Selects all contracts from a list (for multi-chat creation)
 * @param {Array} contracts - Array of contract objects
 * @returns {Array} - Array of all contracts or empty array if none available
 */
export const selectAllContracts = (contracts) => {
  if (!Array.isArray(contracts)) {
    return []
  }

  return contracts.filter(contract => contract && contract.id)
}

/**
 * Gets all active contracts for the current session
 * @param {string} websiteId - Website ID to fetch contracts for
 * @returns {Promise<Array>} - Promise that resolves to array of active contracts for current session
 */
export const getActiveContractsForCurrentSession = async (websiteId) => {
  try {
    if (!websiteId) {
      console.warn('No websiteId provided for getting active contracts')
      return []
    }

    // This function would need to be called from a component with Apollo Client access
    // We'll implement the actual fetching in the component
    const currentSession = await getCurrentSession()
    return { currentSession, websiteId }

  } catch (error) {
    console.error('Failed to get active contracts for current session:', error)
    return []
  }
}

/**
 * Processes contracts to get active contracts for current session
 * @param {Array} allContracts - Array of all contracts from GraphQL
 * @returns {Promise<Array>} - Promise that resolves to array of active contracts for current session
 */
export const processContractsForCurrentSession = async (allContracts) => {
  try {
    if (!Array.isArray(allContracts)) {
      return []
    }

    const currentSession = await getCurrentSession()
    const activeContracts = filterActiveContracts(allContracts)
    const sessionContracts = getContractsForSession(activeContracts, currentSession)

    console.log(`Processed ${sessionContracts.length} active contracts for session ${currentSession}`)
    return sessionContracts

  } catch (error) {
    console.error('Failed to process contracts for current session:', error)
    return []
  }
}

/**
 * Creates timeout handlers for chat miss management with comprehensive cleanup
 * @param {Array} chats - Array of chat objects with contractId and chatMissTime
 * @param {Function} onChatMissed - Callback function when chat times out
 * @returns {Object} - Object containing timeouts and cleanup functions
 */
export const createChatTimeouts = (chats, onChatMissed) => {
  const timeouts = {}

  // Handle null/undefined or invalid chats array
  if (!Array.isArray(chats)) {
    console.warn('createChatTimeouts: chats parameter is not an array, returning empty timeout manager')
    return {
      timeouts,
      clearAll: () => {},
      clear: () => false,
      getActiveCount: () => 0,
      getTimeoutInfo: () => null,
      getAllTimeouts: () => ({})
    }
  }

  chats.forEach(chat => {
    if (chat.contract && chat.contract.chatMissTime > 0) {
      const timeoutId = setTimeout(() => {
        console.log(`Chat ${chat.id} missed after ${chat.contract.chatMissTime} seconds`)
        
        // Execute the callback
        try {
          onChatMissed(chat.id, chat.contract.id)
        } catch (error) {
          console.error(`Error executing onChatMissed for chat ${chat.id}:`, error)
        }
        
        // Clean up the timeout object after execution
        delete timeouts[chat.id]
        console.log(`Timeout for chat ${chat.id} cleaned up after execution`)
      }, chat.contract.chatMissTime * 1000) // Convert seconds to milliseconds

      timeouts[chat.id] = {
        timeoutId,
        contractId: chat.contract.id,
        missTime: chat.contract.chatMissTime,
        clear: () => {
          if (timeouts[chat.id] && timeouts[chat.id].timeoutId) {
            clearTimeout(timeouts[chat.id].timeoutId)
            delete timeouts[chat.id]
            console.log(`Timeout for chat ${chat.id} manually cleared`)
          }
        },
        isActive: () => {
          return timeouts[chat.id] && timeouts[chat.id].timeoutId !== null
        }
      }
    }
  })

  // Return comprehensive timeout management object
  return {
    timeouts,
    clearAll: () => {
      Object.keys(timeouts).forEach(chatId => {
        if (timeouts[chatId] && timeouts[chatId].timeoutId) {
          clearTimeout(timeouts[chatId].timeoutId)
          console.log(`Cleared timeout for chat ${chatId}`)
        }
      })
      Object.keys(timeouts).forEach(chatId => delete timeouts[chatId])
      console.log('All chat timeouts cleared')
    },
    clear: (chatId) => {
      if (timeouts[chatId] && timeouts[chatId].timeoutId) {
        clearTimeout(timeouts[chatId].timeoutId)
        delete timeouts[chatId]
        console.log(`Timeout for chat ${chatId} cleared`)
        return true
      }
      return false
    },
    getActiveCount: () => {
      return Object.keys(timeouts).filter(chatId => timeouts[chatId] && timeouts[chatId].timeoutId !== null).length
    },
    getTimeoutInfo: (chatId) => {
      return timeouts[chatId] || null
    },
    getAllTimeouts: () => {
      return { ...timeouts }
    }
  }
}

/**
 * Clears all chat timeouts (legacy function for backward compatibility)
 * @param {Object} timeouts - Object mapping chatId to timeout info
 */
export const clearChatTimeouts = (timeouts) => {
  if (!timeouts || typeof timeouts !== 'object') {
    console.warn('Invalid timeouts object provided to clearChatTimeouts')
    return
  }

  Object.values(timeouts).forEach(timeout => {
    if (timeout && timeout.timeoutId) {
      clearTimeout(timeout.timeoutId)
    }
  })
  
  // Clear the object references
  Object.keys(timeouts).forEach(key => delete timeouts[key])
  console.log('Legacy clearChatTimeouts: All timeouts cleared')
}

/**
 * Clears a specific chat timeout (legacy function for backward compatibility)
 * @param {Object} timeouts - Object mapping chatId to timeout info
 * @param {string} chatId - Chat ID to clear timeout for
 */
export const clearChatTimeout = (timeouts, chatId) => {
  if (!timeouts || typeof timeouts !== 'object' || !chatId) {
    console.warn('Invalid parameters provided to clearChatTimeout')
    return
  }

  if (timeouts[chatId] && timeouts[chatId].timeoutId) {
    clearTimeout(timeouts[chatId].timeoutId)
    delete timeouts[chatId]
    console.log(`Legacy clearChatTimeout: Timeout for chat ${chatId} cleared`)
  }
}

/**
 * Detects the client's IP address using a third-party service
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 * @returns {Promise<string|null>} - IP address string or null on failure
 */
export const detectIPAddress = async (timeout = 3000) => {
  try {
    const response = await axios.get(import.meta.env.VITE_IPIFY_URL, {
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