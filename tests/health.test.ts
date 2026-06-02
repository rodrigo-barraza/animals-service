// ── Health + Auth tests for animals-service ──
// Uses createService() from service-library — tests the contract shape.

import { describe, it, expect } from "vitest";
import { HealthAggregator } from "@rodrigo-barraza/service-library/health";
import {
  createAuthMiddleware,
  createSecretGuard,
} from "@rodrigo-barraza/service-library/auth";

import { mockReq, mockRes } from "@rodrigo-barraza/utilities-library/testing";

// ── Health ─────────────────────────────────────────────────────
describe("Health", () => {
  it("returns ok status with expected shape", async () => {
    const health = new HealthAggregator("animals-service", 5616);
    const result = await health.getHealth();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("animals-service");
    expect(result.port).toBe(5616);
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it("handler returns 200 for healthy state", async () => {
    const health = new HealthAggregator("animals-service", 5616);
    const handler = health.handler();
    let statusCode, json;
    const res = {
      status(c) { statusCode = c; return this; },
      json(d) { json = d; },
    };
    await handler({}, res);
    expect(statusCode).toBe(200);
    expect(json.status).toBe("ok");
  });
});

// ── Auth ───────────────────────────────────────────────────────
describe("Auth", () => {
  it("rejects requests with wrong secret", () => {
    const guard = createSecretGuard("test-secret");
    const req = mockReq({ headers: { "x-api-secret": "wrong" } });
    const res = mockRes();
    guard(req, res, () => {});
    expect(res._status).toBe(401);
  });

  it("allows requests with correct secret", () => {
    const guard = createSecretGuard("test-secret");
    const req = mockReq({ headers: { "x-api-secret": "test-secret" } });
    let called = false;
    guard(req, mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it("bypasses /health endpoint", () => {
    const guard = createSecretGuard("test-secret");
    const req = mockReq({ path: "/health" });
    let called = false;
    guard(req, mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it("resolves project from x-project header", () => {
    const mw = createAuthMiddleware();
    const req = mockReq({ headers: { "x-project": "animals" } });
    mw(req, mockRes(), () => {});
    expect(req.project).toBe("animals");
  });
});
