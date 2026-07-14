import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

const router = express.Router();

//helper function
const normalizeEmail = (e) => (e ?? "").toLowerCase().trim();

//registration page
router.get("/register", (req, res) => {
  res.render("register", { error: null, values: {} });
});

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, adminCode } = req.body;

    const em = normalizeEmail(email);

    //determine user role
    const chosenRole = role === "admin" ? "admin" : "customer";

    //checks whether email or password is missing
    if ( !em || !password) {
      return res.status(400).render("register", {
        error: "email and password are required.",
        values: { fullName, email }
      });
    }
    
    // prevent random people from creating admin accounts
    const ADMIN_SIGNUP_CODE = "cs602admin";
    if (chosenRole === "admin" && (adminCode ?? "") !== ADMIN_SIGNUP_CODE) {
      return res.status(403).render("register", {
        error: "Invalid admin code.",
        values: { fullName, email, role: chosenRole }
      });
    }

    //checks if email already exists
    const emailExists = await User.findOne({ where: { email: em } });
    if (emailExists) {
      return res.status(409).render("register", {
        error: "That email is already registered.",
        values: { fullName, email }
      });
    }

    //create secure password hash
    const passwordHash = await bcrypt.hash(password, 10);

    //create user in database
    await User.create({
      fullName: fullName?.trim() || null,
      email: em,
      passwordHash,
      role: chosenRole
    });

    //temporary success message
    req.session.flash = {
      type: "success",
      message: "Account created successfully. Please log in."
    };

    //Redirect to login
    return res.redirect("/login");
  } catch (e) {
    console.error(e);
    return res.status(500).render("register", {
      error: "Server error. Please try again.",
      values: req.body
    });
  }
});

export default router;