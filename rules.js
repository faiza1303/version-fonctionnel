// Fonction principale pour la règle ESD1_ERROR_31
function Esd1Rule31() {
    // Vérifier si la règle doit être ignorée
    if (Esd1IgnoreRule(ESD1_MESSAGES.Rules.ESD1_ERROR_31)) {
        return;
    }
    // Initialisation de TestPageData
    const TestPageData = {
        allVisibleElements: $(":visible").filter(function () {
            return !$(this).is("script, style, link,ergoqual,option,iframe"); // Exclure les balises non pertinentes
        })
    };

    if (typeof TestPageData === 'undefined' || typeof TestPageData.allVisibleElements === 'undefined') {
        console.error("TestPageData.allVisibleElements is not defined");
        return;
    }
    // Analyser les éléments visibles de la page
    TestPageData.allVisibleElements.each(function () {
        // Compteur pour les images trouvées
        let imgCount = 0;
        // Compteur pour les éléments contenant du texte
        var elementsContainingTextCount = 0;
        // Compteur pour les éléments désactivés
        var disabledElementsCount = 0;
        if ($(this).is("img[src],input:image[src],svg,canvas")) {
            imgCount++;
        }
        else {
            if (hasTextExcludingChildren(this)) {
                if (!hasAdditionalHidingTechniques(this)) {
                    //Element pas caché et contient du texte
                    elementsContainingTextCount++;
                    var disabled = isThisDisabled(this);
                    var contrastData = null;
                    if(!disabled) //Run the contrast test
                     contrastData = getContrastData($(this));

                    // Vérifier si le contraste est insuffisant et enregistrer une erreur
                    if (contrastData && contrastData.ratio < contrastData.minReq) {
                        Esd1AddError($(this), ESD1_MESSAGES.Rules.ESD1_ERROR_31, contrastData.ratio, rgbToHex(contrastData.fgColor), rgbToHex(contrastData.bgColor));

                    }
                }
                else {
                    disabledElementsCount++;
                }
            }
        }

    });
}
