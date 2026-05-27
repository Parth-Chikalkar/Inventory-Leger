const request = require("supertest");
const { buildTestApp, makeEntry } = require("./helpers");

let app, db;

beforeEach(async () => {
  const built = await buildTestApp();
  app = built.app;
  db = built.db;
});

afterEach(() => {
  db.close();
});

describe("T1 - POST /entries valid entry", () => {
  it("creates an entry and returns 201 with correct fields", async () => {
    const res = await request(app).post("/entries").send(makeEntry());
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      warehouse_id: "WH-01",
      category: "Electronics",
      item_name: "USB Hub",
      week_number: 10,
      quantity: 50,
      unit: "units",
      recorded_by: "Alice"
    });
    expect(typeof res.body.id).toBe("number");
    expect(typeof res.body.created_at).toBe("string");
  });
});

describe("T2 - POST /entries missing required field", () => {
  it("returns 400 validation_error when warehouse_id is missing", async () => {
    const { warehouse_id, ...body } = makeEntry();
    const res = await request(app).post("/entries").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(Array.isArray(res.body.detail)).toBe(true);
    expect(res.body.detail.some(e => e.field === "warehouse_id")).toBe(true);
  });

  it("returns 400 validation_error when recorded_by is missing", async () => {
    const { recorded_by, ...body } = makeEntry();
    const res = await request(app).post("/entries").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.detail.some(e => e.field === "recorded_by")).toBe(true);
  });
});

describe("T3 - POST /entries invalid category", () => {
  it("returns 400 for unknown category", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ category: "Gadgets" }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.detail.some(e => e.field === "category")).toBe(true);
  });
});

describe("T4 - POST /entries week_number out of range", () => {
  it("returns 400 for week_number 0", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ week_number: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "week_number")).toBe(true);
  });

  it("returns 400 for week_number 53", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ week_number: 53 }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "week_number")).toBe(true);
  });
});

describe("T5 - POST /entries quantity < 0", () => {
  it("returns 400 for negative quantity", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ quantity: -1 }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "quantity")).toBe(true);
  });
});

describe("T6 - POST /entries duplicate entry", () => {
  it("returns 409 duplicate_entry on second identical post", async () => {
    await request(app).post("/entries").send(makeEntry());
    const res = await request(app).post("/entries").send(makeEntry());
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("duplicate_entry");
    expect(res.body.message).toMatch(/week 10/);
  });
});

describe("T7 - GET /entries no filters", () => {
  it("returns count and entries array", async () => {
    await request(app).post("/entries").send(makeEntry());
    await request(app).post("/entries").send(makeEntry({ item_name: "Keyboard", week_number: 11 }));
    const res = await request(app).get("/entries");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBe(2);
  });
});

describe("T8 - GET /entries filter by category", () => {
  it("returns only matching category entries", async () => {
    await request(app).post("/entries").send(makeEntry({ category: "Electronics" }));
    await request(app).post("/entries").send(makeEntry({ category: "Pharma", item_name: "Aspirin", unit: "kg" }));
    const res = await request(app).get("/entries?category=Pharma");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.entries[0].category).toBe("Pharma");
  });
});

describe("T9 - GET /entries filter by min_quantity", () => {
  it("returns only entries with quantity >= min_quantity", async () => {
    await request(app).post("/entries").send(makeEntry({ quantity: 10 }));
    await request(app).post("/entries").send(makeEntry({ item_name: "HDMI Cable", quantity: 100 }));
    const res = await request(app).get("/entries?min_quantity=50");
    expect(res.status).toBe(200);
    expect(res.body.entries.every(e => e.quantity >= 50)).toBe(true);
  });
});

describe("T10 - GET /summary aggregation correctness", () => {
  it("aggregates correctly by category and week_number", async () => {
    await request(app).post("/entries").send(makeEntry({ quantity: 30, week_number: 5, category: "Furniture", unit: "units", item_name: "Chair" }));
    await request(app).post("/entries").send(makeEntry({ quantity: 20, week_number: 5, category: "Furniture", unit: "units", item_name: "Table" }));
    const res = await request(app).get("/summary");
    expect(res.status).toBe(200);
    const row = res.body.summary.find(s => s.category === "Furniture" && s.week_number === 5);
    expect(row).toBeDefined();
    expect(row.total_quantity).toBe(50);
    expect(row.entry_count).toBe(2);
  });
});

describe("T11 - DELETE /entries/:id existing entry", () => {
  it("deletes an entry and returns 200", async () => {
    const post = await request(app).post("/entries").send(makeEntry());
    const id = post.body.id;
    const res = await request(app).delete(`/entries/${id}`);
    expect(res.status).toBe(200);
    const check = await request(app).get("/entries");
    expect(check.body.count).toBe(0);
  });
});

describe("T12 - DELETE /entries/:id non-existent entry", () => {
  it("returns 404 not_found", async () => {
    const res = await request(app).delete("/entries/99999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("not_found");
    expect(res.body.message).toMatch(/99999/);
  });
});

describe("Extra - invalid warehouse_id regex", () => {
  it("rejects lowercase warehouse_id", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ warehouse_id: "wh-01" }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "warehouse_id")).toBe(true);
  });

  it("rejects warehouse_id shorter than 2 chars", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ warehouse_id: "A" }));
    expect(res.status).toBe(400);
  });

  it("rejects warehouse_id longer than 20 chars", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ warehouse_id: "A".repeat(21) }));
    expect(res.status).toBe(400);
  });
});

describe("Extra - invalid unit", () => {
  it("rejects unknown unit", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ unit: "boxes" }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "unit")).toBe(true);
  });
});

describe("Extra - invalid types", () => {
  it("rejects string week_number", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ week_number: "ten" }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "week_number")).toBe(true);
  });

  it("rejects float quantity", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ quantity: 3.5 }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "quantity")).toBe(true);
  });
});

describe("Extra - empty strings", () => {
  it("rejects empty item_name", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ item_name: "" }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "item_name")).toBe(true);
  });

  it("rejects empty recorded_by", async () => {
    const res = await request(app).post("/entries").send(makeEntry({ recorded_by: "" }));
    expect(res.status).toBe(400);
    expect(res.body.detail.some(e => e.field === "recorded_by")).toBe(true);
  });
});

describe("Extra - summary sorting", () => {
  it("sorts summary by week_number ASC then category ASC", async () => {
    await request(app).post("/entries").send(makeEntry({ week_number: 3, category: "Textiles", item_name: "Yarn", unit: "kg" }));
    await request(app).post("/entries").send(makeEntry({ week_number: 1, category: "Pharma", item_name: "Ibuprofen", unit: "kg" }));
    await request(app).post("/entries").send(makeEntry({ week_number: 1, category: "Electronics", item_name: "Resistor" }));
    const res = await request(app).get("/summary");
    const weeks = res.body.summary.map(s => s.week_number);
    expect(weeks[0]).toBe(1);
    expect(weeks[weeks.length - 1]).toBe(3);
    const week1 = res.body.summary.filter(s => s.week_number === 1);
    expect(week1[0].category).toBe("Electronics");
    expect(week1[1].category).toBe("Pharma");
  });
});

describe("Extra - filter combinations", () => {
  it("filters by category and min_quantity together", async () => {
    await request(app).post("/entries").send(makeEntry({ category: "Chemicals", item_name: "Acetone", unit: "litres", quantity: 200, week_number: 6 }));
    await request(app).post("/entries").send(makeEntry({ category: "Chemicals", item_name: "Bleach", unit: "litres", quantity: 10, week_number: 7 }));
    await request(app).post("/entries").send(makeEntry({ category: "Electronics", item_name: "Fan", quantity: 300, week_number: 8 }));
    const res = await request(app).get("/entries?category=Chemicals&min_quantity=100");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.entries[0].item_name).toBe("Acetone");
  });
});
