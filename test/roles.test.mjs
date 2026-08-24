import assert from "node:assert/strict";
import test from "node:test";

import {
  canViewOperationalData,
  isAdminRole,
  normalizeRole,
} from "../src/lib/roles.js";

test("normalizeRole normalizes known roles", () => {
  assert.equal(normalizeRole(" ADMIN "), "admin");
  assert.equal(normalizeRole("brygadzista"), "brygadzista");
});

test("normalizeRole uses user for an unknown role", () => {
  assert.equal(normalizeRole("unknown"), "user");
  assert.equal(normalizeRole(null), "user");
});

test("only management roles can access operational data", () => {
  assert.equal(canViewOperationalData("admin"), true);
  assert.equal(canViewOperationalData("kierownik"), true);
  assert.equal(canViewOperationalData("operator"), false);
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("biuro"), false);
});
