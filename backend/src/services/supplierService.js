import { Supplier, Item } from "../models/index.js";
import NotFoundError from "../errors/NotFoundError.js";

async function listSuppliers() {
  return Supplier.findAll({
    order: [["createdAt", "DESC"]],
    include: [{ model: Item, as: "products", attributes: ["id"] }],
  });
}

async function createSupplier(data) {
  return Supplier.create(data);
}

async function updateSupplier(id, data) {
  const supplier = await Supplier.findByPk(id);

  if (!supplier) {
    throw new NotFoundError("Supplier not found.");
  }

  return supplier.update(data);
}

async function deleteSupplier(id) {
  const supplier = await Supplier.findByPk(id);

  if (!supplier) {
    throw new NotFoundError("Supplier not found.");
  }

  await supplier.destroy();
}

const supplierService = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};

export default supplierService;
