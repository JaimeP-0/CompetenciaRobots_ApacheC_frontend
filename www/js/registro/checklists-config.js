/**
 * Qué categorías tienen checklist y cómo resolver el slug del HTML.
 */
(function (w) {
    'use strict';

    /** Categorías con checklist en views/checklists/{slug}-tabla-1|2.html */
    var REG_CHECKLIST_SLUGS = ['minisumo', 'futbol', 'velocista'];
    /** Número de tablas por categoría (velocista solo características). */
    var REG_CHECKLIST_TABLE_COUNT = {
        minisumo: 2,
        futbol: 2,
        velocista: 1
    };

    function regChecklistTableCount(slug) {
        var n = REG_CHECKLIST_TABLE_COUNT[slug];
        return n == null ? 2 : n;
    }

    function normalizeCategoriaText(s) {
        return String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /** Slug de carpeta/archivo checklist a partir del texto de categoría en la tabla. */
    function slugCategoriaChecklist(root) {
        var cell = root.querySelector('#reg-dato-categoria');
        if (!cell) {
            return '';
        }
        var t = normalizeCategoriaText(cell.textContent || '').trim();
        if (!t || t === '—') {
            return '';
        }
        if (t.indexOf('minisumo') !== -1) {
            return 'minisumo';
        }
        if (t.indexOf('futbol') !== -1) {
            return 'futbol';
        }
        if (t.indexOf('velocista') !== -1) {
            return 'velocista';
        }
        return t.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function checklistPrefixFromHost(host) {
        if (!host) {
            return '';
        }
        var c = host.querySelector('input[type="checkbox"][data-reg-chk]');
        if (!c) {
            return '';
        }
        var id = String(c.getAttribute('data-reg-chk') || '');
        var idx = id.lastIndexOf('-');
        return idx > 0 ? id.slice(0, idx + 1) : '';
    }

    w.CRRegistroChecklists = {
        SLUGS: REG_CHECKLIST_SLUGS,
        tableCount: regChecklistTableCount,
        slugFromSection: slugCategoriaChecklist,
        checkboxPrefix: checklistPrefixFromHost,
        normalizeCategoriaText: normalizeCategoriaText
    };
})(window);
