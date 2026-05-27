const VALID_CATEGORIES = ["Electronics", "Textiles", "Chemicals", "Furniture", "Pharma"];
const VALID_UNITS = ["units", "kg", "litres"];
const WAREHOUSE_REGEX = /^[A-Z0-9-]{2,20}$/;

function validateEntry(body) {
  const errors = [];

  if (!body.warehouse_id && body.warehouse_id !== 0) {
    errors.push({ field: "warehouse_id", message: "is required" });
  } else if (typeof body.warehouse_id !== "string" || body.warehouse_id.trim() === "") {
    errors.push({ field: "warehouse_id", message: "must be a non-empty string" });
  } else if (!WAREHOUSE_REGEX.test(body.warehouse_id)) {
    errors.push({ field: "warehouse_id", message: "must be 2–20 characters, only A-Z, 0-9, or hyphens" });
  }

  if (!body.category && body.category !== 0) {
    errors.push({ field: "category", message: "is required" });
  } else if (!VALID_CATEGORIES.includes(body.category)) {
    errors.push({ field: "category", message: `must be one of: ${VALID_CATEGORIES.join(", ")}` });
  }

  if (!body.item_name && body.item_name !== 0) {
    errors.push({ field: "item_name", message: "is required" });
  } else if (typeof body.item_name !== "string" || body.item_name.trim() === "") {
    errors.push({ field: "item_name", message: "must be a non-empty string" });
  } else if (body.item_name.length > 100) {
    errors.push({ field: "item_name", message: "must be at most 100 characters" });
  }

  if (body.week_number === undefined || body.week_number === null || body.week_number === "") {
    errors.push({ field: "week_number", message: "is required" });
  } else if (!Number.isInteger(body.week_number)) {
    errors.push({ field: "week_number", message: "must be an integer" });
  } else if (body.week_number < 1 || body.week_number > 52) {
    errors.push({ field: "week_number", message: "must be between 1 and 52" });
  }

  if (body.quantity === undefined || body.quantity === null || body.quantity === "") {
    errors.push({ field: "quantity", message: "is required" });
  } else if (!Number.isInteger(body.quantity)) {
    errors.push({ field: "quantity", message: "must be an integer" });
  } else if (body.quantity < 0) {
    errors.push({ field: "quantity", message: "must be >= 0" });
  }

  if (!body.unit && body.unit !== 0) {
    errors.push({ field: "unit", message: "is required" });
  } else if (!VALID_UNITS.includes(body.unit)) {
    errors.push({ field: "unit", message: `must be one of: ${VALID_UNITS.join(", ")}` });
  }

  if (!body.recorded_by && body.recorded_by !== 0) {
    errors.push({ field: "recorded_by", message: "is required" });
  } else if (typeof body.recorded_by !== "string" || body.recorded_by.trim() === "") {
    errors.push({ field: "recorded_by", message: "must be a non-empty string" });
  } else if (body.recorded_by.length > 80) {
    errors.push({ field: "recorded_by", message: "must be at most 80 characters" });
  }

  return errors;
}

module.exports = { validateEntry, VALID_CATEGORIES, VALID_UNITS };
