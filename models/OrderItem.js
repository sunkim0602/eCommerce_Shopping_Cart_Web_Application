import { DataTypes, Model } from "sequelize";
import { sequelize } from "./db.js";

export class OrderItem extends Model {}

//line items in an order, linking products to orders and storing quantity and pricing
OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
  },
  { sequelize, modelName: "OrderItem" }
);