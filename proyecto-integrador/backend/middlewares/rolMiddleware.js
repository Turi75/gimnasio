/**
 * Middleware para verificar el Rol del usuario.
 */
const verificarRol = (rolesPermitidos = []) => {
    if (typeof rolesPermitidos === 'string') {
      rolesPermitidos = [rolesPermitidos];
    }
  
    return (req, res, next) => {
      if (!req.usuario || !req.usuario.rol) {
        return res.status(401).json({ msg: 'No autenticado o rol no definido.' });
      }
  
      if (rolesPermitidos.includes(req.usuario.rol)) {
        next();
      } else {
        return res.status(403).json({ msg: 'Acceso prohibido. No tienes los permisos necesarios.' });
      }
    };
  };
  
  export default verificarRol;