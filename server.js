const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = 'mongodb+srv://xTOXICx:715600toxic@cluster0.hjmfyw4.mongodb.net/PAEC?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión:', err));

const proyectoSchema = new mongoose.Schema({
  titulo: String,
  categoria: String,
  descripcion: String,
  responsable: String,
  participantes: Number,
  fecha: String,
  estatus: String
});

// Aquí le decimos que la colección se llama "proyecto" (sin "s")
const Proyecto = mongoose.model('Proyecto', proyectoSchema, 'proyecto');

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
    const nuevoProyecto = new Proyecto(req.body);
    const guardado = await nuevoProyecto.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/proyectos/:id', async (req, res) => {
  try {
    const eliminado = await Proyecto.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ message: 'Proyecto no encontrado' });
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/proyectos/:id', async (req, res) => {
  try {
    const actualizado = await Proyecto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ message: 'Proyecto no encontrado' });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
