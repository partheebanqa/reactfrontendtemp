/**
 * Safe Async Call Utility
 * 
 * Provides wrapper functions to ensure all async operations are properly handled
 * and prevent unhandled promise rejections throughout the application.
 */

/**
 * Wraps an async function call to prevent unhandled promise rejections
 * @param {Function} asyncFn - The async function to call
 * @param {*} fallbackValue - Value to return on error (default: null)
 * @param {boolean} logErrors - Whether to log errors (default: development only)
 * @returns {Promise} - Always resolves, never rejects
 */
export const safeAsyncCall = async (asyncFn, fallbackValue = null, logErrors = process.env.NODE_ENV === 'development') => {
  try {
    return await asyncFn();
  } catch (error) {
    if (logErrors) {
      console.error('Safe async call error:', error.message);
    }
    return fallbackValue;
  }
};

/**
 * Wraps a promise to prevent unhandled rejections
 * @param {Promise} promise - The promise to wrap
 * @param {*} fallbackValue - Value to return on error
 * @returns {Promise} - Always resolves, never rejects
 */
export const safePromise = (promise, fallbackValue = null) => {
  return promise.catch(error => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Safe promise error:', error.message);
    }
    return fallbackValue;
  });
};

/**
 * Creates a safe version of useEffect that handles async operations
 * @param {Function} effectFn - The effect function (can be async)
 * @param {Array} dependencies - useEffect dependencies
 * @param {Function} cleanup - Optional cleanup function
 */
export const useSafeEffect = (effectFn, dependencies, cleanup) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const runEffect = async () => {
      try {
        await effectFn();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Safe effect error:', error.message);
        }
      }
    };
    
    runEffect();
    
    return cleanup;
  }, dependencies);
};

export default { safeAsyncCall, safePromise, useSafeEffect };