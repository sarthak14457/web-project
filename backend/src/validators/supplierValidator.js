import ValidationError from "../errors/ValidationError.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSupplier(body) {
  const { name, contactEmail } = body;
  const fields = {};

  if (!name || !name.trim()) {
    fields.name = "Supplier name is required.";
  }

  if (contactEmail && !emailRegex.test(contactEmail)) {
    fields.contactEmail = "Enter a valid email address.";
  }

  if (Object.keys(fields).length) {
    throw new ValidationError("Invalid supplier details.", fields);
  }
}

export { validateSupplier };
