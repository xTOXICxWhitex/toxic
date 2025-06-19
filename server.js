const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexión con MongoDB Atlas desde variable de entorno
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Esquema
const proyectoSchema = new mongoose.Schema({
  titulo: String,
  categoria: String,
  descripcion: String,
  responsable: String,
  participantes: Number,
  fecha: String,
  estatus: String
});

// 👇 Aquí usamos el nombre exacto de la colección: "proyecto"
const Proyecto = mongoose.model('proyecto', proyectoSchema, 'proyecto');

// Rutas
app.get('/api/proyectos', async (req, res) => {
  try {
    const proyectos = await Proyecto.find();
    res.json(proyectos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/proyectos', async (req, res) => {
  try {
    const nuevo = new Proyecto(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/proyectos/:id', async (req, res) => {
  try {
    const eliminado = await Proyecto.findByIdAndDelete(req.params.id);
    res.json(eliminado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/proyectos/:id', async (req, res) => {
  try {
    const actualizado = await Proyecto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
