import assert from "node:assert/strict";
import test from "node:test";

import { getUpcomingServiceAlert } from "../src/lib/client-utils.js";

test("does not return an alert before the warning threshold", () => {
  const alert = getUpcomingServiceAlert({
    interval: 500,
    lastService: 500,
    currentValue: 970,
  });

  assert.equal(alert, null);
});

test("returns an upcoming service alert at the warning threshold", () => {
  const alert = getUpcomingServiceAlert({
    interval: 500,
    lastService: 500,
    currentValue: 980,
  });

  assert.deepEqual(alert, {
    currentHours: 980,
    nextServiceAt: 1000,
    remaining: 20,
    overdue: false,
  });
});

test("returns an overdue service alert after the due value", () => {
  const alert = getUpcomingServiceAlert({
    interval: 500,
    lastService: 500,
    currentValue: 1010,
  });

  assert.equal(alert.remaining, -10);
  assert.equal(alert.overdue, true);
});

test("returns null for incomplete service data", () => {
  assert.equal(
    getUpcomingServiceAlert({ interval: 0, lastService: 500, currentValue: 980 }),
    null
  );
});
