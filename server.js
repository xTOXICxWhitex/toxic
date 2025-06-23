const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Esquema extendido con campo "id" personalizado
const proyectoSchema = new mongoose.Schema({
  id: String, // ID tipo "A01"
  titulo: String,
  categoria: String,
  descripcion: String,
  responsable: String,
  participantes: Number,
  fecha: String,
  estatus: String,
  kilos_reciclados: Number,
  lugar_recoleccion: String,
  fecha_entrega: String,
  horario: String
});

const Proyecto = mongoose.model('proyecto', proyectoSchema, 'proyecto');

// Obtener el siguiente ID tipo "A01", "A02", etc.
async function generarNuevoID() {
  const ultimos = await Proyecto.find().sort({ id: -1 }).limit(1);
  if (ultimos.length === 0) return "A01";

  const ultimoID = ultimos[0].id;
  const numero = parseInt(ultimoID.substring(1)) + 1;
  return `A${numero.toString().padStart(2, '0')}`;
}

// Buscar por título, categoría o responsable
app.get('/api/buscar', async (req, res) => {
  try {
    const valor = req.query.valor;
    if (!valor) {
      return res.status(400).json({ message: "Falta el parámetro 'valor'." });
    }

    const regex = new RegExp(valor, "i");
    const resultados = await Proyecto.find({
      $or: [
        { titulo: regex },
        { categoria: regex },
        { responsable: regex }
      ]
    });

    if (resultados.length === 0) {
      return res.status(404).json({ message: "No se encontraron coincidencias." });
    }

    res.json(resultados);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obtener todos los proyectos
app.get('/api/proyectos', async (req, res) => {
  try {
    let proyectos = await Proyecto.find();

    proyectos = proyectos.map(p => ({
      ...p.toObject(),
      kilos_reciclados: p.kilos_reciclados === 0 ? "No se recolectó" : p.kilos_reciclados,
      participantes: p.participantes === 0 ? "No fue necesaria la participación" : p.participantes,
      lugar_recoleccion: p.lugar_recoleccion || "No especificado",
      fecha_entrega: p.fecha_entrega || "No especificada",
      horario: p.horario || "No especificado"
    }));

    res.json(proyectos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo proyecto con ID automático
app.post('/api/proyectos', async (req, res) => {
  try {
    const nuevoID = await generarNuevoID();
    const nuevo = new Proyecto({ ...req.body, id: nuevoID });
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar proyecto por _id
app.delete('/api/proyectos/:id', async (req, res) => {
  try {
    const eliminado = await Proyecto.findByIdAndDelete(req.params.id);
    res.json(eliminado);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Actualizar proyecto por _id
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

