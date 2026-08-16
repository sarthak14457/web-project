import { Item, Supplier } from "../models/index.js";
import NotFoundError from "../errors/NotFoundError.js";

async function listItems() {
  return Item.findAll({
    order: [["createdAt", "DESC"]],
    include: [
      { model: Supplier, as: "supplier", attributes: ["id", "name"] },
    ],
  });
}

// A supplier <select> with a "no supplier" option posts an empty string,
// which Sequelize can't cast to an integer FK, so normalize it to null.
function normalizeSupplierId(data) {
  if (!("supplierId" in data)) return data;
  const value = data.supplierId;
  if (value === "" || value === null) {
    return { ...data, supplierId: null };
  }
  return { ...data, supplierId: Number(value) };
}

async function createItem(data, userId) {
  return Item.create({
    ...normalizeSupplierId(data),
    createdBy: userId,
  });
}

async function updateItem(id, data) {
  const item = await Item.findByPk(id);

  if (!item) {
    throw new NotFoundError("Item not found.");
  }

  return item.update(normalizeSupplierId(data));
}

async function deleteItem(id) {
  const item = await Item.findByPk(id);

  if (!item) {
    throw new NotFoundError("Item not found.");
  }

  await item.destroy();
}

const itemService = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};

export default itemService;
