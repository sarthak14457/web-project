import { sequelize } from "../models/index.js";

async function syncDb() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");
  } catch (err) {
    console.error("Failed to sync database:", err);
  } finally {
    await sequelize.close();
  }
}

syncDb();
