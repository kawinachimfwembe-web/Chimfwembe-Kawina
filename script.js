document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. MAIN TAB SWITCHING ---
    const mainNav = document.querySelector(".main-nav");
    const tabPanels = document.querySelectorAll(".tab-panel");

    mainNav.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const targetTab = btn.dataset.tab;

        Array.from(mainNav.children).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabPanels.forEach(panel => {
            panel.classList.toggle("hidden", panel.id !== targetTab);
        });
    });

    // --- 2. NOTES TOPICS & DYNAMIC PDF MANAGER ---
    // You can easily add more topics or update PDF links here!
    const subjectData = {
        phy: {
            title: "Physics Notes",
            topics: [
                { name: "Topic 1: Kinematics & Linear Motion", pdf: "#" },
                { name: "Topic 2: Newton's Laws of Motion", pdf: "#" },
                { name: "Topic 3: Work, Energy and Power", pdf: "#" }
            ]
        },
        chem: {
            title: "Chemistry Notes",
            topics: [
                { name: "Topic 1: Stoichiometry & Moles", pdf: "#" },
                { name: "Topic 2: Chemical Equation Balancing", pdf: "#" },
                { name: "Topic 3: Acids, Bases and Salts", pdf: "#" }
            ]
        },
        bio: {
            title: "Biology Notes",
            topics: [
                { name: "Topic 1: Cell Structure & Organization", pdf: "#" },
                { name: "Topic 2: Enzyme Action", pdf: "#" },
                { name: "Topic 3: Plant Nutrition", pdf: "#" }
            ]
        },
        civic: {
            title: "Civic Education Notes",
            topics: [
                { name: "Topic 1: Governance & Democracy", pdf: "#" },
                { name: "Topic 2: Human Rights & Freedoms", pdf: "#" },
                { name: "Topic 3: Corruption & Law", pdf: "#" }
            ]
        }
    };

    window.openSubject = function(subjKey) {
        const data = subjectData[subjKey];
        if (!data) return;

        document.querySelector(".subject-grid").classList.add("hidden");
        const drawer = document.getElementById("topic-drawer");
        drawer.classList.remove("hidden");

        document.getElementById("drawer-subject-title").textContent = data.title;
        const container = document.getElementById("topic-list-container");
        container.innerHTML = "";

        data.topics.forEach(topic => {
            const item = document.createElement("div");
            item.className = "topic-item";
            item.innerHTML = `
                <span>${topic.name}</span>
                <a href="${topic.pdf}" class="pdf-link" target="_blank">Download PDF</a>
            `;
            container.appendChild(item);
        });
    };

    window.closeSubject = function() {
        document.getElementById("topic-drawer").classList.add("hidden");
        document.querySelector(".subject-grid").classList.remove("hidden");
    };


    // --- 3. TOOLS SUB-NAVIGATION ---
    const toolSubNav = document.querySelector(".tool-sub-nav");
    toolSubNav.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const targetTool = btn.dataset.tool;

        Array.from(toolSubNav.children).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tool-panel").forEach(panel => {
            panel.classList.toggle("hidden", panel.id !== targetTool);
        });
    });


    // --- 4. CHEMISTRY BALANCER & STOICHIOMETRY ENGINE ---
    const ATOMIC_MASSES = {
        H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
        Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098,
        Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38
    };
    let CURRENT_BALANCED_REACTION = null;

    function normalizeEquation(eqStr) {
        if (!eqStr) return "";
        return eqStr.trim().replace(/(=>|→|⟶|=)/g, '->');
    }

    window.loadChemExample = function() {
        document.getElementById('input-equation').value = "H2 + O2 = H2O";
    };

    const parseChemicalFormula = (formulaStr) => {
        const elementReg = /([A-Z][a-z]*)(\d*)/g;
        const outMap = {};
        let parsedMatch;
        while ((parsedMatch = elementReg.exec(formulaStr)) !== null) {
            const el = parsedMatch[1];
            if (!ATOMIC_MASSES[el]) throw new Error(`Unknown element symbol: ${el}`);
            const count = parseInt(parsedMatch[2] || 1, 10);
            outMap[el] = (outMap[el] || 0) + count;
        }
        return outMap;
    };

    const getMolarMass = (formulaStr) => {
        const elementCounts = parseChemicalFormula(formulaStr);
        return Object.entries(elementCounts).reduce((acc, [el, count]) => acc + (ATOMIC_MASSES[el] * count), 0);
    };

    const parseReactionSide = (sideString) => {
        return sideString.split('+').map(item => {
            const cleanItem = item.trim();
            const match = cleanItem.match(/^(\d*)([A-Za-z0-9()]+)$/);
            if (!match) throw new Error("Malformed formula construct.");
            return { coefficient: parseInt(match[1] || 1, 10), formula: match[2] };
        });
    };

    const balanceReactionEngine = (rawEquationStr) => {
        const normalized = normalizeEquation(rawEquationStr);
        if (!normalized.includes('->')) throw new Error("Couldn't find reactants and products. Try: H2 + O2 -> H2O");
        const [leftSide, rightSide] = normalized.split('->');
        
        const reactants = parseReactionSide(leftSide);
        const products = parseReactionSide(rightSide);
        const allCompounds = [...reactants, ...products];

        const elementalSet = new Set();
        allCompounds.forEach(c => Object.keys(parseChemicalFormula(c.formula)).forEach(el => elementalSet.add(el)));
        const elementList = Array.from(elementalSet);

        const matrix = elementList.map(el => {
            return allCompounds.map((comp, idx) => {
                const composition = parseChemicalFormula(comp.formula);
                const atomicCount = composition[el] || 0;
                return idx < reactants.length ? atomicCount : -atomicCount;
            });
        });

        const compoundCount = allCompounds.length;
        let foundCoefficients = null;

        const findNullspaceVector = (index, currentVector) => {
            if (foundCoefficients) return;
            if (index === compoundCount) {
                const satisfiesAll = matrix.every(row => 
                    row.reduce((sum, val, idx) => sum + val * currentVector[idx], 0) === 0
                );
                if (satisfiesAll) foundCoefficients = [...currentVector];
                return;
            }
            for (let cVal = 1; cVal <= 10; cVal++) {
                currentVector[index] = cVal;
                findNullspaceVector(index + 1, currentVector);
                if (foundCoefficients) return;
            }
        };

        findNullspaceVector(0, new Array(compoundCount).fill(1));
        if (!foundCoefficients) throw new Error("Could not compute integer balancing ratios.");

        return {
            reactants: reactants.map((r, i) => ({ coeff: foundCoefficients[i], formula: r.formula, molarMass: getMolarMass(r.formula) })),
            products: products.map((p, i) => ({ coeff: foundCoefficients[reactants.length + i], formula: p.formula, molarMass: getMolarMass(p.formula) }))
        };
    };

    document.getElementById("btn-balance").addEventListener("click", () => {
        const eqInput = document.getElementById("input-equation").value;
        const outBox = document.getElementById("balance-result-box");
        const outText = document.getElementById("output-balanced-eq");
        const selectBox = document.getElementById("select-known-chem");

        try {
            const balancedData = balanceReactionEngine(eqInput);
            CURRENT_BALANCED_REACTION = balancedData;
            const mapStr = arr => arr.map(item => `${item.coeff === 1 ? '' : item.coeff}${item.formula}`).join(" + ");
            outText.textContent = `${mapStr(balancedData.reactants)} ➔ ${mapStr(balancedData.products)}`;

            selectBox.innerHTML = "";
            [...balancedData.reactants, ...balancedData.products].forEach(item => {
                const opt = document.createElement("option");
                opt.value = item.formula;
                opt.textContent = `${item.formula} (${item.molarMass.toFixed(2)} g/mol)`;
                selectBox.appendChild(opt);
            });
            outBox.classList.remove("hidden");
        } catch (err) {
            outText.innerHTML = `<span class="error-message">${err.message}</span>`;
            outBox.classList.remove("hidden");
        }
    });


    // --- 5. MATHS QUADRATIC SOLVER ---
    window.loadQuadExample = function() {
        document.getElementById('quad-a').value = "2";
        document.getElementById('quad-b').value = "-5";
        document.getElementById('quad-c').value = "-3";
    };

    document.getElementById("btn-solve-quadratic").addEventListener("click", () => {
        const a = parseFloat(document.getElementById("quad-a").value);
        const b = parseFloat(document.getElementById("quad-b").value);
        const c = parseFloat(document.getElementById("quad-c").value);
        const outBox = document.getElementById("quadratic-result-box");
        outBox.innerHTML = "";

        if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) {
            outBox.innerHTML = `<div class="error-message">Please provide valid coefficients (a ≠ 0).</div>`;
            outBox.classList.remove("hidden");
            return;
        }

        const disc = (b * b) - (4 * a * c);
        let resultHTML = `<h4>Solution Output:</h4><div class="step-card">Discriminant D = ${disc}</div>`;
        if (disc >= 0) {
            const r1 = (-b + Math.sqrt(disc)) / (2 * a);
            const r2 = (-b - Math.sqrt(disc)) / (2 * a);
            resultHTML += `<p class="highlight-text" style="margin-top:0.5rem;">x₁ = ${r1.toFixed(4)} <br> x₂ = ${r2.toFixed(4)}</p>`;
        } else {
            resultHTML += `<p class="highlight-text" style="margin-top:0.5rem;">Complex roots detected.</p>`;
        }
        outBox.innerHTML = resultHTML;
        outBox.classList.remove("hidden");
    });


    // --- 6. PHYSICS KINEMATICS ENGINE ---
    window.resetKinematics = function() {
        ['kin-u', 'kin-v', 'kin-a', 'kin-s', 'kin-t'].forEach(id => document.getElementById(id).value = '');
        document.getElementById("kinematics-result-box").classList.add("hidden");
    };

    document.getElementById("btn-solve-kinematics").addEventListener("click", () => {
        const outBox = document.getElementById("kinematics-result-box");
        outBox.innerHTML = "";

        const inputElements = [
            { id: 'u', val: parseFloat(document.getElementById("kin-u").value) },
            { id: 'v', val: parseFloat(document.getElementById("kin-v").value) },
            { id: 'a', val: parseFloat(document.getElementById("kin-a").value) },
            { id: 's', val: parseFloat(document.getElementById("kin-s").value) },
            { id: 't', val: parseFloat(document.getElementById("kin-t").value) }
        ];

        const knowns = inputElements.filter(item => !isNaN(item.val));
        if (knowns.length !== 3) {
            outBox.innerHTML = `<span class="error-message">Please enter exactly 3 values. Leave the other 2 blank.</span>`;
            outBox.classList.remove("hidden");
            return;
        }

        const k = {};
        knowns.forEach(item => k[item.id] = item.val);

        try {
            if (k.s === undefined) k.s = k.t !== undefined ? (k.u !== undefined ? k.u * k.t + 0.5 * k.a * k.t * k.t : k.v * k.t - 0.5 * k.a * k.t * k.t) : (k.v * k.v - k.u * k.u) / (2 * k.a);
            if (k.v === undefined) k.v = k.t !== undefined ? k.u + k.a * k.t : Math.sqrt((k.u * k.u) + (2 * k.a * k.s));
            if (k.t === undefined) k.t = k.a !== 0 ? (k.v - k.u) / k.a : k.s / k.u;
            if (k.a === undefined) k.a = (k.v - k.u) / k.t;
            if (k.u === undefined) k.u = k.v - k.a * k.t;

            outBox.innerHTML = `
                <h4>Motion State Solution:</h4>
                <div class="form-grid-kinematics" style="margin-top:0.8rem;">
                    <div class="step-card">u: <strong>${k.u.toFixed(3)} m/s</strong></div>
                    <div class="step-card">v: <strong>${k.v.toFixed(3)} m/s</strong></div>
                    <div class="step-card">a: <strong>${k.a.toFixed(3)} m/s²</strong></div>
                    <div class="step-card">s: <strong>${k.s.toFixed(3)} m</strong></div>
                    <div class="step-card">t: <strong>${k.t.toFixed(3)} s</strong></div>
                </div>
            `;
            outBox.classList.remove("hidden");
        } catch (err) {
            outBox.innerHTML = `<span class="error-message">Calculation Refused: Check constraints.</span>`;
            outBox.classList.remove("hidden");
        }
    });

});
