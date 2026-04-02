import { beforeEach, describe, expect, it, vi } from "vitest";

const webVitalsMocks = vi.hoisted(() => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

vi.mock("web-vitals", () => ({
  onCLS: webVitalsMocks.onCLS,
  onFCP: webVitalsMocks.onFCP,
  onINP: webVitalsMocks.onINP,
  onLCP: webVitalsMocks.onLCP,
  onTTFB: webVitalsMocks.onTTFB,
}));

import { trackWebVitals } from "../web-vitals-tracker";

describe("trackWebVitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers web-vitals handlers and forwards the metric shape", () => {
    const handleMetric = vi.fn();

    trackWebVitals(handleMetric);

    expect(webVitalsMocks.onCLS).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onFCP).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onINP).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onLCP).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onTTFB).toHaveBeenCalledOnce();

    const reportMetric = webVitalsMocks.onLCP.mock.calls[0][0] as (metric: {
      name: "LCP";
      value: number;
      id: string;
      rating: "good" | "needs-improvement" | "poor";
      delta: number;
      navigationType: "navigate";
    }) => void;

    reportMetric({
      name: "LCP",
      value: 1234,
      id: "lcp-1",
      rating: "good",
      delta: 1234,
      navigationType: "navigate",
    });

    expect(handleMetric).toHaveBeenCalledWith({
      name: "LCP",
      value: 1234,
      id: "lcp-1",
      rating: "good",
      delta: 1234,
      navigationType: "navigate",
    });
  });
});
