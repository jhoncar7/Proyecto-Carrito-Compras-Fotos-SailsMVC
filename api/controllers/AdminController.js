/**
 * PrincipalController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const path = require('path');
const fs = require('fs');

module.exports = {

    inicioSesion: async (peticion, respuesta) => {
        respuesta.view('pages/admin/inicio_sesion')
    },

    procesarInicioSesion: async (peticion, respuesta) => {
        let admin = await Admin.findOne({ email: peticion.body.email, contrasena: peticion.body.contrasena })
        //console.log(admin);
        if (admin) {
            if (admin.activa) {
                peticion.session.admin = admin
                peticion.session.cliente = undefined
                peticion.addFlash('mensaje', 'Sesión de admin iniciada')
                return respuesta.redirect("/admin/principal")
            } else {
                peticion.addFlash('mensaje', 'Su cuenta se encuentra deshabilitada, por favor contactarse con support')
                return respuesta.redirect('/admin/inicio-sesion')
            }

        }
        else {
            peticion.addFlash('mensaje', 'Email o contraseña invalidos')
            return respuesta.redirect("/admin/inicio-sesion");
        }
    },

    principal: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let fotos = await Foto.find()
        respuesta.view('pages/admin/principal', { fotos })
    },

    cerrarSesion: async (peticion, respuesta) => {
        peticion.session.admin = undefined
        peticion.addFlash('mensaje', 'Sesión finalizada')
        return respuesta.redirect("/");
    },

    agregarFoto: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        respuesta.view('pages/admin/agregarFoto')
    },

    procesarAgregarFoto: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let foto = await Foto.create({
            titulo: peticion.body.titulo,
            activa: false
        }).fetch() // fetch() me retorna la foto que se creo
        peticion.file('foto').upload({}, async (error, archivos) => {
            if (archivos && archivos[0]) {
                let upload_path = archivos[0].fd
                let ext = path.extname(upload_path)

                await fs.createReadStream(upload_path).pipe(fs.createWriteStream(path.resolve(sails.config.appPath, `assets/images/fotos/${foto.id}${ext}`)))
                await Foto.update({ id: foto.id }, { contenido: `${foto.id}${ext}`, activa: true })
                peticion.addFlash('mensaje', 'Foto agregada')
                return respuesta.redirect("/admin/principal")
            }

            peticion.addFlash('mensaje', 'No hay foto seleccionada')
            return respuesta.redirect("/admin/agregar-foto")

        })

    },

    desactivarFoto: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        await Foto.update({ id: peticion.params.fotoId }, { activa: false })
        peticion.addFlash('mensaje', 'Foto desactivada')
        return respuesta.redirect("/admin/principal")
    },

    activarFoto: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        await Foto.update({ id: peticion.params.fotoId }, { activa: true })
        peticion.addFlash('mensaje', 'Foto activada')
        return respuesta.redirect("/admin/principal")
    },

    clientes: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let clientes = await Cliente.find();
        //console.log('clientes: ', clientes);
        respuesta.view('pages/admin/clientes', { clientes })
    },

    desactivarCliente: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('cliente id : ', peticion.params.clienteId);
        await Cliente.update({ id: peticion.params.clienteId }, { activa: false })
        peticion.addFlash('mensaje', 'Cliente desactivado')
        return respuesta.redirect("/admin/clientes")
    },

    activarCliente: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('cliente id : ', peticion.params.clienteId);
        await Cliente.update({ id: peticion.params.clienteId }, { activa: true })
        peticion.addFlash('mensaje', 'Cliente activado')
        return respuesta.redirect("/admin/clientes")
    },

    ordenesPorCliente: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('cliente id : ', peticion.params.clienteId);
        let ordenes = await Orden.find({ cliente: peticion.params.clienteId }).sort('id asc')
        //console.log('ordenes : ', ordenes);
        respuesta.view('pages/mis_ordenes', { ordenes })
    },

    ordenDeCompraPorCliente: async (peticion, respuesta) => {

        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('clienteId: ',peticion.params.clienteId);
        //console.log('clienteId: ',peticion.params.ordenId);
        let orden = await Orden.findOne({ cliente: peticion.params.clienteId, id: peticion.params.ordenId }).populate('detalles')
        //console.log(orden);

        if (!orden) {
            return respuesta.redirect("/admin/clientes")
        }

        if (orden && orden.detalles == 0) {
            return respuesta.redirect(`/admin/ordenes-cliente/${peticion.params.clienteId}`)
        }

        orden.detalles = await OrdenDetalle.find({ orden: orden.id }).populate('foto')
        return respuesta.view('pages/orden', { orden })
    },

    administradores: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        let administradores = await Admin.find();
        //console.log('administradores: ', administradores);
        respuesta.view('pages/admin/administradores', { administradores })
    },

    desactivarAdmin: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('admin id : ', peticion.session.admin.id);
        //console.log('parametro   : ', peticion.params.adminId);
        if (peticion.session.admin.id == peticion.params.adminId) {
            peticion.addFlash('mensaje', 'No puede deshabilitar su mismo usuario')
            return respuesta.redirect('/admin/administradores')
        }
        await Admin.update({ id: peticion.params.adminId }, { activa: false })
        peticion.addFlash('mensaje', 'Administrador desactivado')
        return respuesta.redirect("/admin/administradores")
    },

    activarAdmin: async (peticion, respuesta) => {
        if (!peticion.session || !peticion.session.admin) {
            peticion.addFlash('mensaje', 'Sesión inválida')
            return respuesta.redirect("/admin/inicio-sesion")
        }
        //console.log('admin id : ', peticion.params.adminId);
        await Admin.update({ id: peticion.params.adminId }, { activa: true })
        peticion.addFlash('mensaje', 'Administrador activado')
        return respuesta.redirect("/admin/administradores")
    },

    dashboard : async (peticion, respuesta) =>{
        //let clientes = await Cliente.find().length;
        //let administradores = await Admin.find().length;
        //let fotos = await Foto.find().length;

        
        //return respuesta.redirect("/admin/administradores")

        //let clientes = `SELECT count(id) from cliente`
        //let administradores = `SELECT count(id) from admin`
        //let fotos = `SELECT count(id) from foto`
    
        let clientes = await sails.sendNativeQuery(`SELECT count(id) as cantidad from cliente`, [])
        let administradores = await sails.sendNativeQuery(`SELECT count(id) as cantidad from admin`, [])
        let fotos = await sails.sendNativeQuery(`SELECT count(id) as cantidad from foto`, [])
        let orden = await sails.sendNativeQuery(`SELECT count(id) as cantidad from orden`, [])
        clientes = clientes.rows[0];
        administradores = administradores.rows[0];
        fotos = fotos.rows[0];
        orden = orden.rows[0];
        /* console.log('clientes: ', clientes);
        console.log('administradores: ', administradores);
        console.log('fotos: ', fotos);
        console.log('orden: ', orden); */
    
        respuesta.view("pages/admin/dashboard", {clientes, administradores, fotos, orden})
    }
};

