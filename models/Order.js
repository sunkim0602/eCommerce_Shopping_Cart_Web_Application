import { DataTypes, Model } from "sequelize";
import { sequelize } from "./db.js";

export class Order extends Model {}

//When a customer submits a cart, an order is created. Admins can udpate & delete orders
Order.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: { type: DataTypes.ENUM("submitted", "updated", "cancelled"), allowNull: false, defaultValue: "submitted" }
  },
  { sequelize, modelName: "Order" }
);