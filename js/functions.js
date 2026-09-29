
(function () {
    var $ = function (s) { return document.querySelector(s) }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)) };
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Tema */
    $("#theme").onclick = function () { var r = document.documentElement, d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = d ? "light" : "dark" };

    /* Menú móvil */
    var bg = $("#burger"), mn = $("#menu");
    function closeMenu() { mn.classList.remove("open"); bg.setAttribute("aria-expanded", "false") }
    bg.onclick = function () { var o = mn.classList.toggle("open"); bg.setAttribute("aria-expanded", o) };
    $$("#menu a").forEach(function (a) { a.onclick = closeMenu });
    addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu() });
    addEventListener("resize", function () { if (innerWidth > 860) closeMenu() });

    /* Inclinación de la tarjeta y sección activa en el menú */
    var tl = $("#tilt");
    if (tl && !reduce && matchMedia("(hover:hover)").matches) {
        tl.addEventListener("pointermove", function (e) { var r = tl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tl.style.transform = "perspective(800px) rotateY(" + (x * 10) + "deg) rotateX(" + (-y * 10) + "deg)" });
        tl.addEventListener("pointerleave", function () { tl.style.transform = "" })
    }
    var lk = $$("#menu a");
    if ("IntersectionObserver" in window) {
        var so = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) lk.forEach(function (a) { a.classList.toggle("act", a.getAttribute("href") === "#" + e.target.id) }) }) }, { rootMargin: "-45% 0px -50% 0px" });
        lk.forEach(function (a) { var t = $(a.getAttribute("href")); if (t) so.observe(t) })
    }

    /* Texto animado */
    var roles = ["programa en Java y Python", "despliega en Linux y Docker", "automatiza procesos", "aprende rápido"], ri = 0, ci = 0, del = false, t = $("#typed");
    function type() {
        var w = roles[ri]; t.textContent = w.slice(0, ci);
        if (!del && ci === w.length) { del = true; return setTimeout(type, 1400) }
        if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length }
        ci += del ? -1 : 1; setTimeout(type, del ? 35 : 70)
    }
    if (reduce) { t.textContent = roles[0] } else type();

    /* Capas de bioimpresión: líneas que se ondulan con el ratón */
    var vis = true, anim = true, cv = $("#layers"), cx = cv.getContext("2d"), W, H, mx = -999, my = -999, tt = 0;
    function size() { var r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0) }
    function col(n) { var s = getComputedStyle(document.documentElement); return [s.getPropertyValue("--mauve").trim(), s.getPropertyValue("--wine").trim()] }
    function draw() {
        cx.clearRect(0, 0, W, H); var L = Math.max(18, Math.floor(H / 22)), c = col();
        for (var i = 0; i < L; i++) {
            var y0 = H * .18 + i * (H * .8 / L), k = i / L; cx.beginPath();
            for (var x = 0; x <= W; x += (W < 600 ? 18 : 12)) {
                var y = y0 + Math.sin(x * .006 + tt + i * .25) * 10 * (.4 + k);
                var dx = x - mx, dy = y0 - my, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 160) y -= (1 - dd / 160) * 34;
                x ? cx.lineTo(x, y) : cx.moveTo(x, y)
            }
            cx.strokeStyle = i % 3 === 0 ? c[1] : c[0]; cx.globalAlpha = .16 + k * .4; cx.lineWidth = i % 3 === 0 ? 2 : 1.4; cx.stroke()
        }
        cx.globalAlpha = 1; if (!reduce && vis) { tt += .012; requestAnimationFrame(draw) } else anim = false
    }
    addEventListener("resize", function () { size(); if (reduce) draw() });
    $(".hero").addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top });
    $(".hero").addEventListener("pointerdown", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top });
    ["pointerleave", "pointerup", "pointercancel"].forEach(function (n) { $(".hero").addEventListener(n, function () { mx = my = -999 }) });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis && !anim && !reduce) { anim = true; draw() } }).observe(cv);
    size(); draw();

    /* Habilidades */
    var S = [["HTML", "code", 1], ["CSS", "code", 1], ["Java", "code", 1], ["Python", "code", 1], ["MySQL", "data", 1], ["Git", "tools", 1], ["GitHub", "tools", 1], ["Docker", "tools", 1], ["Adaptabilidad", "soft"], ["Trabajo en equipo", "soft"], ["Resolución de problemas", "soft"], ["Autoaprendizaje", "soft"], ["Pensamiento analítico-creativo", "soft"], ["Atención al detalle", "soft"], ["Autogestión", "soft"]];
    function render(f) { var box = $("#skills"); box.textContent = ""; S.filter(function (s) { return f === "all" || s[1] === f }).forEach(function (s, i) { var e = document.createElement("span"); e.className = "sk" + (s[2] ? " hard" : ""); e.textContent = s[0]; e.style.animationDelay = (i * 30) + "ms"; box.appendChild(e) }) }
    $$(".chip").forEach(function (b) { b.onclick = function () { $$(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false") }); b.setAttribute("aria-pressed", "true"); render(b.dataset.f) } });
    render("all");

    /* Idiomas */
    $$(".dots").forEach(function (d) { for (var i = 0; i < 5; i++) { var e = document.createElement("i"); if (i < +d.dataset.n) e.className = "on"; d.appendChild(e) } d.setAttribute("aria-label", "Nivel " + d.dataset.n + " de 5") });

    /* Terminal */
    var out = $("#out"), inp = $("#cmd"), C = {
        ayuda: "Comandos: sobre, skills, proyecto, estudios, idiomas, contacto, limpiar",
        sobre: "Lucía Elizo Gómez, desarrolladora de aplicaciones multiplataforma. Trabajadora, positiva y con ganas de aprender en cada proyecto.",
        skills: "Lenguajes: HTML, CSS, Java, Python\nBase de datos: MySQL\nHerramientas: Git, GitHub, Docker",
        proyecto: "Kadi4Mat: gestión de metadatos de bioimpresora 3D en Linux, con plugin de automatización. CASEIB 2026.",
        estudios: "DAM (IES Valle del Jerte, en curso), Bachillerato nocturno (2022–2024), Grado Medio en Electromecánica (2019–2020).",
        idiomas: "Español nativo, inglés avanzado (B1 oficial), francés principiante, japonés en desarrollo.",
        contacto: "luciagomez2300@gmail.com · 673 81 60 62 · Plasencia, Cáceres"
    };
    function log(t, c) { var d = document.createElement("div"); if (c) d.className = c; d.textContent = t; out.appendChild(d); out.scrollTop = out.scrollHeight }
    function ejecutar(v) {
        v = v.trim().toLowerCase(); if (!v) return; log("$ " + v, "cmd");
        if (v === "limpiar") { out.textContent = ""; return }
        log(C[v] || "Comando no encontrado: " + v + ". Escribe «ayuda» para ver la lista.")
    }
    log("Hola, soy la terminal de Lucía. Escribe «ayuda».");
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { ejecutar(inp.value); inp.value = "" } });
    $$(".hints button").forEach(function (b) { b.onclick = function () { ejecutar(b.textContent) } });

    /* Barra de progreso de scroll */
    addEventListener("scroll", function () { var h = document.documentElement; $("#bar").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + "%" }, { passive: true });

    /* Minijuego: salva al gatito */
    var board = $("#board"), cells = [], G = { score: 0, lives: 3, on: false, bugs: {}, sp: 0, mt: 0 }, best = 0;
    try { best = +localStorage.getItem("catbest") || 0 } catch (e) { }
    $("#gb").textContent = best;
    function hearts() { return "❤️".repeat(G.lives) + "🖤".repeat(3 - G.lives) }
    function rm(i) { delete G.bugs[i]; cells[i].textContent = ""; cells[i].classList.remove("up") }
    function mood(e, ms) { cells[4].textContent = e; clearTimeout(G.mt); G.mt = setTimeout(function () { cells[4].textContent = "🐱" }, ms) }
    for (var i = 0; i < 9; i++)(function (i) {
        var b = document.createElement("button"); b.className = "hole";
        if (i === 4) { b.classList.add("cat"); b.textContent = "🐱"; b.tabIndex = -1; b.setAttribute("aria-label", "Gatito") }
        else { b.setAttribute("aria-label", "Hueco " + (i + 1)); b.onclick = function () { if (!G.on || !G.bugs[i]) return; clearTimeout(G.bugs[i]); rm(i); G.score++; $("#gs").textContent = G.score; mood("😻", 300) } }
        board.appendChild(b); cells.push(b)
    })(i);
    function spawn() {
        if (!G.on) return;
        var max = Math.min(3, 1 + Math.floor(G.score / 10)), free = [0, 1, 2, 3, 5, 6, 7, 8].filter(function (i) { return !G.bugs[i] });
        if (Object.keys(G.bugs).length < max && free.length) {
            var n = free[Math.floor(Math.random() * free.length)];
            cells[n].textContent = "🐛"; cells[n].classList.add("up");
            G.bugs[n] = setTimeout(function () {
                rm(n); G.lives--; $("#gh").textContent = hearts(); cells[4].classList.add("hurt"); mood("😿", 500);
                setTimeout(function () { cells[4].classList.remove("hurt") }, 400); if (G.lives <= 0) end("El gatito se ha asustado demasiado.")
            }, Math.max(900, 2100 - G.score * 35))
        }
        G.sp = setTimeout(spawn, Math.max(450, 1100 - G.score * 18))
    }
    function end(r) {
        if (!G.on) return; G.on = false; clearTimeout(G.sp);
        Object.keys(G.bugs).forEach(function (k) { clearTimeout(G.bugs[k]); rm(k) });
        $("#gstart").disabled = false; $("#gstart").textContent = "Jugar otra vez"; $("#gstop").disabled = true;
        var m = r + " Has salvado al gatito de " + G.score + " bugs.";
        if (G.score > best) { best = G.score; $("#gb").textContent = best; m += " ¡Nuevo récord!"; try { localStorage.setItem("catbest", best) } catch (e) { } }
        $("#gmsg").textContent = m
    }
    $("#gstart").onclick = function () {
        G.score = 0; G.lives = 3; G.on = true; $("#gs").textContent = 0; $("#gh").textContent = hearts(); $("#gmsg").textContent = "";
        this.disabled = true; this.textContent = "Jugando…"; $("#gstop").disabled = false; cells[4].textContent = "🐱"; spawn()
    };
    $("#gstop").onclick = function () { end("Partida detenida.") };

    /* Easter egg: código Konami */
    var K = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], ki = 0;
    addEventListener("keydown", function (e) {
        ki = (e.key === K[ki]) ? ki + 1 : (e.key === K[0] ? 1 : 0);
        if (ki === K.length) { ki = 0; var t = $("#toast"); t.textContent = "🎮 Código Konami activado: contrátame y subo de nivel"; t.classList.add("show"); document.documentElement.dataset.theme = "dark"; setTimeout(function () { t.classList.remove("show"); t.textContent = "Email copiado" }, 3200) }
    });

    /* Copiar email */
    $("#copy").onclick = function () {
        var m = "luciagomez2300@gmail.com", ok = function () { var t = $("#toast"); t.classList.add("show"); setTimeout(function () { t.classList.remove("show") }, 1800) };
        try { navigator.clipboard.writeText(m).then(ok, function () { location.href = "mailto:" + m }) } catch (e) { location.href = "mailto:" + m }
    };
})();
