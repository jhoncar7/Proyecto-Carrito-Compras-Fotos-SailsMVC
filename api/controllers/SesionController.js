/**
 * SesionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  
    registro : async (peticion, respuesta) =>{
        respuesta.view('pages/registro')
    },

    procesarRegistro : async(peticion, respuesta)=>{
        let cliente = await Cliente.findOne({email:peticion.body.email});
        if(cliente){
            peticion.addFlash('mensaje', 'Email ya existente')
            return respuesta.redirect('/registro')
        }else{ 
            let cliente = await Cliente.create({
                email : peticion.body.email,
                nombre: peticion.body.nombre,
                contrasena : peticion.body.contrasena,
                activa : true,
            })
            peticion.session.cliente = cliente;
            peticion.addFlash('mensaje','Cliente Registrado con Exito')
            return respuesta.redirect('/')
        }
    },

    iniciosesion: async(peticion,respuesta)=>{
        respuesta.view('pages/inicio_sesion')
    },

    procesarInicioSesion : async(peticion,respuesta)=>{
        let cliente = await Cliente.findOne({email:peticion.body.email, contrasena:peticion.body.contrasena})
        //console.log(cliente);
        if(cliente){
            if(cliente.activa){
                peticion.session.cliente = cliente;
                let carroCompra = await CarroCompra.find({cliente: cliente.id})
                peticion.session.carroCompra = carroCompra;
                peticion.addFlash('mensaje','Sesion iniciada')
                return respuesta.redirect('/');
            }else{
                peticion.addFlash('mensaje','Su cuenta se encuentra deshabilitada, por favor contactarse con support')
                return respuesta.redirect('/inicio-sesion')
            }
            
        }else{ 
            peticion.addFlash('mensaje','Datos Incorrectos')
            return respuesta.redirect('/inicio-sesion')
        }
    },

    cerrarSesion: async (peticion, respuesta) => {
        peticion.session.cliente = undefined;
        peticion.addFlash('mensaje', 'Sesión finalizada')
        return respuesta.redirect("/");
      },

};

 