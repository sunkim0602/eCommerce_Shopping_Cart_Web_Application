import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

//user login with email and password and is authenticated
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return done(null, false, { message: "Invalid email or password" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: "Invalid email or password" });

      return done(null, user);
    } catch (e) {
      return done(e);
    }
  })
);

passport.serializeUser((user, done) => 
  done(null, user.id
));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id); 
    return done(null, user);
  } catch (e) {
    return done(e);
  }
});

export default passport;