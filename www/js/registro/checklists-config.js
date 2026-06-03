/**
 * Checklist de verificación generado desde GET /categorias/{id}/reglas.
 */
(function (w) {
    'use strict';

    function esc(s) {
        if (w.CRDom && typeof w.CRDom.escapeHtml === 'function') {
            return w.CRDom.escapeHtml(s);
        }
        return String(s == null ? '' : s);
    }

    function normalizeRuleType(rule) {
        var t = String(rule && rule.type != null ? rule.type : '')
            .trim()
            .toLowerCase();
        return t === 'characteristic' || t === 'restriction' ? t : '';
    }

    function rulesByType(rules, tableKind) {
        return (rules || []).filter(function (r) {
            var t = normalizeRuleType(r);
            if (tableKind === 'restriction') {
                return t === 'restriction';
            }
            return t === 'characteristic' || t === '';
        });
    }

    function categoryLabelFromSection(root) {
        var cell = root && root.querySelector ? root.querySelector('#reg-dato-categoria') : null;
        if (!cell) {
            return 'Categoría';
        }
        var t = String(cell.textContent || '').trim();
        return t && t !== '—' ? t : 'Categoría';
    }

    /**
     * @param {Array} rules — reglas con id, description, type
     * @param {object} opts — kicker, title, columnLabel, tableKind, robotSlot (1|2, solo Fútbol)
     */
    function renderChecklistTable(rules, opts) {
        opts = opts || {};
        var list = rules || [];
        var tableKind = opts.tableKind === 'restriction' ? 'restriction' : 'characteristic';
        var prefix =
            tableKind === 'restriction'
                ? 'r2' + (opts.robotSlot != null ? '-rb' + String(opts.robotSlot) : '')
                : 'r1' + (opts.robotSlot != null ? '-rb' + String(opts.robotSlot) : '');
        var kicker = opts.kicker != null ? String(opts.kicker) : 'Checklist';
        var title = opts.title != null ? String(opts.title) : tableKind === 'restriction' ? 'Restricciones' : 'Características';
        if (opts.robotSlot != null) {
            title = 'Robot ' + String(opts.robotSlot) + ' · ' + title;
        }
        var colLabel = opts.columnLabel != null ? String(opts.columnLabel) : title;

        var bodyRows = '';
        if (!list.length) {
            bodyRows =
                '<tr><td colspan="2" class="px-3 py-4 text-center text-sm text-graphite/70">No hay reglas de este tipo.</td></tr>';
        } else {
            bodyRows = list
                .map(function (rule, idx) {
                    var chkId = 'reg-chk-' + prefix + '-' + idx;
                    var desc = rule.description != null ? String(rule.description).trim() : '';
                    var ruleId = rule.id != null ? String(rule.id) : '';
                    var aria = 'Cumple: ' + desc;
                    return (
                        '<tr><td class="leading-snug text-graphite sm:py-3">' +
                        esc(desc) +
                        '</td><td class="align-top px-1 text-center sm:px-2">' +
                        '<input type="checkbox" id="' +
                        esc(chkId) +
                        '" data-reg-chk="' +
                        esc(prefix + '-' + idx) +
                        '"' +
                        (ruleId ? ' data-rule-id="' + esc(ruleId) + '"' : '') +
                        ' class="cr-reg-check-input" aria-label="' +
                        esc(aria) +
                        '" />' +
                        '<label for="' +
                        esc(chkId) +
                        '" class="cr-reg-check-label"><span></span></label></td></tr>'
                    );
                })
                .join('');
        }

        return (
            '<div class="cr-catalog-card-block">' +
            '<div class="cr-catalog-card-block-h">' +
            '<p class="cr-catalog-kicker mb-0.5">' +
            esc(kicker) +
            '</p>' +
            '<h3 class="cr-catalog-card-block-h-title cr-catalog-card-block-h-title--dynamic text-left">' +
            esc(title) +
            '</h3></div>' +
            '<div class="cr-catalog-card-block-body cr-catalog-card-block-body--equipo !px-0 !pb-0 !pt-0 sm:!px-0">' +
            '<div class="cr-catalog-table-wrap rounded-none border-0 shadow-none">' +
            '<table class="cr-catalog-table min-w-[min(100%,18rem)] text-xs leading-normal sm:min-w-0 sm:text-sm md:text-[0.9375rem] lg:text-base">' +
            '<thead><tr><th class="min-w-0">' +
            esc(colLabel) +
            '</th>' +
            '<th class="w-[3.5rem] min-w-[3.5rem] px-1 text-center sm:w-20 sm:min-w-[4.5rem] sm:px-2">Cumple</th></tr></thead>' +
            '<tbody>' +
            bodyRows +
            '</tbody></table></div></div></div>'
        );
    }

    w.CRRegistroChecklists = {
        normalizeRuleType: normalizeRuleType,
        rulesByType: rulesByType,
        categoryLabelFromSection: categoryLabelFromSection,
        renderTable: renderChecklistTable
    };
})(window);
