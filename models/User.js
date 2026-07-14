//define users with authentication fields and authorization
import { DataTypes, Model } from "sequelize";
import { sequelize } from "./db.js";

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("customer", "admin"), allowNull: false, defaultValue: "customer" },
    fullName: { type: DataTypes.STRING, allowNull: false }
  },
  { sequelize, modelName: "User" }
);