import { describe, expect, test } from "bun:test";
import { inferRagSourceTag } from "./rag";

describe("inferRagSourceTag", () => {
  test("routes explicit indigenous-food intent", () => {
    expect(inferRagSourceTag("indigenous pulses of Bangladesh")).toBe("indigenous");
    expect(inferRagSourceTag("দেশি ডালের পুষ্টি")).toBe("indigenous");
  });

  test("routes healthy-plate guidance intent", () => {
    expect(inferRagSourceTag("what does a healthy plate look like")).toBe("guideline");
    expect(inferRagSourceTag("ভাত ডাল মাছ দিয়ে সুষম খাবার কী")).toBe("guideline");
  });

  test("leaves ordinary food lookup unfiltered", () => {
    expect(inferRagSourceTag("calories in cooked rice")).toBeUndefined();
  });
});
