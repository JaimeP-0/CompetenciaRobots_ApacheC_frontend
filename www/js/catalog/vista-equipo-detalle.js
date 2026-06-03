/**
 * Ficha de un equipo e integrantes.
 */
(function (w) {
    'use strict';

    var CRDom = w.CRDom;
    if (!CRDom) throw new Error("Carga core/escape-html y skeleton-html");

    function initEquipoDetalle(outlet, params) {
        var id = String((params && params.teamId) || '').trim();
        var host = outlet.querySelector('#cr-equipo-detalle-root');
        var pageTitle = outlet.querySelector('#cr-equipo-page-title');
        if (!host || !w.CRApi || typeof w.CRApi.getCatalogTeam !== 'function') {
            return;
        }
        if (pageTitle) {
            pageTitle.textContent = 'Cargando…';
        }
        host.innerHTML =
            '<div class="space-y-4">' +
            '<div class="cr-catalog-skel cr-catalog-skel-line w-2/3 max-w-xs"></div>' +
            '<div class="cr-catalog-skel cr-catalog-skel-line w-full max-w-md"></div>' +
            '<div class="cr-catalog-skel cr-catalog-skel-line w-5/6 max-w-sm"></div></div>';
        w.CRApi.getCatalogTeam(id)
            .then(function (data) {
                var t = data && data.team;
                var members = (data && data.members) || [];
                if (!t) {
                    if (pageTitle) {
                        pageTitle.textContent = 'Equipo no encontrado';
                    }
                    host.innerHTML =
                        '<p class="cr-catalog-msg cr-catalog-msg--error">No existe un equipo con este identificador.</p>';
                    return;
                }
                if (pageTitle) {
                    pageTitle.textContent = t.name || 'Equipo';
                }
                var capName = String(t.captain_name || '').trim();
                if (!capName) {
                    var lead = members.filter(function (m) {
                        return m.is_leader;
                    })[0];
                    capName = lead && lead.name ? String(lead.name).trim() : '';
                }
                var miembros =
                    members.length > 0
                        ? '<ul class="cr-catalog-member-list" role="list">' +
                          members
                              .map(function (m) {
                                  var rol = m.is_leader
                                      ? '<span class="cr-catalog-badge cr-catalog-member-role">Líder</span>'
                                      : '<span class="cr-catalog-member-role text-xs font-medium text-graphite/55">Integrante</span>';
                                  var mail = String(m.email || '').trim();
                                  var mailLine =
                                      '<p class="cr-catalog-member-email"><span class="cr-catalog-member-email-k">Correo</span> ' +
                                      CRDom.escapeHtml(mail || '—') +
                                      '</p>';
                                  return (
                                      '<li class="cr-catalog-member-card" role="listitem">' +
                                      '<div class="cr-catalog-member-head">' +
                                      '<span class="cr-catalog-member-name">' +
                                      CRDom.escapeHtml(m.name) +
                                      '</span>' +
                                      rol +
                                      '</div>' +
                                      mailLine +
                                      '</li>'
                                  );
                              })
                              .join('') +
                          '</ul>'
                        : '<p class="cr-catalog-msg mt-4">Sin integrantes registrados en el catálogo.</p>';
                host.innerHTML =
                    '<dl class="cr-catalog-dl">' +
                    '<div><dt class="cr-catalog-dt">Categoría</dt><dd class="cr-catalog-dd">' +
                    CRDom.escapeHtml(t.category_name || '—') +
                    '</dd></div>' +
                    '<div><dt class="cr-catalog-dt">Escuela</dt><dd class="cr-catalog-dd">' +
                    CRDom.escapeHtml(t.school) +
                    '</dd></div>' +
                    '<div><dt class="cr-catalog-dt">Grado</dt><dd class="cr-catalog-dd">' +
                    CRDom.escapeHtml(t.grade) +
                    '</dd></div>' +
                    '<div><dt class="cr-catalog-dt">Capitán</dt><dd class="cr-catalog-dd">' +
                    CRDom.escapeHtml(capName || '—') +
                    '</dd></div>' +
                    '<div class="sm:col-span-2"><dt class="cr-catalog-dt">Tutor</dt><dd class="cr-catalog-dd">' +
                    CRDom.escapeHtml(t.teacher) +
                    '</dd></div></dl>' +
                    '<h2 class="cr-catalog-section-title">Integrantes</h2>' +
                    miembros;
            })
            .catch(function () {
                if (pageTitle) {
                    pageTitle.textContent = 'Equipo';
                }
                host.innerHTML =
                    '<p class="cr-catalog-msg cr-catalog-msg--error">No se pudo cargar la ficha del equipo.</p>';
            });
    }

    w.CRCatalogViews = w.CRCatalogViews || {};
    w.CRCatalogViews.equipoDetalle = initEquipoDetalle;
})(window);
