import { describe, expect, test } from "bun:test";
import { unsourcedNumbers } from "./numbers";

describe("unsourcedNumbers", () => {
  test("passes when the number appears in a source", () => {
    expect(
      unsourcedNumbers("You need about 1,850 kcal a day.", [
        "Estimated needs: 1,850 kcal daily.",
      ]),
    ).toEqual([]);
  });

  test("flags a number absent from every source", () => {
    expect(
      unsourcedNumbers("You need 1,900 kcal.", ["Needs are 1,850 kcal."]),
    ).toEqual(["1900"]);
  });

  test("digit boundary: 5 does not match inside 15", () => {
    expect(unsourcedNumbers("Get 5 g more.", ["About 15 g."])).toEqual(["5"]);
  });

  test("list markers and citation chips are not numbers", () => {
    expect(
      unsourcedNumbers("1. Eat bhat\n2. Sleep well\nSee [1] and [2].", []),
    ).toEqual([]);
  });

  test("Bangla digits match Latin source digits", () => {
    expect(unsourcedNumbers("প্রায় ২৩৫ ক্যালরি।", ["মোট 235 kcal।"])).toEqual([]);
  });

  test("decimal must match the full value", () => {
    expect(
      unsourcedNumbers("Aim for 1.5 g/kg.", ["Guideline: 1.6 to 2.2 g/kg."]),
    ).toEqual(["1.5"]);
    expect(
      unsourcedNumbers("Aim for 1.6 g/kg.", ["Guideline: 1.6 to 2.2 g/kg."]),
    ).toEqual([]);
  });

  test("range, percent and slash pairs are checked token by token", () => {
    expect(
      unsourcedNumbers("Keep it 60/40 and under 15%.", [
        "Split 60/40; sugar under 15%.",
      ]),
    ).toEqual([]);
    expect(unsourcedNumbers("Try 70/30.", ["Split 60/40."])).toEqual([
      "70",
      "30",
    ]);
  });

  test("dedupes repeated offenders", () => {
    expect(
      unsourcedNumbers("1,900 then 1900 again.", ["no numbers here"]),
    ).toEqual(["1900"]);
  });

  test("empty sources flag every number", () => {
    expect(unsourcedNumbers("About 2,000 kcal.", [])).toEqual(["2000"]);
  });

  test("clean prose passes", () => {
    expect(
      unsourcedNumbers("Eat bhat, dal and mach; rest well.", ["anything"]),
    ).toEqual([]);
  });
});
