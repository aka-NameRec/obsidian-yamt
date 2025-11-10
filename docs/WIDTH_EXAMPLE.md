# Width Column Example

This document demonstrates the new `width` attribute for controlling column widths in YAMT tables.

## Example 1: Fixed Width Columns

```yamt
options:
  caption: "Product Catalog with Fixed Widths"

header:
  - [ 
      { data: "ID", width: "50px", align: center }, 
      { data: "Product Name", width: "200px" }, 
      { data: "Description", width: "300px" }, 
      { data: "Price", width: "80px", align: right } 
    ]
body:
  - [ "1", "**Laptop**", "High-performance laptop for developers", "€1299" ]
  - [ "2", "**Mouse**", "Ergonomic wireless mouse", "€99" ]
  - [ "3", "**Keyboard**", "Mechanical keyboard with RGB", "€149" ]
```

## Example 2: Percentage Width Columns

```yamt
options:
  caption: "Task List with Percentage Widths"

header:
  - [ 
      { data: "Task", width: "50%" }, 
      { data: "Status", width: "20%", align: center }, 
      { data: "Priority", width: "15%", align: center }, 
      { data: "Due", width: "15%", align: center } 
    ]
body:
  - [ "Implement width feature", "✅ Done", "High", "2025-11-10" ]
  - [ "Update documentation", "✅ Done", "High", "2025-11-10" ]
  - [ "Write tests", "⏳ In Progress", "Medium", "2025-11-11" ]
```

## Example 3: Mixed Width Units

```yamt
options:
  caption: "Employee Directory"
  ariaLabel: "Employee contact information"

header:
  - [ 
      { data: "#", width: "40px", align: center }, 
      { data: "Name", width: "25%" }, 
      { data: "Email", width: "35%" }, 
      { data: "Department", width: "20%" }, 
      { data: "Ext.", width: "80px", align: center } 
    ]
body:
  - [ "1", "Alice Johnson", "alice@example.com", "Engineering", "1234" ]
  - [ "2", "Bob Smith", "bob@example.com", "Design", "1235" ]
  - [ "3", "Carol White", "carol@example.com", "Marketing", "1236" ]
```

## Example 4: Without Width (Auto Layout)

For comparison, here's the same table without width attributes:

```yamt
options:
  caption: "Auto-sized Columns"

header:
  - [ { data: "ID", align: center }, "Product", "Description", { data: "Price", align: right } ]
body:
  - [ "1", "**Laptop**", "High-performance laptop for developers", "€1299" ]
  - [ "2", "**Mouse**", "Ergonomic wireless mouse", "€99" ]
  - [ "3", "**Keyboard**", "Mechanical keyboard with RGB", "€149" ]
```

## Supported CSS Width Values

The `width` attribute accepts any valid CSS width value:

- **Pixels**: `"50px"`, `"200px"`
- **Percentages**: `"25%"`, `"50%"`, `"100%"`
- **Em units**: `"10em"`, `"20em"`
- **Rem units**: `"5rem"`, `"15rem"`
- **Auto**: `"auto"` (browser default)
- **Viewport units**: `"20vw"`, `"50vw"`

## Tips

1. **Use `width` primarily on header cells** — browsers apply header widths to the entire column
2. **Percentage widths work well for responsive layouts** — they adapt to container size
3. **Fixed widths (px) are good for ID/icon columns** — ensures consistent size
4. **Mix units as needed** — combine fixed and relative widths for best results
5. **Width is optional** — tables work fine without explicit widths (auto-sizing)

## Testing

To test this feature:

1. Enable the YAMT plugin in Obsidian
2. Create a new note
3. Copy any of the examples above into the note
4. Switch to preview mode to see the rendered table
5. Try adjusting the width values to see how the columns respond

