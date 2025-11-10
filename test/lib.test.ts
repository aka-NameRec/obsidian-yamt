import { describe, it, expect } from "vitest";
import { normalizeToModel, parseYamlAny } from "../src/lib";
import { parseTableData, detectDelimiter, parseCSVLine, isNumber } from "../src/clipboard";
import { convertToYamt } from "../src/converters";

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

describe("clipboard parsing", () => {
  describe("detectDelimiter", () => {
    it("detects tab as delimiter", () => {
      expect(detectDelimiter("A\tB\tC")).toBe('\t');
    });

    it("detects semicolon as delimiter", () => {
      expect(detectDelimiter("A;B;C")).toBe(';');
    });

    it("defaults to comma", () => {
      expect(detectDelimiter("A,B,C")).toBe(',');
    });

    it("prefers tab over semicolon", () => {
      expect(detectDelimiter("A\tB;C")).toBe('\t');
    });
  });

  describe("parseCSVLine", () => {
    it("parses simple comma-separated values", () => {
      const result = parseCSVLine("A,B,C", ",");
      expect(result).toEqual(["A", "B", "C"]);
    });

    it("handles quoted fields with commas", () => {
      const result = parseCSVLine('A,"B,C",D', ",");
      expect(result).toEqual(["A", "B,C", "D"]);
    });

    it("handles escaped quotes inside quoted fields", () => {
      const result = parseCSVLine('A,"B""C",D', ",");
      expect(result).toEqual(["A", 'B"C', "D"]);
    });

    it("handles semicolon delimiter", () => {
      const result = parseCSVLine("A;B;C", ";");
      expect(result).toEqual(["A", "B", "C"]);
    });

    it("handles empty fields", () => {
      const result = parseCSVLine("A,,C", ",");
      expect(result).toEqual(["A", "", "C"]);
    });
  });

  describe("parseTableData", () => {
    it("parses tab-separated values (Excel format)", () => {
      const input = "A\tB\tC\n1\t2\t3";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });

    it("parses comma-separated values", () => {
      const input = "A,B,C\n1,2,3";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });

    it("parses semicolon-separated values", () => {
      const input = "A;B;C\n1;2;3";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });

    it("handles CSV with quoted fields", () => {
      const input = 'A,"B,C",D\n1,2,3';
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B,C", "D"], ["1", "2", "3"]]);
    });

    it("trims whitespace from cells", () => {
      const input = " A , B , C \n 1 , 2 , 3 ";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });

    it("skips empty lines", () => {
      const input = "A,B,C\n\n1,2,3\n\n";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });

    it("handles Windows line endings", () => {
      const input = "A,B,C\r\n1,2,3\r\n";
      const result = parseTableData(input);
      expect(result).toEqual([["A", "B", "C"], ["1", "2", "3"]]);
    });
  });

  describe("isNumber", () => {
    it("recognizes integers", () => {
      expect(isNumber("123")).toBe(true);
      expect(isNumber("0")).toBe(true);
    });

    it("recognizes negative numbers", () => {
      expect(isNumber("-123")).toBe(true);
      expect(isNumber("-0")).toBe(true);
    });

    it("recognizes decimals with period", () => {
      expect(isNumber("123.45")).toBe(true);
      expect(isNumber("0.5")).toBe(true);
    });

    it("recognizes decimals with comma (European format)", () => {
      expect(isNumber("123,45")).toBe(true);
      expect(isNumber("0,5")).toBe(true);
    });

    it("rejects non-numbers", () => {
      expect(isNumber("abc")).toBe(false);
      expect(isNumber("12a")).toBe(false);
      expect(isNumber("")).toBe(false);
      expect(isNumber("  ")).toBe(false);
    });

    it("handles numbers with spaces", () => {
      expect(isNumber(" 123 ")).toBe(true);
      expect(isNumber("1 234")).toBe(true);
    });
  });
});

describe("YAMT conversion", () => {
  describe("convertToYamt - simple tables", () => {
    it("converts simple table with header", () => {
      const rows = [["A", "B"], ["1", "2"]];
      const result = convertToYamt(rows, true);
      
      expect(result).toContain("```yamt");
      expect(result).toContain("header:");
      expect(result).toContain('- [ "A", "B" ]');
      expect(result).toContain("body:");
      expect(result).toContain('{ data: "1", align: right }');
      expect(result).toContain('{ data: "2", align: right }');
      expect(result).toContain("```");
    });

    it("converts simple table without header", () => {
      const rows = [["A", "B"], ["1", "2"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain("```yamt");
      expect(result).toContain("body:");
      expect(result).not.toContain("header:");
      expect(result).toContain('- [ "A", "B" ]');
      expect(result).toContain("```");
    });

    it("formats numbers with right alignment", () => {
      const rows = [["Text", "123"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain('"Text"');
      expect(result).toContain('{ data: "123", align: right }');
    });

    it("handles empty cells", () => {
      const rows = [["A", "", "C"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain('""');
    });
  });

  describe("convertToYamt - multiline cells", () => {
    it("uses YAML literal style for multiline cells", () => {
      const rows = [["A", "B\nC\nD", "E"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain("data: |");
      expect(result).toContain("        B");
      expect(result).toContain("        C");
      expect(result).toContain("        D");
    });

    it("mixes simple and multiline cells in same row", () => {
      const rows = [["Simple", "Multi\nLine", "123"]];
      const result = convertToYamt(rows, false);
      
      // Simple cells in inline format
      expect(result).toContain('"Simple"');
      expect(result).toContain('{ data: "123", align: right }');
      // Multiline cell with literal style
      expect(result).toContain("data: |");
      expect(result).toContain("        Multi");
      expect(result).toContain("        Line");
    });

    it("preserves empty lines in multiline cells", () => {
      const rows = [["Line1\n\nLine3"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain("        Line1");
      expect(result).toContain("        "); // Empty line preserved
      expect(result).toContain("        Line3");
    });

    it("adds right alignment for multiline numeric cells", () => {
      const rows = [["100\n200\n300"]];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain("data: |");
      expect(result).toContain(", align: right");
    });

    it("handles table with header and multiline body", () => {
      const rows = [
        ["ID", "Description"],
        ["1", "Line 1\nLine 2"]
      ];
      const result = convertToYamt(rows, true);
      
      expect(result).toContain("header:");
      expect(result).toContain('- [ "ID", "Description" ]');
      expect(result).toContain("body:");
      expect(result).toContain("data: |");
      expect(result).toContain("        Line 1");
      expect(result).toContain("        Line 2");
    });
  });

  describe("convertToYamt - special characters", () => {
    it("escapes quotes in simple cells", () => {
      const rows = [['Text with "quotes"']];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain('\\"');
    });

    it("escapes backslashes in simple cells", () => {
      const rows = [['Path\\to\\file']];
      const result = convertToYamt(rows, false);
      
      expect(result).toContain('\\\\');
    });

    it("handles special characters in multiline cells", () => {
      const rows = [['Line with "quotes"\nAnd \\backslash']];
      const result = convertToYamt(rows, false);
      
      // In literal style, no escaping needed
      expect(result).toContain('Line with "quotes"');
      expect(result).toContain('And \\backslash');
    });
  });
});