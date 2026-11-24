import { describe, expect, it } from "vitest";

import { getCategoryValues } from "./category_values";

function submissions(...categoryLists: string[][]) {
  return categoryLists.map((categoryIds) => ({ categoryIds }));
}

describe("getCategoryValues", () => {
  it("gives each category its picks plus 1", () => {
    const result = getCategoryValues({
      categoryIds: ["a", "b", "c"],
      submissions: submissions(["a", "b"], ["a"], ["a", "b"]),
    });

    expect(result.values.get("b")).toEqual({
      picks: 2,
      baseValue: 3,
      value: 3,
      isTop: false,
    });
    expect(result.values.get("c")).toEqual({
      picks: 0,
      baseValue: 1,
      value: 1,
      isTop: false,
    });
  });

  it("sets the value of the only top category to 0", () => {
    const result = getCategoryValues({
      categoryIds: ["a", "b"],
      submissions: submissions(["a", "b"], ["a"], ["a"]),
    });

    expect(result.values.get("a")).toEqual({
      picks: 3,
      baseValue: 4,
      value: 0,
      isTop: true,
    });
    expect(result.topCatValue).toBe(4);
    expect(result.topCategoryIds).toEqual(["a"]);
  });

  it("divides tied top categories by the number tied, rounded down", () => {
    const result = getCategoryValues({
      categoryIds: ["a", "b", "c", "d"],
      submissions: submissions(
        ["a", "b", "c"],
        ["a", "b", "c"],
        ["a", "b", "c"],
        ["a", "b", "c", "d"],
      ),
    });

    // baseValue 5, 3 tied: floor(5 / 3) = 1
    expect(result.values.get("a")?.value).toBe(1);
    expect(result.values.get("b")?.value).toBe(1);
    expect(result.values.get("c")?.value).toBe(1);
    expect(result.values.get("d")?.value).toBe(2);
    expect(result.topCatValue).toBe(5);
    expect(result.topCategoryIds).toEqual(["a", "b", "c"]);
  });

  it("halves 2 tied top categories, rounded down", () => {
    const result = getCategoryValues({
      categoryIds: ["a", "b"],
      submissions: submissions(["a", "b"], ["a", "b"]),
    });

    // baseValue 3: floor(3 / 2) = 1
    expect(result.values.get("a")?.value).toBe(1);
    expect(result.values.get("b")?.value).toBe(1);
  });

  it("counts a category one time when a submission lists it twice", () => {
    const result = getCategoryValues({
      categoryIds: ["a", "b"],
      submissions: submissions(["a", "a"], ["b"], ["b"]),
    });

    expect(result.values.get("a")?.picks).toBe(1);
  });

  it("throws for a category the event does not offer", () => {
    expect(() =>
      getCategoryValues({
        categoryIds: ["a"],
        submissions: submissions(["z"]),
      }),
    ).toThrow(/does not offer/);
  });

  it("returns no top categories when the event has no categories", () => {
    const result = getCategoryValues({ categoryIds: [], submissions: [] });

    expect(result.topCatValue).toBe(0);
    expect(result.topCategoryIds).toEqual([]);
  });
});
