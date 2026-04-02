export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function getErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
  } catch {
    // Ignore response parsing errors and fall back to the provided message.
  }

  return fallbackMessage;
}

export async function postJson(path, body, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackMessage));
  }

  return response.json();
}

export async function postFormData(path, formData, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallbackMessage));
  }

  return response.json();
}
