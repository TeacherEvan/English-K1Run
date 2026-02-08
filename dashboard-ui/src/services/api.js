const API_URL = 'http://localhost:4141/api';

export const fetchTestRuns = async () => {
  try {
    const response = await fetch(`${API_URL}/test-runs`);
    if (!response.ok) throw new Error('Failed to fetch test runs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching test runs:', error);
    throw error;
  }
};

export const fetchTestRunDetails = async (filename) => {
  try {
    const response = await fetch(`${API_URL}/test-runs/${filename}`);
    if (!response.ok) throw new Error('Failed to fetch test details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching test details:', error);
    throw error;
  }
};
