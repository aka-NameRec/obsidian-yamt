import { describe, it, expect } from "vitest";
import { normalizeToModel, parseYamlAny } from "../src/lib";

describe("normalizeToModel", () => {
  it("handles header/body object", () => {
    const yaml = `
options:
  assumeFirstRowHeader: false
header:
  - [ { data: "H1" }, { data: "H2" } ]
body:
  - [ "a", "b" ]
`;
    const doc = parseYamlAny(yaml);
    const model = normalizeToModel(doc);
    expect(model.header?.length).toBe(1);
    expect(model.body?.length).toBe(1);
  });

  it("handles flat matrix via rows + assumeFirstRowHeader", () => {
    const yaml = `
options:
  assumeFirstRowHeader: true
rows:
  - [ "H1", "H2" ]
  - [ "a", "b" ]
`;
    const doc = parseYamlAny(yaml);
    const model = normalizeToModel(doc);
    expect(model.header?.length).toBe(1);
    expect(model.body?.length).toBe(1);
  });

  it("handles top-level matrix", () => {
    const yaml = `
- [ "A", "B" ]
- [ "1", "2" ]
`;
    const doc = parseYamlAny(yaml);
    const model = normalizeToModel(doc);
    expect(model.header?.length ?? 0).toBe(0);
    expect(model.body?.length).toBe(2);
  });
});