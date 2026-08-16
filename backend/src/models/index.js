import { sequelize } from "../configs/database.js";
import User from "./User.js";
import Item from "./Item.js";
import Supplier from "./Supplier.js";

// Associations
User.hasMany(Item, {
  foreignKey: "createdBy",
  as: "items",
});

Item.belongsTo(User, {
  foreignKey: "createdBy",
  as: "owner",
});

Supplier.hasMany(Item, {
  foreignKey: "supplierId",
  as: "products",
});

Item.belongsTo(Supplier, {
  foreignKey: "supplierId",
  as: "supplier",
});

export { sequelize, User, Item, Supplier };
