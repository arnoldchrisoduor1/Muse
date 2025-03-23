// utils/dateUtils.js

/**
 * Formats the time difference between a given timestamp and the current time
 * @param {string} updatedAtStr - ISO timestamp string (e.g., "2025-03-22T22:02:52.435199Z")
 * @returns {string} Formatted time difference (e.g., "1 sec", "2 days", "3 weeks")
 */
export function formatTimeDifference(updatedAtStr) {
    // Parse the ISO timestamp string
    const updatedAt = new Date(updatedAtStr);
    const now = new Date();
    
    // Calculate time difference in milliseconds
    const diffMs = now - updatedAt;
    
    // Convert to different time units
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // Return appropriate formatted string based on the difference
    if (diffSeconds < 60) {
      return `${diffSeconds} ${diffSeconds === 1 ? 'sec' : 'secs'}`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'}`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'}`;
    } else if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'}`;
    } else {
      return `${diffYears} ${diffYears === 1 ? 'year' : 'years'}`;
    }
  }
  
