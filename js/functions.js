
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



   (function () {
    "use strict";
    var canvas = document.getElementById("layers"), hero = document.querySelector(".hero");
    if (!canvas || !hero) return;
 
    /* ====== AJUSTES (lo que puedes tocar) ====== */
    var config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 0.97,   // más cerca de 1 = el color dura más
        VELOCITY_DISSIPATION: 0.98,
        PRESSURE_DISSIPATION: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,                    // remolinos
        SPLAT_RADIUS: 0.5,           // tamaño de la mancha al mover el ratón
        BACK_COLOR: { r: 2, g: 3, b: 15 },
        BLOOM: true,
        BLOOM_ITERATIONS: 8,
        BLOOM_RESOLUTION: 256,
        BLOOM_INTENSITY: 0.8,
        BLOOM_THRESHOLD: 0.6,
        BLOOM_SOFT_KNEE: 0.7
    };
    /* Rangos de tono (0 a 1): verde/lima y magenta/violeta. Añade o quita rangos para cambiar los colores. */
    var HUES = [[0.55, 0.40], [0.75, 0.90], [0.90, 0.80], [0.95, 0.90], [0.05, 0.10], [0.15, 0.20], [0.25, 0.30], [0.35, 0.40]];
    var CHANGE_EVERY = 4000;         // ms entre cambios de color
    var IDLE_AFTER = 1200;           // ms sin ratón para que se mueva solo
 
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vis = true, lastMove = 0, hasPointer = false;
 
    function fallback() {
        canvas.style.background = "radial-gradient(60% 70% at 65% 55%,rgba(90, 121, 145, 0.35),transparent 70%),radial-gradient(40% 50% at 30% 40%,rgba(255,40,220,.22),transparent 70%),#02030f";
    }
 
    var pointers = [{ x: 0, y: 0, dx: 0, dy: 0, moved: false, color: null }];
 
    var ctx = getWebGLContext(canvas);
    if (!ctx || !ctx.ext.formatRGBA || !ctx.ext.formatRG || !ctx.ext.formatR) { fallback(); return; }
    var gl = ctx.gl, ext = ctx.ext;
    if (!ext.supportLinearFiltering) config.BLOOM = false;
 
    canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
    pointers[0].color = generateColor();
 
    function getWebGLContext(canvas) {
        var params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        var gl = canvas.getContext("webgl2", params);
        var isWebGL2 = !!gl;
        if (!isWebGL2) gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
        if (!gl) return null;
        var halfFloat, supportLinearFiltering;
        if (isWebGL2) {
            gl.getExtension("EXT_color_buffer_float");
            supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
        } else {
            halfFloat = gl.getExtension("OES_texture_half_float");
            supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
            if (!halfFloat) return null;
        }
        gl.clearColor(0, 0, 0, 1);
        var type = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES, rgba, rg, r;
        if (isWebGL2) {
            rgba = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            rg = getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            r = getSupportedFormat(gl, gl.R16F, gl.RED, type);
        } else {
            rgba = rg = r = getSupportedFormat(gl, gl.RGBA, gl.RGBA, type);
        }
        return { gl: gl, ext: { formatRGBA: rgba, formatRG: rg, formatR: r, halfFloatTexType: type, supportLinearFiltering: supportLinearFiltering } };
    }
    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F: return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F: return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default: return null;
            }
        }
        return { internalFormat: internalFormat, format: format };
    }
    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }
 
    /* ====== Shaders ====== */
    function compileShader(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
        return shader;
    }
    function GLProgram(vs, fs) {
        this.uniforms = {};
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs); gl.attachShader(this.program, fs); gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw gl.getProgramInfoLog(this.program);
        var n = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < n; i++) { var name = gl.getActiveUniform(this.program, i).name; this.uniforms[name] = gl.getUniformLocation(this.program, name); }
    }
    GLProgram.prototype.bind = function () { gl.useProgram(this.program); };
 
    var P = {};
    try {
        var baseVertexShader = compileShader(gl.VERTEX_SHADER, "precision highp float;attribute vec2 aPosition;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform vec2 texelSize;void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0.0);vR=vUv+vec2(texelSize.x,0.0);vT=vUv+vec2(0.0,texelSize.y);vB=vUv-vec2(0.0,texelSize.y);gl_Position=vec4(aPosition,0.0,1.0);}");
        var F = function (src) { return compileShader(gl.FRAGMENT_SHADER, src); };
        var clearShader = F("precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}");
        var colorShader = F("precision mediump float;uniform vec4 color;void main(){gl_FragColor=color;}");
        var displayShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTexture;void main(){vec3 C=texture2D(uTexture,vUv).rgb;float a=max(C.r,max(C.g,C.b));gl_FragColor=vec4(C,a);}");
        var displayBloomShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTexture;uniform sampler2D uBloom;void main(){vec3 C=texture2D(uTexture,vUv).rgb;vec3 bloom=texture2D(uBloom,vUv).rgb;bloom=pow(bloom.rgb,vec3(1.0/2.2));C+=bloom;float a=max(C.r,max(C.g,C.b));gl_FragColor=vec4(C,a);}");
        var bloomPrefilterShader = F("precision mediump float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uTexture;uniform vec3 curve;uniform float threshold;void main(){vec3 c=texture2D(uTexture,vUv).rgb;float br=max(c.r,max(c.g,c.b));float rq=clamp(br-curve.x,0.0,curve.y);rq=curve.z*rq*rq;c*=max(rq,br-threshold)/max(br,0.0001);gl_FragColor=vec4(c,0.0);}");
        var bloomBlurShader = F("precision mediump float;precision mediump sampler2D;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;void main(){vec4 sum=vec4(0.0);sum+=texture2D(uTexture,vL);sum+=texture2D(uTexture,vR);sum+=texture2D(uTexture,vT);sum+=texture2D(uTexture,vB);sum*=0.25;gl_FragColor=sum;}");
        var bloomFinalShader = F("precision mediump float;precision mediump sampler2D;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform float intensity;void main(){vec4 sum=vec4(0.0);sum+=texture2D(uTexture,vL);sum+=texture2D(uTexture,vR);sum+=texture2D(uTexture,vT);sum+=texture2D(uTexture,vB);sum*=0.25;gl_FragColor=sum*intensity;}");
        var splatShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1.0);}");
        var advectionManualFilteringShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform vec2 dyeTexelSize;uniform float dt;uniform float dissipation;vec4 bilerp(sampler2D sam,vec2 uv,vec2 tsize){vec2 st=uv/tsize-0.5;vec2 iuv=floor(st);vec2 fuv=fract(st);vec4 a=texture2D(sam,(iuv+vec2(0.5,0.5))*tsize);vec4 b=texture2D(sam,(iuv+vec2(1.5,0.5))*tsize);vec4 c=texture2D(sam,(iuv+vec2(0.5,1.5))*tsize);vec4 d=texture2D(sam,(iuv+vec2(1.5,1.5))*tsize);return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);}void main(){vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;gl_FragColor=dissipation*bilerp(uSource,coord,dyeTexelSize);gl_FragColor.a=1.0;}");
        var advectionShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform float dt;uniform float dissipation;void main(){vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;gl_FragColor=dissipation*texture2D(uSource,coord);gl_FragColor.a=1.0;}");
        var divergenceShader = F("precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x;float R=texture2D(uVelocity,vR).x;float T=texture2D(uVelocity,vT).y;float B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;if(vL.x<0.0){L=-C.x;}if(vR.x>1.0){R=-C.x;}if(vT.y>1.0){T=-C.y;}if(vB.y<0.0){B=-C.y;}float div=0.5*(R-L+T-B);gl_FragColor=vec4(div,0.0,0.0,1.0);}");
        var curlShader = F("precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;float vorticity=R-L-T+B;gl_FragColor=vec4(0.5*vorticity,0.0,0.0,1.0);}");
        var vorticityShader = F("precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;void main(){float L=texture2D(uCurl,vL).x;float R=texture2D(uCurl,vR).x;float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));force/=length(force)+0.0001;force*=curl*C;force.y*=-1.0;vec2 vel=texture2D(uVelocity,vUv).xy;gl_FragColor=vec4(vel+force*dt,0.0,1.0);}");
        var pressureShader = F("precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;float divergence=texture2D(uDivergence,vUv).x;float pressure=(L+R+B+T-divergence)*0.25;gl_FragColor=vec4(pressure,0.0,0.0,1.0);}");
        var gradientSubtractShader = F("precision mediump float;precision mediump sampler2D;varying highp vec2 vUv;varying highp vec2 vL;varying highp vec2 vR;varying highp vec2 vT;varying highp vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;void main(){float L=texture2D(uPressure,vL).x;float R=texture2D(uPressure,vR).x;float T=texture2D(uPressure,vT).x;float B=texture2D(uPressure,vB).x;vec2 velocity=texture2D(uVelocity,vUv).xy;velocity.xy-=vec2(R-L,T-B);gl_FragColor=vec4(velocity,0.0,1.0);}");
 
        P.clear = new GLProgram(baseVertexShader, clearShader);
        P.color = new GLProgram(baseVertexShader, colorShader);
        P.display = new GLProgram(baseVertexShader, displayShader);
        P.displayBloom = new GLProgram(baseVertexShader, displayBloomShader);
        P.bloomPrefilter = new GLProgram(baseVertexShader, bloomPrefilterShader);
        P.bloomBlur = new GLProgram(baseVertexShader, bloomBlurShader);
        P.bloomFinal = new GLProgram(baseVertexShader, bloomFinalShader);
        P.splat = new GLProgram(baseVertexShader, splatShader);
        P.advection = new GLProgram(baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
        P.divergence = new GLProgram(baseVertexShader, divergenceShader);
        P.curl = new GLProgram(baseVertexShader, curlShader);
        P.vorticity = new GLProgram(baseVertexShader, vorticityShader);
        P.pressure = new GLProgram(baseVertexShader, pressureShader);
        P.gradSub = new GLProgram(baseVertexShader, gradientSubtractShader);
    } catch (err) { fallback(); return; }
 
    var blit = (function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        return function (destination) { gl.bindFramebuffer(gl.FRAMEBUFFER, destination); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0); };
    })();
 
    /* ====== Framebuffers ====== */
    var simWidth, simHeight, dyeWidth, dyeHeight, density, velocity, divergence, curl, pressure, bloom, bloomFramebuffers = [];
 
    function getResolution(resolution) {
        var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        var max = Math.round(resolution * aspectRatio), min = Math.round(resolution);
        return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }
    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return { texture: texture, fbo: fbo, width: w, height: h, attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }
    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        var f1 = createFBO(w, h, internalFormat, format, type, param), f2 = createFBO(w, h, internalFormat, format, type, param);
        return { get read() { return f1; }, set read(v) { f1 = v; }, get write() { return f2; }, set write(v) { f2 = v; }, swap: function () { var t = f1; f1 = f2; f2 = t; } };
    }
    function resizeFBO(target, w, h, internalFormat, format, type, param) {
        var n = createFBO(w, h, internalFormat, format, type, param);
        P.clear.bind();
        gl.uniform1i(P.clear.uniforms.uTexture, target.attach(0));
        gl.uniform1f(P.clear.uniforms.value, 1);
        blit(n.fbo);
        return n;
    }
    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        return target;
    }
    function initFramebuffers() {
        var simRes = getResolution(config.SIM_RESOLUTION), dyeRes = getResolution(config.DYE_RESOLUTION);
        simWidth = simRes.width; simHeight = simRes.height; dyeWidth = dyeRes.width; dyeHeight = dyeRes.height;
        var t = ext.halfFloatTexType, rgba = ext.formatRGBA, rg = ext.formatRG, r = ext.formatR, filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        density = density == null ? createDoubleFBO(dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, t, filtering) : resizeDoubleFBO(density, dyeWidth, dyeHeight, rgba.internalFormat, rgba.format, t, filtering);
        velocity = velocity == null ? createDoubleFBO(simWidth, simHeight, rg.internalFormat, rg.format, t, filtering) : resizeDoubleFBO(velocity, simWidth, simHeight, rg.internalFormat, rg.format, t, filtering);
        divergence = createFBO(simWidth, simHeight, r.internalFormat, r.format, t, gl.NEAREST);
        curl = createFBO(simWidth, simHeight, r.internalFormat, r.format, t, gl.NEAREST);
        pressure = createDoubleFBO(simWidth, simHeight, r.internalFormat, r.format, t, gl.NEAREST);
        initBloomFramebuffers();
    }
    function initBloomFramebuffers() {
        var res = getResolution(config.BLOOM_RESOLUTION), t = ext.halfFloatTexType, rgba = ext.formatRGBA, filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        bloom = createFBO(res.width, res.height, rgba.internalFormat, rgba.format, t, filtering);
        bloomFramebuffers.length = 0;
        for (var i = 0; i < config.BLOOM_ITERATIONS; i++) {
            var w = res.width >> (i + 1), h = res.height >> (i + 1);
            if (w < 2 || h < 2) break;
            bloomFramebuffers.push(createFBO(w, h, rgba.internalFormat, rgba.format, t, filtering));
        }
    }
 
    /* ====== Simulación ====== */
    function step(dt) {
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, simWidth, simHeight);
        var tx = 1.0 / simWidth, ty = 1.0 / simHeight;
 
        P.curl.bind(); gl.uniform2f(P.curl.uniforms.texelSize, tx, ty); gl.uniform1i(P.curl.uniforms.uVelocity, velocity.read.attach(0)); blit(curl.fbo);
 
        P.vorticity.bind(); gl.uniform2f(P.vorticity.uniforms.texelSize, tx, ty);
        gl.uniform1i(P.vorticity.uniforms.uVelocity, velocity.read.attach(0)); gl.uniform1i(P.vorticity.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(P.vorticity.uniforms.curl, config.CURL); gl.uniform1f(P.vorticity.uniforms.dt, dt);
        blit(velocity.write.fbo); velocity.swap();
 
        P.divergence.bind(); gl.uniform2f(P.divergence.uniforms.texelSize, tx, ty); gl.uniform1i(P.divergence.uniforms.uVelocity, velocity.read.attach(0)); blit(divergence.fbo);
 
        P.clear.bind(); gl.uniform1i(P.clear.uniforms.uTexture, pressure.read.attach(0)); gl.uniform1f(P.clear.uniforms.value, config.PRESSURE_DISSIPATION);
        blit(pressure.write.fbo); pressure.swap();
 
        P.pressure.bind(); gl.uniform2f(P.pressure.uniforms.texelSize, tx, ty); gl.uniform1i(P.pressure.uniforms.uDivergence, divergence.attach(0));
        for (var i = 0; i < config.PRESSURE_ITERATIONS; i++) { gl.uniform1i(P.pressure.uniforms.uPressure, pressure.read.attach(1)); blit(pressure.write.fbo); pressure.swap(); }
 
        P.gradSub.bind(); gl.uniform2f(P.gradSub.uniforms.texelSize, tx, ty);
        gl.uniform1i(P.gradSub.uniforms.uPressure, pressure.read.attach(0)); gl.uniform1i(P.gradSub.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write.fbo); velocity.swap();
 
        P.advection.bind(); gl.uniform2f(P.advection.uniforms.texelSize, tx, ty);
        if (!ext.supportLinearFiltering) gl.uniform2f(P.advection.uniforms.dyeTexelSize, tx, ty);
        var velocityId = velocity.read.attach(0);
        gl.uniform1i(P.advection.uniforms.uVelocity, velocityId); gl.uniform1i(P.advection.uniforms.uSource, velocityId);
        gl.uniform1f(P.advection.uniforms.dt, dt); gl.uniform1f(P.advection.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write.fbo); velocity.swap();
 
        gl.viewport(0, 0, dyeWidth, dyeHeight);
        if (!ext.supportLinearFiltering) gl.uniform2f(P.advection.uniforms.dyeTexelSize, 1.0 / dyeWidth, 1.0 / dyeHeight);
        gl.uniform1i(P.advection.uniforms.uVelocity, velocity.read.attach(0)); gl.uniform1i(P.advection.uniforms.uSource, density.read.attach(1));
        gl.uniform1f(P.advection.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(density.write.fbo); density.swap();
    }
 
    function render() {
        if (config.BLOOM) applyBloom(density.read, bloom);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
        var width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
        gl.viewport(0, 0, width, height);
        P.color.bind();
        var bc = config.BACK_COLOR;
        gl.uniform4f(P.color.uniforms.color, bc.r / 255, bc.g / 255, bc.b / 255, 1);
        blit(null);
        var program = config.BLOOM ? P.displayBloom : P.display;
        program.bind();
        gl.uniform1i(program.uniforms.uTexture, density.read.attach(0));
        if (config.BLOOM) gl.uniform1i(program.uniforms.uBloom, bloom.attach(1));
        blit(null);
    }
 
    function applyBloom(source, destination) {
        if (bloomFramebuffers.length < 2) return;
        var last = destination;
        gl.disable(gl.BLEND);
        P.bloomPrefilter.bind();
        var knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
        gl.uniform3f(P.bloomPrefilter.uniforms.curve, config.BLOOM_THRESHOLD - knee, knee * 2, 0.25 / knee);
        gl.uniform1f(P.bloomPrefilter.uniforms.threshold, config.BLOOM_THRESHOLD);
        gl.uniform1i(P.bloomPrefilter.uniforms.uTexture, source.attach(0));
        gl.viewport(0, 0, last.width, last.height);
        blit(last.fbo);
 
        P.bloomBlur.bind();
        for (var i = 0; i < bloomFramebuffers.length; i++) {
            var dest = bloomFramebuffers[i];
            gl.uniform2f(P.bloomBlur.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
            gl.uniform1i(P.bloomBlur.uniforms.uTexture, last.attach(0));
            gl.viewport(0, 0, dest.width, dest.height);
            blit(dest.fbo);
            last = dest;
        }
        gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.BLEND);
        for (var j = bloomFramebuffers.length - 2; j >= 0; j--) {
            var baseTex = bloomFramebuffers[j];
            gl.uniform2f(P.bloomBlur.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
            gl.uniform1i(P.bloomBlur.uniforms.uTexture, last.attach(0));
            gl.viewport(0, 0, baseTex.width, baseTex.height);
            blit(baseTex.fbo);
            last = baseTex;
        }
        gl.disable(gl.BLEND);
        P.bloomFinal.bind();
        gl.uniform2f(P.bloomFinal.uniforms.texelSize, 1.0 / last.width, 1.0 / last.height);
        gl.uniform1i(P.bloomFinal.uniforms.uTexture, last.attach(0));
        gl.uniform1f(P.bloomFinal.uniforms.intensity, config.BLOOM_INTENSITY);
        gl.viewport(0, 0, destination.width, destination.height);
        blit(destination.fbo);
    }
 
    function splat(x, y, dx, dy, color) {
        gl.viewport(0, 0, simWidth, simHeight);
        P.splat.bind();
        gl.uniform1i(P.splat.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(P.splat.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(P.splat.uniforms.point, x / canvas.width, 1.0 - y / canvas.height);
        gl.uniform3f(P.splat.uniforms.color, dx, -dy, 1.0);
        gl.uniform1f(P.splat.uniforms.radius, config.SPLAT_RADIUS / 100.0);
        blit(velocity.write.fbo); velocity.swap();
        gl.viewport(0, 0, dyeWidth, dyeHeight);
        gl.uniform1i(P.splat.uniforms.uTarget, density.read.attach(0));
        gl.uniform3f(P.splat.uniforms.color, color.r, color.g, color.b);
        blit(density.write.fbo); density.swap();
    }
    function multipleSplats(amount) {
        for (var i = 0; i < amount; i++) {
            var c = generateColor(); c.r *= 10; c.g *= 10; c.b *= 10;
            splat(canvas.width * Math.random(), canvas.height * Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), c);
        }
    }
 
    /* ====== Colores ====== */
    function generateColor() {
        var range = HUES[Math.floor(Math.random() * HUES.length)];
        var c = HSVtoRGB(range[0] + Math.random() * (range[1] - range[0]), 1.0, 1.0);
        c.r *= 0.15; c.g *= 0.15; c.b *= 0.15;
        return c;
    }
    function HSVtoRGB(h, s, v) {
        var r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r: r, g: g, b: b };
    }
 
    /* ====== Ratón y movimiento automático ====== */
    function move(x, y, k) {
        var p = pointers[0];
        if (!hasPointer) { p.x = x; p.y = y; hasPointer = true; }
        p.dx = (x - p.x) * k; p.dy = (y - p.y) * k; p.x = x; p.y = y; p.moved = true;
    }
    hero.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        lastMove = performance.now();
        move(e.clientX - r.left, e.clientY - r.top, 5.0);
    });
    hero.addEventListener("pointerdown", function (e) {
        var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        lastMove = performance.now();
        pointers[0].color = generateColor();
        for (var i = 0; i < 5; i++) { var c = generateColor(); c.r *= 4; c.g *= 4; c.b *= 4; var a = Math.random() * 6.283; splat(x, y, Math.cos(a) * 600, Math.sin(a) * 600, c); }
    });
    setInterval(function () { pointers[0].color = generateColor(); }, CHANGE_EVERY);
 
    function autopilot(now) {
        var t = now / 1000, w = canvas.width, h = canvas.height;
        move(w * (0.5 + 0.38 * Math.sin(t * 0.8) * Math.cos(t * 0.37)), h * (0.5 + 0.34 * Math.sin(t * 0.65 + 1.3) * Math.cos(t * 0.29)), 5.0);
    }
 
    /* ====== Bucle ====== */
    function resizeCanvas() {
        if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return false;
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            var wasEmpty = canvas.width === 0 || canvas.height === 0;
            canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
            initFramebuffers();
            if (wasEmpty) multipleSplats(parseInt(Math.random() * 20) + 5);
        }
        return true;
    }
    function update(now) {
        if (vis && resizeCanvas()) {
            if (now - lastMove > IDLE_AFTER) autopilot(now);
            var p = pointers[0];
            if (p.moved) { splat(p.x, p.y, p.dx, p.dy, p.color); p.moved = false; }
            step(0.016);
            render();
        }
        requestAnimationFrame(update);
    }
 
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
    initFramebuffers();
    multipleSplats(parseInt(Math.random() * 20) + 5);
 
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(canvas);
 
    if (reduce) { for (var k = 0; k < 90; k++) step(0.016); render(); }
    else requestAnimationFrame(update);
})();

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

    /* Mascota Mochi: pasea por la pantalla */
    var pw = $("#pet-wrap"), pb = $("#pet-btn"), bub = $("#pet-bubble"), pm = $("#pet-msg"), pups = $$("#pet-btn .pup"), ptm = 0, poff = false, ti = 0;
    var pX = Math.max(10, innerWidth - 80), pY = Math.max(80, innerHeight - 90), tX = pX, tY = pY, pMode = "sit", pUntil = 0, pDrag = null, pLast = 0, pDir = 1, pClick = 0, mX = 0, mY = 0;
    var tips = ["¡Prrr! 💜 Gracias por la caricia.", "Arrástrame y cámbiame de sitio 🐾", "Haz doble clic y voy a por tu puntero 🐭", "Truco: prueba el código Konami (↑ ↑ ↓ ↓ ← → ← → B A).", "¿Has probado a jugar a «Salva al gatito»?", "Lucía busca prácticas o su primer empleo como programadora."];
    var MSG = { sobre: "Aquí conoces a Lucía: trabajadora, positiva y con ganas de aprender.", proyecto: "Kadi4Mat: su proyecto con una bioimpresora 3D. ¡Se presenta en CASEIB 2026!", experiencia: "Prácticas en el CCMI Jesús Usón y un curso en BMW Ceres Motor.", habilidades: "Pulsa los filtros para ver sus lenguajes y herramientas.", formacion: "Ahora estudia DAM en el IES Valle del Jerte.", juego: "¡Ayúdame! Que no me pillen los bugs 🐛", terminal: "Escribe «ayuda» en la terminal y te cuento más.", contacto: "¿Hablamos? Lucía busca prácticas o su primer empleo." };
    function say(t, ms) { var left = pX < innerWidth / 2; bub.style.left = left ? "0" : "auto"; bub.style.right = left ? "auto" : "0"; pm.textContent = t; bub.classList.add("show"); clearTimeout(ptm); ptm = setTimeout(function () { bub.classList.remove("show") }, ms || 7000) }
    function mode(m, ms) { pMode = m; pUntil = performance.now() + ms; pw.classList.toggle("walk", m === "walk" || m === "follow"); pw.classList.toggle("sleep", m === "sleep") }
    function pick() { tX = 8 + Math.random() * Math.max(10, innerWidth - 74); tY = 80 + Math.random() * Math.max(10, innerHeight - 160) }
    function clampP() { pX = Math.min(Math.max(4, pX), innerWidth - 60); pY = Math.min(Math.max(70, pY), innerHeight - 66) }
    function hearts(n) { for (var i = 0; i < n; i++)(function (i) { setTimeout(function () { var h = document.createElement("span"); h.className = "heart"; h.textContent = ["💜", "💖", "✨", "🐾"][i % 4]; h.style.left = (pX + 8 + Math.random() * 34) + "px"; h.style.top = (pY + 4) + "px"; document.body.appendChild(h); setTimeout(function () { h.remove() }, 1100) }, i * 120) })(i) }
    function jump() { pw.classList.remove("jump"); void pw.offsetWidth; pw.classList.add("jump"); setTimeout(function () { pw.classList.remove("jump") }, 520) }
    function follow() { say("¡Te sigo! Mueve el ratón 🐭", 4000); mode("follow", 15000); jump(); hearts(2) }
    function pet() {
        poff = false; var now = performance.now(), dbl = now - pClick < 350; pClick = now; jump(); hearts(4);
        if (dbl) follow()
        else { say(tips[ti++ % tips.length], 5000); if (pMode === "sleep") mode("sit", 3000) }
    }
    function tick(now) {
        var dt = Math.min(50, now - pLast) / 1000; pLast = now;
        if (!pDrag) {
            if (pMode === "follow") { tX = mX - 28; tY = mY - 31; if (now > pUntil) mode("sit", 1500) }
            if (pMode === "walk" || pMode === "follow") {
                var dx = tX - pX, dy = tY - pY, d = Math.sqrt(dx * dx + dy * dy), th = pMode === "follow" ? 70 : 4, sp = Math.min((pMode === "follow" ? 240 : 80) * dt, d);
                if (d > th) { pX += dx / d * sp; pY += dy / d * sp; if (Math.abs(dx) > 3) pDir = dx < 0 ? -1 : 1 }
                else if (pMode === "walk") mode(Math.random() < .35 ? "sleep" : "sit", 2500 + Math.random() * 4000);
                if (pMode === "follow") pw.classList.toggle("walk", d > th)
            } else if (now > pUntil) { pick(); mode("walk", 1e9) }
            clampP()
        }
        pw.style.transform = "translate3d(" + pX.toFixed(1) + "px," + pY.toFixed(1) + "px,0)"; pb.style.transform = "scaleX(" + pDir + ")";
        requestAnimationFrame(tick)
    }
    $("#pet-x").onclick = function () { poff = true; bub.classList.remove("show") };
    addEventListener("pointermove", function (e) {
        mX = e.clientX; mY = e.clientY;
        var r = pb.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.sqrt(dx * dx + dy * dy) || 1, s = Math.min(1, d / 220) * 3.6;
        pups.forEach(function (p) { p.setAttribute("transform", "translate(" + (dx / d * s * pDir).toFixed(2) + " " + (dy / d * s).toFixed(2) + ")") })
    }, { passive: true });
    pb.addEventListener("pointerdown", function (e) { pDrag = { ox: e.clientX - pX, oy: e.clientY - pY, moved: false }; pw.classList.add("grab"); if (pb.setPointerCapture) pb.setPointerCapture(e.pointerId) });
    pb.addEventListener("pointermove", function (e) { if (!pDrag) return; if (Math.abs(e.clientX - pX - pDrag.ox) + Math.abs(e.clientY - pY - pDrag.oy) > 6) pDrag.moved = true; if (pDrag.moved) { pX = e.clientX - pDrag.ox; pY = e.clientY - pDrag.oy; clampP(); pw.classList.remove("sleep") } });
    function drop() { if (!pDrag) return; var mv = pDrag.moved; pDrag = null; pw.classList.remove("grab"); if (mv) { say("¡Eh! Avisa antes 🙀", 3500); mode("sit", 3000); jump() } else pet() }
    pb.addEventListener("pointerup", drop); pb.addEventListener("pointercancel", function () { pDrag = null; pw.classList.remove("grab") });
    pb.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pet() } });
    pb.addEventListener("dblclick", function () { if (pMode !== "follow") follow() });
    pb.addEventListener("pointerenter", function () { if (pMode === "sleep") { mode("sit", 2500); say("¿Eh? 😺", 2000) } });
    addEventListener("resize", clampP);
    if ("IntersectionObserver" in window) {
        var pcur = "", po = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && e.target.id !== pcur) { pcur = e.target.id; if (!poff && MSG[pcur]) say(MSG[pcur]) } }) }, { rootMargin: "-45% 0px -50% 0px" });
        $$("section").forEach(function (s) { po.observe(s) })
    }
    mode("sit", 2500); if (reduce) pw.style.transform = "translate3d(" + pX + "px," + pY + "px,0)"; else requestAnimationFrame(function (t) { pLast = t; tick(t) });
    setTimeout(function () { if (!poff) say("¡Hola! Soy Mochi 🐾 Arrástrame, acaríciame o haz doble clic.", 6000) }, 1500);

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
