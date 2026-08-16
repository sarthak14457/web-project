import supplierService from "../services/supplierService.js";

async function list(req, res, next) {
  try {
    const suppliers = await supplierService.listSuppliers();
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const supplier = await supplierService.updateSupplier(
      req.params.id,
      req.body,
    );
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const supplierController = {
  list,
  create,
  update,
  remove,
};

export default supplierController;
