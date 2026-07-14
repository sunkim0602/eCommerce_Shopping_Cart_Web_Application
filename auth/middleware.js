//checks user is logged in before access
export function ensureAuth(req, res, next) {
  if (req.isAuthenticated?.() && req.user) return next();
  return res.redirect("/login");
}
//provide admin access by checking the user's role
export function ensureAdmin(req, res, next) {
  if (req.isAuthenticated?.() && req.user?.role === "admin") return next();
  return res.status(403).send("Forbidden (admin only)");
}