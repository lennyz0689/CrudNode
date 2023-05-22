// Librerias y dependencias
const http = require('http');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Configuración de Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/base.db', // Ruta a tu archivo de base de datos SQLite
  logging: false // Desactiva los logs de Sequelize
});

// Definición del modelo
const Producto = sequelize.define('Producto', {
  Producto_ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Precio: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  Descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Configuración del servidor
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, ""));
app.use(express.static(__dirname + '/'));
app.use(express.urlencoded({ extended: false }));
app.listen(8000);
console.log("Servidor corriendo exitosamente en el puerto 8000");

// Sincronizar el modelo con la base de datos
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

// Mostrar tabla de Productos
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({ order: [['Nombre', 'ASC']] });
    res.render('Productos.ejs', { modelo: productos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los productos');
  }
});

// Crear un nuevo Registro
app.get('/crear', (req, res) => {
  res.render('crear.ejs', { modelo: {} });
});

app.post('/crear', async (req, res) => {
  try {
    await Producto.create({
      Nombre: req.body.Nombre,
      Precio: req.body.Precio,
      Descripcion: req.body.Descripcion
    });
    res.redirect("/productos");
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear el producto');
  }
});

// Editar un Registro
app.get("/editar/:id", async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    res.render("editar.ejs", { modelo: producto });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el producto');
  }
});

app.post("/editar/:id", async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (producto) {
      await producto.update({
        Nombre: req.body.Nombre,
        Precio: req.body.Precio,
        Descripcion: req.body.Descripcion
      });
      res.redirect("/productos");
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el producto');
  }
});

// Eliminar un Registro
app.get("/eliminar/:id", async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    res.render("eliminar.ejs", { modelo: producto });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el producto');
  }
});

app.post("/eliminar/:id", async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (producto) {
      await producto.destroy();
      res.redirect("/productos");
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar el producto');
  }
});

// Ruta de página no encontrada
app.get('/*', (req, res) => {
  res.render('notfound.ejs');
});
