const STORAGE_KEY = 'vigia-colonia-state-v1';
const emptyState = { guard: null, residents: [], visits: [] };
let state = loadState();
const viewDetails = { resumen: ['Puesto de control', 'Una vista rápida del movimiento en la colonia.'], residentes: ['Directorio de residentes', 'Personas registradas para facilitar el control de accesos.'], visita: ['Registrar una visita', 'Captura la solicitud y envíala a autorización.'], autorizaciones: ['Autorizaciones', 'Las solicitudes esperan una respuesta antes de entrar.'], bitacora: ['Bitácora de accesos', 'Consulta el historial de entradas y salidas.'] };

function loadState() { try { return { ...emptyState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch { return { ...emptyState }; } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function now() { return new Date().toISOString(); }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'; }
function formatScheduled(date, time) { return date && time ? `${new Date(`${date}T${time}`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} · ${time}` : '—'; }
function initials(name) { return name.split(' ').slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function today(value) { return value && new Date(value).toDateString() === new Date().toDateString(); }
function showAlert(id, message, type = 'error') { const el = document.getElementById(id); el.textContent = message; el.className = `alert show ${type}`; setTimeout(() => el.classList.remove('show'), 4000); }
function renderResidentOptions() {
  const home = document.getElementById('visitor-home').value.trim().toLowerCase();
  const select = document.getElementById('visitor-resident');
  const matches = state.residents.filter(resident => resident.active && resident.home.trim().toLowerCase() === home);
  select.innerHTML = matches.length ? `<option value="">Selecciona al residente anfitrión</option>${matches.map(resident => `<option value="${resident.id}">${escapeHtml(resident.name)} · ${escapeHtml(resident.relation)}</option>`).join('')}` : '<option value="">Primero escribe un departamento válido</option>';
}
function applyPresidentCopy() {
  const residentView = document.getElementById('view-residentes');
  const visitView = document.getElementById('view-visita');
  residentView.querySelector('.eyebrow').textContent = 'Administración del presidente';
  residentView.querySelector('h2').textContent = 'Residentes y departamentos';
  residentView.querySelector('.panel h2').textContent = 'Dar de alta residente';
  residentView.querySelector('.panel p').textContent = 'El presidente asigna el departamento y mantiene actualizado el padrón.';
  document.querySelector('label[for="resident-home"]').textContent = 'Casa / depto. asignado *';
  visitView.querySelector('.eyebrow').textContent = 'Alta de visitantes';
  visitView.querySelector('h2').textContent = 'Registrar solicitud de visita';
  visitView.querySelector('.panel h2').textContent = 'Datos asignados por el presidente';
  visitView.querySelector('.panel p').textContent = 'El presidente registra la visita, asigna el departamento y define el tipo.';
  document.querySelector('label[for="visitor-type"]').textContent = 'Tipo de visita asignado *';
  document.querySelector('label[for="visitor-home"]').textContent = 'Casa / depto. destino asignado *';
  document.querySelector('#visit-form .btn-primary').textContent = 'Dar de alta visita';
}
function render() {
  const inside = state.visits.filter(visit => visit.status === 'inside');
  const pending = state.visits.filter(visit => visit.status === 'pending');
  const todayEntries = state.visits.filter(visit => today(visit.entryAt));
  document.getElementById('stat-residents').textContent = state.residents.filter(resident => resident.active).length;
  document.getElementById('stat-inside').textContent = inside.length;
  document.getElementById('stat-pending').textContent = pending.length;
  document.getElementById('stat-today').textContent = todayEntries.length;
  document.getElementById('inside-count-label').textContent = `${inside.length} ${inside.length === 1 ? 'persona' : 'personas'}`;
  document.getElementById('resident-count-label').textContent = `${state.residents.filter(r => r.active).length} activos`;
  document.getElementById('approval-count-label').textContent = `${pending.length} pendientes`;
  document.getElementById('log-count-label').textContent = `${state.visits.length} registros`;
  document.getElementById('guard-name').textContent = state.guard?.name || 'Sin turno activo';
  document.getElementById('guard-avatar').textContent = state.guard ? initials(state.guard.name) : '--';
  document.getElementById('inside-list').innerHTML = inside.length ? inside.map(visit => `<div class="inside-item"><span class="avatar">${escapeHtml(initials(visit.visitor))}</span><div><div class="person-name">${escapeHtml(visit.visitor)}</div><div class="person-meta">Visita a ${escapeHtml(visit.hostResidentName || 'residente')} · ${escapeHtml(visit.destination)}</div></div><span class="time">${formatTime(visit.entryAt)}</span></div>`).join('') : '<div class="empty">No hay visitantes dentro en este momento.</div>';
  document.getElementById('shift-content').innerHTML = state.guard ? `<div class="shift-active">● Turno activo<small>${escapeHtml(state.guard.name)} · Desde ${formatTime(state.guard.startedAt)}</small></div><div class="actions"><button class="btn btn-lime" type="button" id="end-shift">Cerrar turno</button></div>` : `<div class="shift-active" style="color:#f2c879;background:rgba(242,200,121,.12)">○ Sin turno activo<small>Inicia un turno para registrar visitantes.</small></div><div class="actions"><button class="btn btn-lime" type="button" id="start-shift">Iniciar turno</button></div>`;
  document.getElementById('resident-list').innerHTML = state.residents.filter(r => r.active).length ? state.residents.filter(r => r.active).map(resident => `<div class="resident-row"><span class="avatar">${escapeHtml(initials(resident.name))}</span><div class="row-content"><strong>${escapeHtml(resident.name)}</strong><div>${escapeHtml(resident.home)} · ${escapeHtml(resident.relation)} · ${escapeHtml(resident.phone)}</div></div><button class="btn btn-danger btn-small" data-remove-resident="${resident.id}" type="button">Dar de baja</button></div>`).join('') : '<div class="empty">Aún no hay residentes activos.</div>';
  document.getElementById('approval-list').innerHTML = pending.length ? pending.map(visit => `<div class="resident-row"><span class="avatar">${escapeHtml(initials(visit.visitor))}</span><div class="row-content"><strong>${escapeHtml(visit.visitor)}</strong><div>Visita a ${escapeHtml(visit.hostResidentName || 'residente')} · ${escapeHtml(visit.destination)}</div><div>${escapeHtml(visit.type)} · ${escapeHtml(visit.identity)} · ${formatScheduled(visit.visitDate, visit.visitTime)}</div><div>Registró ${escapeHtml(visit.guard)} · ${formatDate(visit.createdAt)} a las ${formatTime(visit.createdAt)}</div></div><div class="actions" style="margin:0"><button class="btn btn-lime btn-small" data-approve="${visit.id}" type="button">Autorizar</button><button class="btn btn-danger btn-small" data-reject="${visit.id}" type="button">Rechazar</button></div></div>`).join('') : '<div class="empty">No hay solicitudes pendientes. La bandeja está al día.</div>';
  document.getElementById('log-body').innerHTML = state.visits.length ? state.visits.slice().reverse().map(visit => `<tr><td><strong>${escapeHtml(visit.visitor)}</strong><div class="mono">${escapeHtml(visit.identity)}</div></td><td>${escapeHtml(visit.hostResidentName || '—')}</td><td>${escapeHtml(visit.type)}</td><td>${escapeHtml(visit.destination)}</td><td class="mono">${formatScheduled(visit.visitDate, visit.visitTime)}</td><td>${escapeHtml(visit.guard)}</td><td class="mono">${formatDate(visit.entryAt)} ${formatTime(visit.entryAt)}</td><td class="mono">${visit.exitAt ? `${formatDate(visit.exitAt)} ${formatTime(visit.exitAt)}` : '—'}</td><td><span class="badge badge-${visit.status === 'inside' ? 'inside' : visit.status === 'out' ? 'out' : visit.status === 'rejected' ? 'rejected' : 'pending'}">${statusLabel(visit.status)}</span></td><td>${visit.status === 'inside' ? `<button class="btn btn-ghost btn-small" data-exit="${visit.id}" type="button">Registrar salida</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="10"><div class="empty">La bitácora aparecerá aquí cuando se registre una solicitud.</div></td></tr>';
  document.getElementById('start-shift')?.addEventListener('click', () => openShiftModal(false));
  document.getElementById('end-shift')?.addEventListener('click', endShift);
}
function statusLabel(status) { return ({ pending: 'Pendiente', inside: 'Dentro', out: 'Salió', rejected: 'Rechazado' })[status]; }
function openShiftModal(closeMode) { document.getElementById('modal-title').textContent = closeMode ? 'Cambiar turno' : 'Iniciar turno'; document.getElementById('modal-copy').textContent = closeMode ? 'Captura el nombre del nuevo guardia responsable.' : 'Captura el nombre del guardia que estará a cargo de la caseta.'; document.getElementById('shift-modal').classList.add('show'); document.getElementById('guard-input').value = ''; document.getElementById('guard-input').focus(); }
function endShift() { if (state.visits.some(visit => visit.status === 'inside')) { showAlert('visit-alert', 'No se puede cerrar el turno mientras haya visitantes dentro. Registra sus salidas primero.'); navigate('visita'); return; } state.guard = null; saveState(); render(); }
function navigate(view) { document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view)); document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`)); document.getElementById('page-title').textContent = viewDetails[view][0]; document.getElementById('page-subtitle').textContent = viewDetails[view][1]; }

document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
document.getElementById('close-modal').addEventListener('click', () => document.getElementById('shift-modal').classList.remove('show'));
document.getElementById('shift-modal').addEventListener('click', event => { if (event.target.id === 'shift-modal') event.currentTarget.classList.remove('show'); });
document.getElementById('shift-form').addEventListener('submit', event => { event.preventDefault(); const name = document.getElementById('guard-input').value.trim(); if (!name) return; state.guard = { name, startedAt: now() }; saveState(); render(); document.getElementById('shift-modal').classList.remove('show'); });
document.getElementById('resident-form').addEventListener('submit', event => { event.preventDefault(); const name = document.getElementById('resident-name').value.trim(); const home = document.getElementById('resident-home').value.trim(); const phone = document.getElementById('resident-phone').value.trim(); const relation = document.getElementById('resident-relation').value; if (!name || !home || !phone || !relation) return showAlert('resident-alert', 'Completa todos los campos obligatorios.'); state.residents.push({ id: crypto.randomUUID(), name, home, phone, relation, active: true }); saveState(); event.target.reset(); render(); showAlert('resident-alert', 'Residente dado de alta correctamente.', 'success'); });
document.getElementById('visitor-home').addEventListener('input', renderResidentOptions);
document.getElementById('visit-form').addEventListener('submit', event => { event.preventDefault(); if (!state.guard) { showAlert('visit-alert', 'No puedes registrar una visita sin un guardia con turno activo.'); return; } const visitor = document.getElementById('visitor-name').value.trim(); const identity = document.getElementById('visitor-id').value.trim(); const type = document.getElementById('visitor-type').value; const destination = document.getElementById('visitor-home').value.trim(); const hostResidentId = document.getElementById('visitor-resident').value; const visitDate = document.getElementById('visit-date').value; const visitTime = document.getElementById('visit-time').value; const hostResident = state.residents.find(resident => resident.id === hostResidentId && resident.active); if (!visitor || !identity || !type || !destination || !hostResidentId || !visitDate || !visitTime) return showAlert('visit-alert', 'Completa todos los campos de la visita, incluyendo a quién visitas y la fecha.'); if (!hostResident || hostResident.home.trim().toLowerCase() !== destination.toLowerCase()) return showAlert('visit-alert', 'El residente seleccionado no pertenece al departamento indicado.'); state.visits.push({ id: crypto.randomUUID(), visitor, identity, type, destination, hostResidentId, hostResidentName: hostResident.name, visitDate, visitTime, guard: state.guard.name, createdAt: now(), entryAt: null, exitAt: null, status: 'pending' }); saveState(); event.target.reset(); renderResidentOptions(); render(); showAlert('visit-alert', 'Solicitud enviada al residente anfitrión para autorización.', 'success'); });
document.addEventListener('click', event => { const target = event.target; if (target.dataset.removeResident) { const resident = state.residents.find(item => item.id === target.dataset.removeResident); if (resident && confirm(`¿Dar de baja a ${resident.name}?`)) { resident.active = false; saveState(); render(); } } if (target.dataset.approve || target.dataset.reject) { const visit = state.visits.find(item => item.id === (target.dataset.approve || target.dataset.reject)); if (visit) { visit.status = target.dataset.approve ? 'inside' : 'rejected'; visit.entryAt = target.dataset.approve ? now() : null; saveState(); render(); } } if (target.dataset.exit) { const visit = state.visits.find(item => item.id === target.dataset.exit); if (visit) { visit.status = 'out'; visit.exitAt = now(); saveState(); render(); } } });

document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
applyPresidentCopy();
renderResidentOptions();
render();
