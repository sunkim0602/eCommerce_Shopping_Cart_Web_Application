import { DataTypes, Model } from "sequelize";
import { sequelize } from "./db.js";

export class Product extends Model {}

//defines the Product table, including inventory tracking, product page, ordering, and administration
Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stockQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  { sequelize, modelName: "Product" }
);