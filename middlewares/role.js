
const roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.rol.nombre)) {
        return res
        .status(403)
        .json({ message: 'Access denied. Insufficient permissions.' })
    }
    next()
}

export default roleMiddleware;
