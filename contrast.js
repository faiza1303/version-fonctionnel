//////////////////////////////////////////////////////////////////////////////////Traitement Contrast des couleurs////////////////////////////////////////////////////////
    const contrastCouleur = {};

    // Fonction pour récupérer les données de contraste d'un élément
    function getContrastData(element) {

        var semiTransparency = false;
        var opacity = false;
        const computedStyle = window.getComputedStyle(element[0]);

        let bgColor = getEffectiveBackground(element[0]);
        let fgColor = computedStyle.color;
    
        // Si aucune couleur valide n'est trouvée, ignorer l'élément
        if (!bgColor || !fgColor) {
            console.warn("Skipping element due to missing colors.");
            return null;
        }

        const fgParsed = new Color(fgColor);
        const bgParsed = new Color(bgColor);
        if (fgParsed.alpha < 1) {
            fgColor = fgParsed.overlayOnTest(bgParsed);
        }
        // const fontSize = parseFloat(computedStyle.getPropertyValue("font-size").replace("px", ""));
        // const fontWeight = parseInt(computedStyle.getPropertyValue("font-weight"), 10);
        const fontSize = parseFloat($(element).css("font-size"));
		const fontWeight = $(element).css("font-weight");

        var wcagLevel = {
            level: "AA",
            smallTextReqRatio: 4.5,
            largeTextReqRatio: 3
        };

		//AA Requirements (default)
		var ratio_small = wcagLevel.smallTextReqRatio;
		var ratio_large = wcagLevel.largeTextReqRatio;

        var minReq = ratio_small;

        if(fontSize >= 24)
			minReq = ratio_large;
		else if(fontSize >= 18.66 && fontWeight >= 700) //700 is where bold begins, 18.66 is approx equal to 14pt
			minReq = ratio_large;
        
        const ratio = calculateContrastRatio(fgColor, bgColor);

        return {
            bgColor,
            fgColor,
            ratio,
            minReq,
            size: fontSize,
            weight: fontWeight,
            bgImage: computedStyle.backgroundImage,
		    semiTransparency:	semiTransparency,
		    opacity:			opacity,
        };
    }

    const PageData = {
        allVisibleElements: Array.from(document.querySelectorAll("*")).filter(
            (el) => el.offsetParent !== null
        )
    };

	function isThisDisabled(element){
		return !!($(element).prop("disabled") || $(element).attr("aria-disabled") === "true");
	}

    function isImageElement(element) {
        return ["IMG", "INPUT", "SVG", "CANVAS"].includes(element.tagName);
    }

    function hasTextExcludingChildren(element) {
        return Array.from(element.childNodes).some(
            (node) =>
                node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== ""
        );
    }

    function hasAdditionalHidingTechniques(element) {
        const computedStyle = window.getComputedStyle(element);

        if (parseInt(computedStyle.fontSize) === 0) {
            return true;
        }

        const textIndent = parseInt(computedStyle.textIndent);
        if (textIndent !== 0 && textIndent < -998) {
            return true;
        }

        if (
            computedStyle.overflow === "hidden" &&
            (parseInt(computedStyle.height) <= 1 || parseInt(computedStyle.width) <= 1)
        ) {
            return true;
        }

        return false;
    }

// Mise à jour pour traiter les éléments avec un background transparent ou rgba(0, 0, 0, 0)
    function getEffectiveBackground(element) {
    let bgColor = window.getComputedStyle(element).backgroundColor;

    if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
        bgColor = getBackgroundFromParent(element);
    }

    // Si aucune couleur d'arrière-plan explicite n'a été trouvée, retourne null
    if (!bgColor) {
        console.warn("No valid background color found. Skipping this element.");
        return null;
    }

    return bgColor;
    }

    // Fonction pour gérer les arrière-plans hérités
    function getBackgroundFromParent(element) {
    let parent = element.parentElement;
    while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        const bgColor = parentStyle.backgroundColor;

        // Si une couleur valide est trouvée, on la retourne
        if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
            return bgColor;
        }

        // Si un arrière-plan image est détecté, traiter comme une exception et continuer la recherche
        if (parentStyle.backgroundImage && parentStyle.backgroundImage !== "none") {
            console.warn(`Background image detected on parent: ${parentStyle.backgroundImage}. Skipping this parent.`);
        }

        parent = parent.parentElement;
    }

    // Retourner null pour indiquer qu'aucune couleur d'arrière-plan explicite n'a été trouvée
    return null;
    }

    // Classe pour gérer les couleurs
    class Color {
        constructor(colorString) {
            const match = colorString.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+(\.\d+)?))?\)/);
            this.r = parseInt(match[1], 10);
            this.g = parseInt(match[2], 10);
            this.b = parseInt(match[3], 10);
            this.alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
        }

        overlayOnTest(bgColor) {
            const r = Math.round(this.alpha * this.r + (1 - this.alpha) * bgColor.r);
            const g = Math.round(this.alpha * this.g + (1 - this.alpha) * bgColor.g);
            const b = Math.round(this.alpha * this.b + (1 - this.alpha) * bgColor.b);
            return `rgb(${r}, ${g}, ${b})`;
        }

        toHex() {
            const toHexComponent = (value) => value.toString(16).padStart(2, "0");
            return `#${toHexComponent(this.r)}${toHexComponent(this.g)}${toHexComponent(this.b)}`;
        }
    }

    // Calcule le ratio de contraste
    function calculateContrastRatio(fgColor, bgColor) {
        const fgLuminance = calculateLuminance(fgColor);
        const bgLuminance = calculateLuminance(bgColor);

        return (
            (Math.max(fgLuminance, bgLuminance) + 0.05) /
            (Math.min(fgLuminance, bgLuminance) + 0.05)
        ).toFixed(2);
    }

    // Calcule la luminance pour une couleur donnée
    function calculateLuminance(color) {
        const rgb = color
            .match(/\d+/g)
            .map((value) => parseInt(value, 10) / 255)
            .map((channel) =>
                channel <= 0.03928
                    ? channel / 12.92
                    : Math.pow((channel + 0.055) / 1.055, 2.4)
            );

        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }

    function rgbToHex(rgb) {
        // Extraire les valeurs de R, G, et B de la chaîne RGB
        const rgbValues = rgb.match(/\d+/g);
    
        // Convertir chaque valeur RGB en hexadécimal, ajouter un zéro si nécessaire pour que chaque composant ait deux chiffres
        const hex = rgbValues
            .map(val => {
                const hexVal = parseInt(val).toString(16); // Conversion en hex
                return hexVal.length == 1 ? "0" + hexVal : hexVal; // Ajouter un zéro si nécessaire
            })
            .join(''); // Joindre les valeurs hexadécimales
    
        // Ajouter le caractère '#' au début pour obtenir un format hexadécimal
        return `#${hex}`;
    }

// Fonction pour vérifier si un élément est textuel
function isTextElement(element) {
    const fontSize = parseInt($(element).css("font-size"), 10);
    // Vérifie si l'élément contient directement un texte sans inclure les enfants
    return fontSize && Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



