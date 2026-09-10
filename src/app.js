const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

let residentes = [];

function crearResidente({ name, home, phone, relation } = {}) {
  if (!name || !home || !phone || !relation) {
    throw new Error('Faltan campos obligatorios');
  }

  const yaOcupado = residentes.find(
    residente => residente.active && residente.home.trim().toLowerCase() === home.trim().toLowerCase()
  );

  if (yaOcupado) {
    throw new Error('Ese departamento ya tiene un residente activo');
  }

  const nuevo = { id: crypto.randomUUID(), name, home, phone, relation, active: true };
  residentes.push(nuevo);
  return nuevo;
}

function listarResidentes() {
  return residentes.filter(residente => residente.active);
}

function obtenerResidente(id) {
  return residentes.find(residente => residente.id === id) || null;
}

function actualizarResidente(id, cambios = {}) {
  const residente = obtenerResidente(id);
  if (!residente) throw new Error('Residente no encontrado');

  const camposPermitidos = ['name', 'home', 'phone', 'relation'];
  for (const campo of camposPermitidos) {
    if (cambios[campo] !== undefined) residente[campo] = cambios[campo];
  }

  return residente;
}

function eliminarResidente(id) {
  const residente = obtenerResidente(id);
  if (!residente) throw new Error('Residente no encontrado');
  residente.active = false;
  return residente;
}

function _resetParaTests() {
  residentes = [];
}

app.post('/api/residentes', (req, res) => {
  try {
    res.status(201).json(crearResidente(req.body));
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
});

app.get('/api/residentes', (req, res) => {
  res.json(listarResidentes());
});

app.get('/api/residentes/:id', (req, res) => {
  const residente = obtenerResidente(req.params.id);
  if (!residente) return res.status(404).json({ mensaje: 'Residente no encontrado' });
  res.json(residente);
});

app.put('/api/residentes/:id', (req, res) => {
  try {
    res.json(actualizarResidente(req.params.id, req.body));
  } catch (error) {
    res.status(404).json({ mensaje: error.message });
  }
});

app.delete('/api/residentes/:id', (req, res) => {
  try {
    res.json(eliminarResidente(req.params.id));
  } catch (error) {
    res.status(404).json({ mensaje: error.message });
  }
});

module.exports = { app, _resetParaTests };
