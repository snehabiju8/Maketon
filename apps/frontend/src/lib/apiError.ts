import axios from 'axios';

/** Extracts a user-facing message from an API error response. */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Your session has expired or you are not signed in.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (!error.response) return 'Cannot reach the server. Check that the backend is running.';
  }
  return 'Something went wrong. Please try again.';
};
