// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos directamente desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ya no necesitas rutas explícitas para HTML si están en public

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://xTOXICx:715600toxic@cluster0.hjmfyw4.mongodb.net/PAEC?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err));

/* ======= ESQUEMAS ======= */

// Proyecto
const proyectoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  categoria: String,
  descripcion: String,
  responsable: String,
  participantes: Number,
  estatus: String
}, { collection: 'proyectos' });
const Proyecto = mongoose.model('Proyecto', proyectoSchema);

// Registro
const registroSchema = new mongoose.Schema({
  id: { type: String, required: true },
  kilos_reciclados: Number,
  lugar: String,
  fecha_entrega: String,
  horario: String,
  lugar_recoleccion: String
}, { collection: 'registros' });
const Registro = mongoose.model('Registro', registroSchema);

/* ======= FUNCIONES ======= */

async function generarNuevoID() {
  const ultimo = await Proyecto.findOne().sort({ id: -1 });
  if (!ultimo) return "A01";
  const numero = parseInt(ultimo.id.substring(1)) + 1;
  return `A${numero.toString().padStart(2, '0')}`;
}

/* ======= RUTAS API ======= */

// PROYECTOS
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
    const nuevoID = await generarNuevoID();
    const proyecto = new Proyecto({ ...req.body, id: nuevoID });
    const guardado = await proyecto.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/proyectos/:id', async (req, res) => {
  try {
    const actualizado = await Proyecto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ message: 'Proyecto no encontrado.' });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/proyectos/:id', async (req, res) => {
  try {
    const eliminado = await Proyecto.findByIdAndDelete(req.params.id);
    if (eliminado) {
      await Registro.deleteMany({ id: eliminado.id });
      res.json({ proyectoEliminado: eliminado });
    } else {
      res.status(404).json({ message: 'Proyecto no encontrado.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REGISTROS
app.get('/api/registros', async (req, res) => {
  try {
    const registros = await Registro.find();
    res.json(registros);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/registros', async (req, res) => {
  try {
    const proyectoExiste = await Proyecto.findOne({ id: req.body.id });
    if (!proyectoExiste) {
      return res.status(400).json({ message: "El proyecto con ese ID no existe." });
    }
    const registro = new Registro(req.body);
    const guardado = await registro.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/registros/:id', async (req, res) => {
  try {
    const actualizado = await Registro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ message: 'Registro no encontrado.' });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/registros/:id', async (req, res) => {
  try {
    const eliminado = await Registro.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ message: 'Registro no encontrado.' });
    res.json(eliminado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======= CONSULTAS COMBINADAS ======= */

app.get('/api/buscar/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const proyecto = await Proyecto.findOne({ id });
    const registros = await Registro.find({ id });

    if (!proyecto && registros.length === 0) {
      return res.status(404).json({ message: 'No se encontró ningún proyecto ni registro con ese ID.' });
    }

    res.json({ proyecto, registros });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/visualizartodo', async (req, res) => {
  try {
    const proyectos = await Proyecto.find();
    const resultado = await Promise.all(proyectos.map(async (proyecto) => {
      const registros = await Registro.find({ id: proyecto.id });
      return { proyecto, registros };
    }));
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======= INICIAR SERVIDOR ======= */

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

