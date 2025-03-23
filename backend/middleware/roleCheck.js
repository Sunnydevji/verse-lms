const checkRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - No user found' 
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Restricted access - ${req.user.role} not authorized` 
        });
      }
      
      next();
    };
  };
  
  module.exports = { checkRole };