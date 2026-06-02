/**
 * Las 3 categorías del evento: Velocista, Minisumo, Fútbol (sin brackets).
 */
(function (w) {
    'use strict';

    function normalizeName(categoryName) {
        return String(categoryName || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function isVelocistaCategoryName(categoryName) {
        var n = normalizeName(categoryName);
        return n.indexOf('velocista') !== -1 || n.indexOf('velocisra') !== -1 || n.indexOf('speedster') !== -1;
    }

    function isMinisumoCategoryName(categoryName) {
        var n = normalizeName(categoryName);
        return (
            n.indexOf('minisumo') !== -1 ||
            n.indexOf('mini sumo') !== -1 ||
            n.indexOf('mini-sumo') !== -1
        );
    }

    function isFutbolCategoryName(categoryName) {
        var n = normalizeName(categoryName);
        return (
            n.indexOf('futbol') !== -1 ||
            n.indexOf('football') !== -1 ||
            n.indexOf('soccer') !== -1
        );
    }

    /** Categoría del evento actual (solo estas tres en pista). */
    function isEventCategoryName(categoryName) {
        return (
            isVelocistaCategoryName(categoryName) ||
            isMinisumoCategoryName(categoryName) ||
            isFutbolCategoryName(categoryName)
        );
    }

    function inferMatchModeFromCategoryName(categoryName) {
        if (isVelocistaCategoryName(categoryName)) {
            return 'solo';
        }
        if (isMinisumoCategoryName(categoryName) || isFutbolCategoryName(categoryName)) {
            return 'pairwise';
        }
        return 'shared';
    }

    function matchModeLabel(mode, categoryName) {
        if (mode === 'solo') {
            return 'Carrera individual (uno tras otro)';
        }
        if (mode === 'pairwise' && isFutbolCategoryName(categoryName)) {
            return 'Fútbol 2v2 (equipo vs equipo, 2 robots por equipo)';
        }
        if (mode === 'pairwise') {
            return 'Minisumo 1v1 (emparejamiento por ronda)';
        }
        return 'Cola compartida';
    }

    function robotsRequiredPerTeam(categoryName) {
        return isFutbolCategoryName(categoryName) ? 2 : 1;
    }

    function usesBrackets() {
        return false;
    }

    function filterEventCategories(categories) {
        var list = categories || [];
        var eventOnly = list.filter(function (c) {
            return c && isEventCategoryName(c.name);
        });
        return eventOnly.length ? eventOnly : list;
    }

    w.CRCategoriasCompetencia = {
        normalizeName: normalizeName,
        isVelocistaCategoryName: isVelocistaCategoryName,
        isMinisumoCategoryName: isMinisumoCategoryName,
        isFutbolCategoryName: isFutbolCategoryName,
        isEventCategoryName: isEventCategoryName,
        inferMatchModeFromCategoryName: inferMatchModeFromCategoryName,
        matchModeLabel: matchModeLabel,
        robotsRequiredPerTeam: robotsRequiredPerTeam,
        usesBrackets: usesBrackets,
        filterEventCategories: filterEventCategories
    };
})(window);
