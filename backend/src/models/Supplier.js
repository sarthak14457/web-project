import { DataTypes } from "sequelize";
import { sequelize } from "../configs/database.js";

const Supplier = sequelize.define(
  "Supplier",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "suppliers",
    timestamps: true,
  },
);

export default Supplier;
