document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 1. THREE-BUTTON MAIN NAVIGATION (STRICTLY SHOWS ONE SECTION AT A TIME)
    // =========================================================================
    const mainButtons = document.querySelectorAll(".primary-tab-btn");
    const mainSections = document.querySelectorAll(".main-section");

    const activeClassMap = {
        "notes-section": "active-notes",
        "papers-section": "active-papers",
        "tools-section": "active-tools"
    };

    mainButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.section;

            mainButtons.forEach((b) => {
                b.classList.remove("active-notes", "active-papers", "active-tools");
            });
            btn.classList.add(activeClassMap[targetId]);

            mainSections.forEach((sec) => {
                sec.classList.toggle("hidden", sec.id !== targetId);
            });
        });
    });

    // =========================================================================
    // 2. NOTES SECTION (ANY SUBJECT + DOWNLOAD/OPEN AS REAL PDF)
    // =========================================================================
    const NOTES_STORAGE_KEY = "comp_portal_notes_v1";
    let activeSubjectFilter = "All";

    const defaultNotes = [
        {
            id: "n-1",
            subject: "Physics",
            topic: "Equations of Linear Motion",
            body: "Kinematics studies motion without forces.\nKey formulas:\nv = u + at\ns = ut + 1/2at^2\nv^2 = u^2 + 2as"
        },
        {
            id: "n-2",
            subject: "Chemistry",
            topic: "Moles & Gas Volume at RTP",
            body: "Moles (n) = Mass (m) / Molar Mass (M).\nAt Room Temperature and Pressure (RTP), 1 mole of any gas occupies 24.0 dm^3."
        },
        {
            id: "n-3",
            subject: "Biology",
            topic: "Osmosis & Diffusion",
            body: "Diffusion is the movement of particles from high to low concentration.\nOsmosis is the movement of water molecules across a partially permeable membrane."
        },
        {
            id: "n-4",
            subject: "Civic Education",
            topic: "Constitution & Governance",
            body: "A constitution is the supreme law of a land.\nGood governance promotes transparency, accountability, and the rule of law."
        }
    ];

    function loadNotes() {
        const saved = localStorage.getItem(NOTES_STORAGE_KEY);
        if (!saved) {
            localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(defaultNotes));
            return [...defaultNotes];
        }
        try {
            return JSON.parse(saved);
        } catch {
            return [...defaultNotes];
        }
    }

    function saveNotes(notes) {
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }

    function downloadNoteAsPdf(note) {
        if (window.jspdf && window.jspdf.jsPDF) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`${note.subject} - ${note.topic}`, 14, 20);
            doc.setFontSize(11);
            const wrapped = doc.splitTextToSize(note.body, 180);
            doc.text(wrapped, 14, 34);
            const safeName = `${note.subject}_${note.topic}`.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            doc.save(`${safeName}.pdf`);
        } else {
            // Fallback printable window if offline/CDN blocked
            const win = window.open("", "_blank");
            win.document.write(`<h2>${note.subject}: ${note.topic}</h2><pre style="font-family:sans-serif;white-space:pre-wrap;">${note.body}</pre>`);
            win.print();
        }
    }

    function renderNotes() {
        const notes = loadNotes();
        const filterBar = document.getElementById("notes-subject-filter");
        const listEl = document.getElementById("notes-list");

        const subjects = ["All", ...new Set(notes.map((n) => n.subject.trim()))];
        if (!subjects.includes(activeSubjectFilter)) activeSubjectFilter = "All";

        filterBar.innerHTML = "";
        subjects.forEach((subj) => {
            const pill = document.createElement("button");
            pill.type = "button";
            pill.className = `filter-pill ${subj === activeSubjectFilter ? "active" : ""}`;
            pill.textContent = subj;
            pill.addEventListener("click", () => {
                activeSubjectFilter = subj;
                renderNotes();
            });
            filterBar.appendChild(pill);
        });

        const visibleNotes = activeSubjectFilter === "All"
            ? notes
            : notes.filter((n) => n.subject.trim() === activeSubjectFilter);

        listEl.innerHTML = "";
        if (visibleNotes.length === 0) {
            listEl.innerHTML = `<p class="muted-text">No notes in this subject yet. Use the form above to add one.</p>`;
            return;
        }

        visibleNotes.forEach((note) => {
            const card = document.createElement("div");
            card.className = "note-card";
            card.innerHTML = `
                <div>
                    <span class="subject-tag">${escapeHtml(note.subject)}</span>
                    <h4>${escapeHtml(note.topic)}</h4>
                    <p class="note-preview">${escapeHtml(note.body)}</p>
                </div>
                <div class="card-actions">
                    <button type="button" class="btn btn-pdf">📄 Download PDF</button>
                    <button type="button" class="btn btn-delete">Delete</button>
                </div>
            `;

            card.querySelector(".btn-pdf").addEventListener("click", () => downloadNoteAsPdf(note));
            card.querySelector(".btn-delete").addEventListener("click", () => {
                const updated = loadNotes().filter((item) => item.id !== note.id);
                saveNotes(updated);
                renderNotes();
            });

            listEl.appendChild(card);
        });
    }

    document.getElementById("add-note-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const subject = document.getElementById("note-subject").value.trim();
        const topic = document.getElementById("note-topic").value.trim();
        const body = document.getElementById("note-body").value.trim();
        if (!subject || !topic || !body) return;

        const notes = loadNotes();
        notes.unshift({
            id: `n-${Date.now()}`,
            subject,
            topic,
            body
        });
        saveNotes(notes);
        activeSubjectFilter = "All";
        e.target.reset();
        renderNotes();
    });

    renderNotes();

    // =========================================================================
    // 3. PAST PAPERS SECTION (EXTERNAL LINKS)
    // =========================================================================
    const PAPERS_STORAGE_KEY = "comp_portal_papers_v1";

    const defaultPapers = [
        {
            id: "p-1",
            subject: "Physics",
            title: "2024 Science Paper 2 Past Paper",
            url: "https://www.google.com/search?q=ECZ+Physics+Paper+2+past+paper"
        },
        {
            id: "p-2",
            subject: "Chemistry",
            title: "2024 Chemistry Past Paper",
            url: "https://www.google.com/search?q=ECZ+Chemistry+past+paper"
        }
    ];

    function loadPapers() {
        const saved = localStorage.getItem(PAPERS_STORAGE_KEY);
        if (!saved) {
            localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(defaultPapers));
            return [...defaultPapers];
        }
        try {
            return JSON.parse(saved);
        } catch {
            return [...defaultPapers];
        }
    }

    function savePapers(papers) {
        localStorage.setItem(PAPERS_STORAGE_KEY, JSON.stringify(papers));
    }

    function renderPapers() {
        const papers = loadPapers();
        const listEl = document.getElementById("papers-list");
        listEl.innerHTML = "";

        papers.forEach((paper) => {
            const row = document.createElement("div");
            row.className = "paper-card";
            row.innerHTML = `
                <div>
                    <span class="subject-tag">${escapeHtml(paper.subject)}</span>
                    <h4>${escapeHtml(paper.title)}</h4>
                    <small class="muted-text">${escapeHtml(paper.url)}</small>
                </div>
                <div class="inline-group">
                    <a class="paper-link-btn" href="${escapeAttr(paper.url)}" target="_blank" rel="noopener noreferrer">Open Link ↗</a>
                    <button type="button" class="btn btn-delete">Remove</button>
                </div>
            `;
            row.querySelector(".btn-delete").addEventListener("click", () => {
                savePapers(loadPapers().filter((p) => p.id !== paper.id));
                renderPapers();
            });
            listEl.appendChild(row);
        });
    }

    document.getElementById("add-paper-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const subject = document.getElementById("paper-subject").value.trim();
        const title = document.getElementById("paper-title").value.trim();
        const url = document.getElementById("paper-url").value.trim();
        if (!subject || !title || !url) return;

        const papers = loadPapers();
        papers.unshift({ id: `p-${Date.now()}`, subject, title, url });
        savePapers(papers);
        e.target.reset();
        renderPapers();
    });

    renderPapers();

    // =========================================================================
    // 4. TOOLS SWITCHER (CHEMISTRY, MATH, PHYSICS)
    // =========================================================================
    const toolPills = document.querySelectorAll(".tool-pill");
    const toolBoxes = document.querySelectorAll(".tool-box");

    toolPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            const targetToolId = pill.dataset.tool;
            toolPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            toolBoxes.forEach((box) => box.classList.toggle("hidden", box.id !== targetToolId));
        });
    });

    // =========================================================================
    // 5. CHEMISTRY TOOL (BALANCER + STOICHIOMETRY + LIMITING REACTANT)
    // =========================================================================
    const ATOMIC_MASSES = {
        H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
        Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098,
        Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693,
        Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468,
        Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Ru: 101.07, Rh: 102.906, Pd: 106.42, Ag: 107.868,
        Cd: 112.414, In: 114.818, Sn: 118.710, Sb: 121.760, Te: 127.60, I: 126.904, Xe: 131.293, Cs: 132.905,
        Ba: 137.327, La: 138.905, Ce: 140.116, Pr: 140.908, Nd: 144.242, Sm: 150.36, Eu: 151.964, Gd: 157.25,
        Tb: 158.925, Dy: 162.500, Ho: 164.930, Er: 167.259, Tm: 168.934, Yb: 173.054, Lu: 174.967, Hf: 178.49,
        Ta: 180.948, W: 183.84, Re: 186.207, Os: 190.23, Ir: 192.217, Pt: 195.084, Au: 196.967, Hg: 200.592,
        Tl: 204.38, Pb: 207.2, Bi: 208.980, Th: 232.038, Pa: 231.036, U: 238.029
    };
    const RTP_VOLUME = 24.0;
    let currentBalanced = null;

    function normalizeArrow(str) {
        return (str || "").trim().replace(/(=>|→|⟶|=)/g, "->");
    }

    function parseFormula(formulaStr) {
        const map = {};
        const regex = /([A-Z][a-z]*)(\d*)/g;
        let m;
        while ((m = regex.exec(formulaStr)) !== null) {
            const el = m[1];
            if (!ATOMIC_MASSES[el]) throw new Error(`Unknown element: ${el}`);
            const cnt = parseInt(m[2] || "1", 10);
            map[el] = (map[el] || 0) + cnt;
        }
        if (Object.keys(map).length === 0) throw new Error(`Invalid formula: ${formulaStr}`);
        return map;
    }

    function molarMass(formulaStr) {
        const counts = parseFormula(formulaStr);
        return Object.entries(counts).reduce((sum, [el, c]) => sum + ATOMIC_MASSES[el] * c, 0);
    }

    function parseSide(sideStr) {
        return sideStr.split("+").map((part) => {
            const clean = part.trim();
            const match = clean.match(/^(\d*)([A-Za-z0-9]+)$/);
            if (!match) throw new Error(`Invalid term "${clean}".`);
            return { coeff: parseInt(match[1] || "1", 10), formula: match[2] };
        });
    }

    function balanceEquation(rawEq) {
        const norm = normalizeArrow(rawEq);
        if (!norm.includes("->")) {
            throw new Error("Couldn't find reactants and products. Try like this: H2 + O2 -> H2O");
        }
        const sides = norm.split("->");
        if (sides.length !== 2 || !sides[0].trim() || !sides[1].trim()) {
            throw new Error("Couldn't find reactants and products. Try like this: H2 + O2 -> H2O");
        }

        const reactants = parseSide(sides[0]);
        const products = parseSide(sides[1]);
        const all = [...reactants, ...products];

        const elements = [...new Set(all.flatMap((c) => Object.keys(parseFormula(c.formula))))];
        const matrix = elements.map((el) =>
            all.map((comp, idx) => {
                const count = parseFormula(comp.formula)[el] || 0;
                return idx < reactants.length ? count : -count;
            })
        );

        let solution = null;
        function search(idx, vec) {
            if (solution) return;
            if (idx === all.length) {
                const ok = matrix.every((row) => row.reduce((acc, v, i) => acc + v * vec[i], 0) === 0);
                if (ok) solution = [...vec];
                return;
            }
            for (let n = 1; n <= 12; n++) {
                vec[idx] = n;
                search(idx + 1, vec);
                if (solution) return;
            }
        }
        search(0, new Array(all.length).fill(1));
        if (!solution) throw new Error("Unable to balance automatically. Check formula spelling.");

        return {
            reactants: reactants.map((r, i) => ({ coeff: solution[i], formula: r.formula, mm: molarMass(r.formula) })),
            products: products.map((p, i) => ({ coeff: solution[reactants.length + i], formula: p.formula, mm: molarMass(p.formula) }))
        };
    }

    function formatReaction(bal) {
        const fmt = (arr) => arr.map((x) => `${x.coeff === 1 ? "" : x.coeff}${x.formula}`).join(" + ");
        return `${fmt(bal.reactants)} -> ${fmt(bal.products)}`;
    }

    document.getElementById("btn-chem-example").addEventListener("click", () => {
        document.getElementById("chem-eq-input").value = "Fe + Cl2 = FeCl3";
    });

    document.getElementById("btn-chem-balance").addEventListener("click", () => {
        const out = document.getElementById("chem-balance-output");
        const stoichPanel = document.getElementById("chem-stoich-panel");
        out.classList.remove("hidden", "error-panel");
        try {
            const bal = balanceEquation(document.getElementById("chem-eq-input").value);
            currentBalanced = bal;
            out.innerHTML = `<strong>Balanced Equation:</strong> <span style="color:#059669;font-weight:700;">${escapeHtml(formatReaction(bal))}</span>`;

            const select = document.getElementById("chem-known-species");
            select.innerHTML = "";
            [...bal.reactants, ...bal.products].forEach((item) => {
                const opt = document.createElement("option");
                opt.value = item.formula;
                opt.textContent = `${item.formula} (Mr = ${item.mm.toFixed(2)} g/mol)`;
                select.appendChild(opt);
            });
            stoichPanel.classList.remove("hidden");
        } catch (err) {
            currentBalanced = null;
            stoichPanel.classList.add("hidden");
            out.classList.add("error-panel");
            out.textContent = err.message;
        }
    });

    document.getElementById("btn-chem-solve").addEventListener("click", () => {
        const out = document.getElementById("chem-stoich-output");
        out.classList.remove("hidden", "error-panel");
        if (!currentBalanced) {
            out.classList.add("error-panel");
            out.textContent = "Balance an equation first.";
            return;
        }
        const knownFormula = document.getElementById("chem-known-species").value;
        const mass = parseFloat(document.getElementById("chem-known-mass").value);
        if (isNaN(mass) || mass <= 0) {
            out.classList.add("error-panel");
            out.textContent = "Please enter a valid positive mass in grams.";
            return;
        }

        const all = [...currentBalanced.reactants, ...currentBalanced.products];
        const known = all.find((x) => x.formula === knownFormula);
        const molesKnown = mass / known.mm;

        let html = `<div class="step-line">Moles of ${known.formula} = ${mass} / ${known.mm.toFixed(3)} = <strong>${molesKnown.toFixed(4)} mol</strong></div>`;
        all.forEach((target) => {
            if (target.formula === known.formula) return;
            const targetMoles = molesKnown * (target.coeff / known.coeff);
            const targetMass = targetMoles * target.mm;
            const isGas = ["H2", "O2", "Cl2", "N2", "CO2", "NH3", "SO2", "CH4"].includes(target.formula);
            const rtpText = isGas ? ` | Volume at RTP: <strong>${(targetMoles * RTP_VOLUME).toFixed(3)} dm³</strong>` : "";
            html += `<div class="step-line"><strong>${target.formula}</strong>: ${targetMoles.toFixed(4)} mol &rarr; <strong>${targetMass.toFixed(3)} g</strong>${rtpText}</div>`;
        });
        out.innerHTML = html;
    });

    document.getElementById("btn-lim-example").addEventListener("click", () => {
        document.getElementById("lim-eq-input").value = "Mg + O2 -> MgO";
        document.getElementById("lim-mass-a").value = "12";
        document.getElementById("lim-mass-b").value = "8";
    });

    document.getElementById("btn-lim-solve").addEventListener("click", () => {
        const out = document.getElementById("lim-output");
        out.classList.remove("hidden", "error-panel");
        try {
            const bal = balanceEquation(document.getElementById("lim-eq-input").value);
            if (bal.reactants.length !== 2) {
                throw new Error("Please provide a reaction with exactly 2 reactants.");
            }
            const mA = parseFloat(document.getElementById("lim-mass-a").value);
            const mB = parseFloat(document.getElementById("lim-mass-b").value);
            if (isNaN(mA) || isNaN(mB) || mA <= 0 || mB <= 0) {
                throw new Error("Please enter positive masses for both reactants.");
            }

            const [rA, rB] = bal.reactants;
            const molA = mA / rA.mm;
            const molB = mB / rB.mm;
            const rmr = rA.coeff / rB.coeff;
            const amr = molA / molB;

            let limiting, excess, leftover;
            if (amr < rmr) {
                limiting = rA;
                excess = rB;
                const usedB = molA * (rB.coeff / rA.coeff);
                leftover = Math.max(0, (molB - usedB) * rB.mm);
            } else {
                limiting = rB;
                excess = rA;
                const usedA = molB * (rA.coeff / rB.coeff);
                leftover = Math.max(0, (molA - usedA) * rA.mm);
            }

            out.innerHTML = `
                <div><strong>Balanced:</strong> ${escapeHtml(formatReaction(bal))}</div>
                <div class="step-line">Moles: ${rA.formula} = ${molA.toFixed(4)} mol | ${rB.formula} = ${molB.toFixed(4)} mol</div>
                <div class="step-line">RMR = ${rmr.toFixed(4)} | AMR = ${amr.toFixed(4)}</div>
                <div class="step-line"><strong>Limiting Reactant:</strong> <span style="color:#dc2626;">${limiting.formula}</span> &bull; <strong>Excess:</strong> ${excess.formula} &bull; <strong>Leftover Excess:</strong> ${leftover.toFixed(3)} g</div>
            `;
        } catch (err) {
            out.classList.add("error-panel");
            out.textContent = err.message;
        }
    });

    // =========================================================================
    // 6. MATH TOOL (QUADRATIC + 2/3-VAR SIMULTANEOUS)
    // =========================================================================
    document.getElementById("btn-quad-example").addEventListener("click", () => {
        document.getElementById("quad-a").value = "2";
        document.getElementById("quad-b").value = "-5";
        document.getElementById("quad-c").value = "-3";
    });

    document.getElementById("btn-quad-solve").addEventListener("click", () => {
        const out = document.getElementById("quad-output");
        out.classList.remove("hidden", "error-panel");
        const a = parseFloat(document.getElementById("quad-a").value);
        const b = parseFloat(document.getElementById("quad-b").value);
        const c = parseFloat(document.getElementById("quad-c").value);

        if ([a, b, c].some(isNaN) || a === 0) {
            out.classList.add("error-panel");
            out.textContent = "Please enter valid numbers for a, b, and c (with a not equal to 0).";
            return;
        }

        const d = b * b - 4 * a * c;
        let html = `<div class="step-line">Discriminant D = (${b})² - 4(${a})(${c}) = <strong>${d.toFixed(4)}</strong></div>`;
        if (d > 0) {
            const x1 = (-b + Math.sqrt(d)) / (2 * a);
            const x2 = (-b - Math.sqrt(d)) / (2 * a);
            html += `<div class="step-line"><strong>x₁ = ${x1.toFixed(4)}</strong> &nbsp;|&nbsp; <strong>x₂ = ${x2.toFixed(4)}</strong></div>`;
        } else if (d === 0) {
            const x = -b / (2 * a);
            html += `<div class="step-line"><strong>x = ${x.toFixed(4)}</strong> (repeated root)</div>`;
        } else {
            const re = -b / (2 * a);
            const im = Math.sqrt(-d) / (2 * a);
            html += `<div class="step-line"><strong>x₁ = ${re.toFixed(4)} + ${im.toFixed(4)}i</strong> &nbsp;|&nbsp; <strong>x₂ = ${re.toFixed(4)} - ${im.toFixed(4)}i</strong></div>`;
        }
        out.innerHTML = html;
    });

    document.querySelectorAll('input[name="sim-vars"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            const is3 = e.target.value === "3";
            document.getElementById("sim-2var-grid").classList.toggle("hidden", is3);
            document.getElementById("sim-3var-grid").classList.toggle("hidden", !is3);
        });
    });

    document.getElementById("btn-sim-solve").addEventListener("click", () => {
        const out = document.getElementById("sim-output");
        out.classList.remove("hidden", "error-panel");
        const mode = document.querySelector('input[name="sim-vars"]:checked').value;

        try {
            if (mode === "2") {
                const vals = ["s2-a1", "s2-b1", "s2-c1", "s2-a2", "s2-b2", "s2-c2"].map((id) => parseFloat(document.getElementById(id).value));
                if (vals.some(isNaN)) throw new Error("Fill all 6 values for the 2-variable system.");
                const [a1, b1, c1, a2, b2, c2] = vals;
                const det = a1 * b2 - b1 * a2;
                if (det === 0) throw new Error("Determinant is 0 — no unique solution.");
                const x = (c1 * b2 - b1 * c2) / det;
                const y = (a1 * c2 - c1 * a2) / det;
                out.innerHTML = `<div class="step-line"><strong>x = ${x.toFixed(4)}</strong> &nbsp;|&nbsp; <strong>y = ${y.toFixed(4)}</strong></div>`;
            } else {
                const vals = ["s3-a1", "s3-b1", "s3-c1", "s3-d1", "s3-a2", "s3-b2", "s3-c2", "s3-d2", "s3-a3", "s3-b3", "s3-c3", "s3-d3"]
                    .map((id) => parseFloat(document.getElementById(id).value));
                if (vals.some(isNaN)) throw new Error("Fill all 12 values for the 3-variable system.");
                const [a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3] = vals;
                const det3 = (m1, m2, m3, n1, n2, n3, p1, p2, p3) =>
                    m1 * (n2 * p3 - n3 * p2) - m2 * (n1 * p3 - n3 * p1) + m3 * (n1 * p2 - n2 * p1);
                const det = det3(a1, b1, c1, a2, b2, c2, a3, b3, c3);
                if (det === 0) throw new Error("Determinant is 0 — no unique solution.");
                const x = det3(d1, b1, c1, d2, b2, c2, d3, b3, c3) / det;
                const y = det3(a1, d1, c1, a2, d2, c2, a3, d3, c3) / det;
                const z = det3(a1, b1, d1, a2, b2, d2, a3, b3, d3) / det;
                out.innerHTML = `<div class="step-line"><strong>x = ${x.toFixed(4)}</strong> &nbsp;|&nbsp; <strong>y = ${y.toFixed(4)}</strong> &nbsp;|&nbsp; <strong>z = ${z.toFixed(4)}</strong></div>`;
            }
        } catch (err) {
            out.classList.add("error-panel");
            out.textContent = err.message;
        }
    });

    // =========================================================================
    // 7. PHYSICS KINEMATICS TOOL (EXACTLY 3 OF 5 VARIABLES)
    // =========================================================================
    const kinIds = ["p-u", "p-v", "p-a", "p-s", "p-t"];

    document.getElementById("btn-kin-reset").addEventListener("click", () => {
        kinIds.forEach((id) => { document.getElementById(id).value = ""; });
        document.getElementById("kin-output").classList.add("hidden");
    });

    document.getElementById("btn-kin-solve").addEventListener("click", () => {
        const out = document.getElementById("kin-output");
        out.classList.remove("hidden", "error-panel");

        const entries = [
            { key: "u", val: parseFloat(document.getElementById("p-u").value) },
            { key: "v", val: parseFloat(document.getElementById("p-v").value) },
            { key: "a", val: parseFloat(document.getElementById("p-a").value) },
            { key: "s", val: parseFloat(document.getElementById("p-s").value) },
            { key: "t", val: parseFloat(document.getElementById("p-t").value) }
        ];

        const known = entries.filter((e) => !isNaN(e.val));
        if (known.length !== 3) {
            out.classList.add("error-panel");
            out.textContent = "Please enter exactly 3 values. Leave the other 2 blank.";
            return;
        }

        const k = {};
        known.forEach((item) => { k[item.key] = item.val; });

        try {
            if (k.s === undefined) {
                if (k.t !== undefined && k.u !== undefined) k.s = k.u * k.t + 0.5 * k.a * k.t * k.t;
                else if (k.t !== undefined && k.v !== undefined) k.s = k.v * k.t - 0.5 * k.a * k.t * k.t;
                else if (k.a !== 0) k.s = (k.v * k.v - k.u * k.u) / (2 * k.a);
                else throw new Error("Cannot solve displacement with zero acceleration and no time.");
            }
            if (k.v === undefined) {
                if (k.t !== undefined) k.v = k.u + k.a * k.t;
                else {
                    const v2 = k.u * k.u + 2 * k.a * k.s;
                    if (v2 < 0) throw new Error("Physically impossible constraints (negative square root).");
                    k.v = Math.sqrt(v2);
                }
            }
            if (k.t === undefined) {
                if (k.a !== 0) k.t = (k.v - k.u) / k.a;
                else if (k.u !== 0) k.t = k.s / k.u;
                else throw new Error("Cannot solve time when u = 0 and a = 0.");
            }
            if (k.a === undefined) {
                if (k.t === 0) throw new Error("Time cannot be zero when solving acceleration.");
                k.a = (k.v - k.u) / k.t;
            }
            if (k.u === undefined) {
                k.u = k.v - k.a * k.t;
            }

            if ([k.u, k.v, k.a, k.s, k.t].some((n) => !Number.isFinite(n))) {
                throw new Error("Invalid or physically impossible values entered.");
            }

            out.innerHTML = `
                <div class="step-line"><strong>u</strong> = ${k.u.toFixed(3)} m/s &bull; <strong>v</strong> = ${k.v.toFixed(3)} m/s &bull; <strong>a</strong> = ${k.a.toFixed(3)} m/s²</div>
                <div class="step-line"><strong>s</strong> = ${k.s.toFixed(3)} m &bull; <strong>t</strong> = ${k.t.toFixed(3)} s</div>
            `;
        } catch (err) {
            out.classList.add("error-panel");
            out.textContent = err.message;
        }
    });

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeAttr(url) {
        const trimmed = String(url).trim();
        return /^https?:\/\//i.test(trimmed) ? escapeHtml(trimmed) : "#";
    }
});
