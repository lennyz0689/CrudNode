  // Librerias y dependencias
  const http = require('http');
  const express = require('express');
  const { Sequelize, DataTypes } = require('sequelize');
  const path = require('path');
  const regexNumeroDocumento = /^[0-9]+$/;
  const regexTelefono = /^[0-9]+$/;


  const app = express();

  // Configuración de Sequelize
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db/universidad.db', // Ruta a tu archivo de base de datos SQLite
    logging: false // Desactiva los logs de Sequelize
  });

  // Definición de los modelos
  const usuarios = sequelize.define('usuarios', {
    Id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Apellido: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    NumeroDocumento: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Telefono: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    timestamps: false // Desactiva las columnas createdAt y updatedAt
  });

  const isActive = sequelize.define('isActive', {
    Id_active: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Descripcion: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false // Desactiva las columnas createdAt y updatedAt
  });

  const rol = sequelize.define('rol', {
    Id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Rol: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false // Desactiva las columnas createdAt y updatedAt
  });

  const tipoDocumento = sequelize.define('tipoDocumento', {
    Id_documento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Documento: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false // Desactiva las columnas createdAt y updatedAt
  });

 // Definición de las relaciones
usuarios.belongsTo(tipoDocumento, { foreignKey: 'tipoDocumento', as: 'documento' });
usuarios.belongsTo(rol, { foreignKey: 'Rol' });
usuarios.belongsTo(isActive, { foreignKey: 'Estado' });

// Configuración del servidor
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, ""));
app.use(express.static(__dirname + '/'));
app.use(express.urlencoded({ extended: false }));
app.listen(8000);
console.log("Servidor corriendo exitosamente en el puerto 8000");

// Sincronizar los modelos con la base de datos
sequelize.sync()
  .then(() => {
    console.log('Conexión exitosa con la base de datos');
  })
  .catch((err) => {
    console.error('Error al conectar con la base de datos:', err);
  });

// Enrutamiento
app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.get('/acerca', (req, res) => {
  res.render('acerca.ejs');
});

app.get('/contacto', (req, res) => {
  res.render('contacto.ejs');
});

// Mostrar tabla de usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const listaUsuarios = await usuarios.findAll({ 
      order: [['Nombre', 'ASC']],
      include: [
        {
          model: tipoDocumento,
          as: 'documento'
        }
      ]
    });
    res.render('usuarios.ejs', { modelo: listaUsuarios });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los usuarios');
  }
});

// Ruta de búsqueda
app.get('/buscar', async (req, res) => {
  try {
    const { campo, valor } = req.query;
    let whereClause = {};

    // Verificar qué campo de búsqueda se seleccionó
    switch (campo) {
      case 'Nombre':
      case 'Apellido':
      case 'NumeroDocumento':
      case 'Telefono':
      case 'Rol':
      case 'Estado':
        whereClause[campo] = valor;
        break;
      case 'tipoDocumento':
        whereClause = {
          '$documento.Documento$': valor
        };
        break;
      default:
        throw new Error('Campo de búsqueda inválido');
    }

    const listaUsuarios = await usuarios.findAll({
      where: whereClause,
      include: [
        {
          model: tipoDocumento,
          as: 'documento'
        }
      ]
    });
    res.render('usuarios.ejs', { modelo: listaUsuarios });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al buscar los usuarios');
  }
});


  // Crear un nuevo Registro
  app.get('/crear', (req, res) => {
    res.render('crear.ejs', { modelo: {} });
  });

  app.post('/crear', async (req, res) => {
    try {
      const { NumeroDocumento, Telefono } = req.body;
  
      // Validación de números en NumeroDocumento y Telefono
      if (!regexNumeroDocumento.test(NumeroDocumento)) {
        throw new Error('El número de documento debe contener solo números.');
      }
  
      if (!regexTelefono.test(Telefono)) {
        throw new Error('El número de teléfono debe contener solo números.');
      }
  
      await usuarios.create({
        Nombre: req.body.Nombre,
        Apellido: req.body.Apellido,
        NumeroDocumento: NumeroDocumento,
        Telefono: Telefono,
        tipoDocumento: req.body.tipoDocumento,
        Rol: req.body.Rol,
        Estado: req.body.Estado
      });
      res.redirect("/usuarios");
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al crear el usuario');
    }
  });
  

  // Editar un Registro
  app.get("/editar/:id", async (req, res) => {
    try {
      const usuario = await usuarios.findByPk(req.params.id);
      res.render("editar.ejs", { modelo: usuario });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener el usuario');
    }
  });
app.post("/editar/:id", async (req, res) => {
  try {
    const usuario = await usuarios.findByPk(req.params.id);
    if (usuario) {
      const { NumeroDocumento, Telefono } = req.body;

      // Validación de números en NumeroDocumento y Telefono
      if (!regexNumeroDocumento.test(NumeroDocumento)) {
        throw new Error('El número de documento debe contener solo números.');
      }

      if (!regexTelefono.test(Telefono)) {
        throw new Error('El número de teléfono debe contener solo números.');
      }

      await usuario.update({
        Nombre: req.body.Nombre,
        Apellido: req.body.Apellido,
        NumeroDocumento: NumeroDocumento,
        Telefono: Telefono,
        tipoDocumento: req.body.tipoDocumento,
        Rol: req.body.Rol,
        Estado: req.body.Estado
      });
      res.redirect("/usuarios");
    } else {
      res.status(404).send('Usuario no encontrado');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el usuario');
  }
});


  // Eliminar un Registro
  app.get("/eliminar/:id", async (req, res) => {
    try {
      const usuario = await usuarios.findByPk(req.params.id);
      res.render("eliminar.ejs", { modelo: usuario });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener el usuario');
    }
  });

  app.post("/eliminar/:id", async (req, res) => {
    try {
      const usuario = await usuarios.findByPk(req.params.id);
      if (usuario) {
        await usuario.destroy();
        res.redirect("/usuarios");
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al eliminar el usuario');
    }
  });

// Ruta de página no encontrada
app.get('/*', (req, res) => {
  res.render('notfound.ejs');
});



  