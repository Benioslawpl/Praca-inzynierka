export function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function asArray(data) {
  return Array.isArray(data) ? data : [];
}

export function getErrorMessage(result, fallback) {
  return result?.data?.error || fallback;
}

export async function fetchJsonResult(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export function getUpcomingServiceAlert({
  interval,
  lastService,
  currentValue,
  warningThreshold = 20,
}) {
  const parsedInterval = Number(interval);
  const parsedLastService = Number(lastService);
  const parsedCurrentValue = Number(currentValue);

  if (
    !Number.isFinite(parsedInterval) ||
    parsedInterval <= 0 ||
    !Number.isFinite(parsedLastService) ||
    !Number.isFinite(parsedCurrentValue)
  ) {
    return null;
  }

  const nextServiceAt = parsedLastService + parsedInterval;
  const remaining = nextServiceAt - parsedCurrentValue;

  if (remaining > warningThreshold) {
    return null;
  }

  return {
    currentHours: parsedCurrentValue,
    nextServiceAt,
    remaining,
    overdue: remaining < 0,
  };
}
