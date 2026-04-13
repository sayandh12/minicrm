/**
 * Safely extracts a user-friendly error message from various error formats.
 * Primarily handles Axios errors and FastAPI validation errors (422).
 */
export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage

  // Axios/Network error
  const response = error.response?.data
  
  if (response) {
    const detail = response.detail
    
    // FastAPI 422 Validation Error (Array of errors)
    if (Array.isArray(detail)) {
      // Pick the first error message
      return detail[0]?.msg || 'Validation error'
    }
    
    // Single string error
    if (typeof detail === 'string') {
      return detail
    }
    
    // Generic message if available
    if (response.message) {
      return response.message
    }
  }

  // Fallback to error.message (e.g. "Network Error")
  return error.message || defaultMessage
}
