// Returns a middleware that only allows specified roles to proceed
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role '${req.user.role}' is not authorized for this action`));
    }
    next();
  };
};