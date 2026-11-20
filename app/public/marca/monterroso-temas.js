(function () {
  const TEMAS = {
    "vinoClaro": {"nombre":"Vino Monterroso · Claro","primary":"#7a2e3b","primaryDark":"#5c2130","primaryDeeper":"#3e121c","accent":"#a07a3f","bg":"#f7f2ea","bg2":"#fffdf9","bg3":"#efe7da","card":"#fffdf9","border":"#e2d6c4","text":"#2a1a1d","textMuted":"#6b5558","modo":"claro"},
    "vino": {"nombre":"Vino Monterroso · Oscuro","primary":"#7a2e3b","primaryDark":"#5c2130","primaryDeeper":"#3e121c","accent":"#c9a66b","bg":"#170f12","bg2":"#1d1418","bg3":"#26191e","card":"#1d1418","border":"#3d232a","text":"#f4ebe2","textMuted":"#b39a96","modo":"oscuro"},
    "dorado": {"nombre":"Dorado Formal","primary":"#d4a53f","primaryDark":"#b8862f","primaryDeeper":"#8a6524","accent":"#e8c76f","bg":"#111925","bg2":"#1a2433","bg3":"#23303f","card":"#1a2433","border":"#33445a","text":"#f2f4f6","textMuted":"#9aa7b8","modo":"oscuro"},
    "teal": {"nombre":"Teal Océano","primary":"#4f95a8","primaryDark":"#2e6a7a","primaryDeeper":"#1b3c42","accent":"#f5deac","bg":"#14282d","bg2":"#1b3c42","bg3":"#234750","card":"#1b3c42","border":"#2e5760","text":"#f2f6f5","textMuted":"#7fafbc","modo":"oscuro"},
    "olivini": {"nombre":"Olivini Gold","primary":"#c99a3e","primaryDark":"#a97f2f","primaryDeeper":"#3c4a2a","accent":"#b9c17e","bg":"#2b3320","bg2":"#34402a","bg3":"#3d4a30","card":"#34402a","border":"#4a5738","text":"#f1ecd2","textMuted":"#a9a877","modo":"oscuro"},
    "naranja": {"nombre":"Naranja Corp.","primary":"#e0703a","primaryDark":"#c85f2d","primaryDeeper":"#a84f25","accent":"#c9d0b0","bg":"#2f3128","bg2":"#3a3c31","bg3":"#45473b","card":"#3a3c31","border":"#52543f","text":"#eee9da","textMuted":"#a3ad94","modo":"oscuro"},
    "violeta": {"nombre":"Violeta Noche","primary":"#8b6ff0","primaryDark":"#6f52d6","primaryDeeper":"#4a3899","accent":"#c4b5fd","bg":"#141224","bg2":"#1e1a35","bg3":"#282242","card":"#1e1a35","border":"#3a3260","text":"#f1eefb","textMuted":"#a79cd6","modo":"oscuro"},
    "rosa": {"nombre":"Rosa Elegante","primary":"#d8577f","primaryDark":"#b7466a","primaryDeeper":"#7c2f47","accent":"#f0a6bf","bg":"#20131a","bg2":"#2c1a24","bg3":"#38232f","card":"#2c1a24","border":"#4a2c39","text":"#fbeef2","textMuted":"#cf9baf","modo":"oscuro"},
    "azulcielo": {"nombre":"Azul Clásico","primary":"#0ea5e9","primaryDark":"#0284c7","primaryDeeper":"#0369a1","accent":"#38bdf8","bg":"#0f172a","bg2":"#1e293b","bg3":"#273549","card":"#1e293b","border":"#2d3f55","text":"#f1f5f9","textMuted":"#94a3b8","modo":"oscuro"},
    "grafito": {"nombre":"Grafito","primary":"#8a94a6","primaryDark":"#6b7688","primaryDeeper":"#3d4452","accent":"#c3cad6","bg":"#15171c","bg2":"#1d2027","bg3":"#262a33","card":"#1d2027","border":"#343943","text":"#eef0f3","textMuted":"#98a0ad","modo":"oscuro"},
    "esmeralda": {"nombre":"Esmeralda","primary":"#22a878","primaryDark":"#1a8760","primaryDeeper":"#0f5c40","accent":"#7fe0bb","bg":"#0c1c17","bg2":"#12281f","bg3":"#183529","card":"#12281f","border":"#22463a","text":"#eafbf3","textMuted":"#8fc9ab","modo":"oscuro"},
    "medianoche": {"nombre":"Medianoche","primary":"#5b6ee1","primaryDark":"#4557c4","primaryDeeper":"#2b3a94","accent":"#a5b3f5","bg":"#0b0e1c","bg2":"#131728","bg3":"#1b2036","card":"#131728","border":"#2a3050","text":"#eef0fb","textMuted":"#9aa3d1","modo":"oscuro"},
    "cyberpunk": {"nombre":"Cyberpunk","primary":"#f637ec","primaryDark":"#d81fd0","primaryDeeper":"#7a0f74","accent":"#5ef0ff","bg":"#0a0212","bg2":"#150a24","bg3":"#20112f","card":"#150a24","border":"#3a1d55","text":"#f7ecff","textMuted":"#c69ae0","modo":"oscuro"},
    "lava": {"nombre":"Lava","primary":"#ff5722","primaryDark":"#e0451a","primaryDeeper":"#8f2a0f","accent":"#ffb185","bg":"#1a0e0a","bg2":"#251510","bg3":"#301c15","card":"#251510","border":"#4a2a1e","text":"#fff0e8","textMuted":"#d8a68f","modo":"oscuro"},
    "limon": {"nombre":"Limón Neón","primary":"#c6ea3c","primaryDark":"#a8cb26","primaryDeeper":"#5f7014","accent":"#e8f79e","bg":"#12140a","bg2":"#1a1d0f","bg3":"#232714","card":"#1a1d0f","border":"#39401e","text":"#f6f9e6","textMuted":"#b6c187","modo":"oscuro"},
    "aqua": {"nombre":"Aqua Retro","primary":"#26d0ce","primaryDark":"#1aada8","primaryDeeper":"#0f6d6a","accent":"#9df3f1","bg":"#08191a","bg2":"#0f2426","bg3":"#153033","card":"#0f2426","border":"#1f4448","text":"#e9fbfb","textMuted":"#83c2c1","modo":"oscuro"},
    "marfil": {"nombre":"Marfil Oficina","primary":"#8a6d3b","primaryDark":"#725a2f","primaryDeeper":"#4d3c1f","accent":"#b89b5e","bg":"#f7f4ec","bg2":"#ffffff","bg3":"#eee8d8","card":"#ffffff","border":"#ddd3ba","text":"#2c2717","textMuted":"#7a7156","modo":"claro"},
    "plataclaro": {"nombre":"Plata Clara","primary":"#3b5bdb","primaryDark":"#2f4bb8","primaryDeeper":"#1e3280","accent":"#7691f0","bg":"#f2f4f8","bg2":"#ffffff","bg3":"#e6eaf2","card":"#ffffff","border":"#d3d9e6","text":"#1a2233","textMuted":"#5c6780","modo":"claro"},
    "pastel": {"nombre":"Pastel Suave","primary":"#e07a9e","primaryDark":"#c95f85","primaryDeeper":"#9c3f63","accent":"#f5b7cc","bg":"#fdf5f8","bg2":"#ffffff","bg3":"#fbe8ee","card":"#ffffff","border":"#f0d3de","text":"#3a2530","textMuted":"#9a7382","modo":"claro"},
    "menta": {"nombre":"Menta Fresca","primary":"#2fb88a","primaryDark":"#249b73","primaryDeeper":"#166b4d","accent":"#8fe4c4","bg":"#f2fbf7","bg2":"#ffffff","bg3":"#e3f7ec","card":"#ffffff","border":"#c9ecdc","text":"#173327","textMuted":"#5c8f76","modo":"claro"},
    "durazno": {"nombre":"Durazno","primary":"#f0824e","primaryDark":"#d66935","primaryDeeper":"#9c4720","accent":"#f9bd97","bg":"#fef6f1","bg2":"#ffffff","bg3":"#fce8dc","card":"#ffffff","border":"#f2d2bc","text":"#3a271b","textMuted":"#9c7c65","modo":"claro"},
    "lila": {"nombre":"Lila Pastel","primary":"#9b8ad4","primaryDark":"#8171bd","primaryDeeper":"#5c4f96","accent":"#c9bdec","bg":"#f7f5fc","bg2":"#ffffff","bg3":"#ece7f7","card":"#ffffff","border":"#dbd2ef","text":"#2e2740","textMuted":"#8579a3","modo":"claro"},
    "grismate": {"nombre":"Gris Mate","primary":"#8f8f8f","primaryDark":"#767676","primaryDeeper":"#525252","accent":"#c4c4c4","bg":"#f4f4f4","bg2":"#ffffff","bg3":"#e8e8e8","card":"#ffffff","border":"#d6d6d6","text":"#2b2b2b","textMuted":"#7c7c7c","modo":"claro"},
    "cafe": {"nombre":"Café con Leche","primary":"#9c6b3f","primaryDark":"#805531","primaryDeeper":"#5a3b21","accent":"#c9a679","bg":"#fbf6f0","bg2":"#ffffff","bg3":"#f0e6d8","card":"#ffffff","border":"#e0d0ba","text":"#33261a","textMuted":"#8a7360","modo":"claro"},
    "negropuro": {"nombre":"Negro Puro","primary":"#e5e5e5","primaryDark":"#c4c4c4","primaryDeeper":"#8a8a8a","accent":"#ffffff","bg":"#000000","bg2":"#0d0d0d","bg3":"#1a1a1a","card":"#0d0d0d","border":"#2a2a2a","text":"#f5f5f5","textMuted":"#8a8a8a","modo":"oscuro"},
    "carbon": {"nombre":"Carbón","primary":"#a1a1aa","primaryDark":"#71717a","primaryDeeper":"#3f3f46","accent":"#d4d4d8","bg":"#18181b","bg2":"#212124","bg3":"#2a2a2e","card":"#212124","border":"#38383c","text":"#f4f4f5","textMuted":"#9b9ba3","modo":"oscuro"},
    "grisclaro": {"nombre":"Gris Claro","primary":"#525866","primaryDark":"#414753","primaryDeeper":"#2c313a","accent":"#7b8494","bg":"#f0f1f3","bg2":"#ffffff","bg3":"#e4e6ea","card":"#ffffff","border":"#d3d6dc","text":"#1e2126","textMuted":"#6b7280","modo":"claro"},
    "pizarra": {"nombre":"Pizarra","primary":"#64748b","primaryDark":"#52606f","primaryDeeper":"#374151","accent":"#94a3b8","bg":"#0f1115","bg2":"#171a20","bg3":"#1f232b","card":"#171a20","border":"#2d323c","text":"#eef0f3","textMuted":"#94a0b0","modo":"oscuro"},
    "azulmarino": {"nombre":"Azul Marino","primary":"#3b5998","primaryDark":"#2f477b","primaryDeeper":"#1e2f52","accent":"#7a9bd6","bg":"#0c1220","bg2":"#141c30","bg3":"#1c263e","card":"#141c30","border":"#2b3a5a","text":"#eef2fb","textMuted":"#8fa0c4","modo":"oscuro"},
    "azulrey": {"nombre":"Azul Rey","primary":"#2563eb","primaryDark":"#1d4ed8","primaryDeeper":"#1e3a8a","accent":"#93c5fd","bg":"#0a1226","bg2":"#0f1c38","bg3":"#152548","card":"#0f1c38","border":"#233768","text":"#eef3fd","textMuted":"#8ba5db","modo":"oscuro"},
    "azulhielo": {"nombre":"Azul Hielo","primary":"#3b82c4","primaryDark":"#2f68a3","primaryDeeper":"#1f4670","accent":"#a6d4f0","bg":"#f0f6fb","bg2":"#ffffff","bg3":"#e2eef8","card":"#ffffff","border":"#cbe0f2","text":"#152736","textMuted":"#5b7f96","modo":"claro"},
    "petroleo": {"nombre":"Azul Petróleo","primary":"#2a7f8c","primaryDark":"#216570","primaryDeeper":"#154349","accent":"#7fc2cc","bg":"#081b1e","bg2":"#0f292d","bg3":"#16373c","card":"#0f292d","border":"#254d52","text":"#e9f6f7","textMuted":"#7fabb1","modo":"oscuro"},
    "amarillosol": {"nombre":"Amarillo Sol","primary":"#eab308","primaryDark":"#ca8a04","primaryDeeper":"#854d0e","accent":"#fde047","bg":"#1a1608","bg2":"#26200e","bg3":"#332b13","card":"#26200e","border":"#4d4020","text":"#fdf9e8","textMuted":"#c9b878","modo":"oscuro"},
    "mostaza": {"nombre":"Mostaza","primary":"#d4a017","primaryDark":"#b3860f","primaryDeeper":"#7a5a0a","accent":"#f0cd6a","bg":"#1c1608","bg2":"#28200d","bg3":"#352a12","card":"#28200d","border":"#4f3f1c","text":"#faf3e0","textMuted":"#c4ac74","modo":"oscuro"},
    "amarilloclaro": {"nombre":"Amarillo Claro","primary":"#ca9a04","primaryDark":"#a97e03","primaryDeeper":"#785902","accent":"#f5d76e","bg":"#fdfaf0","bg2":"#ffffff","bg3":"#faf3d9","card":"#ffffff","border":"#f0e3ae","text":"#3a2f0d","textMuted":"#96803f","modo":"claro"},
    "chocolate": {"nombre":"Chocolate","primary":"#8b5a2b","primaryDark":"#734923","primaryDeeper":"#4a2f16","accent":"#c99a63","bg":"#170f08","bg2":"#22160d","bg3":"#2e1e12","card":"#22160d","border":"#4a331f","text":"#f5ebdd","textMuted":"#b8987a","modo":"oscuro"},
    "terracota": {"nombre":"Terracota","primary":"#c1622d","primaryDark":"#a34f23","primaryDeeper":"#6b3316","accent":"#e8a374","bg":"#1a0f09","bg2":"#26160d","bg3":"#331e12","card":"#26160d","border":"#4d321e","text":"#f9ece2","textMuted":"#c9a58b","modo":"oscuro"},
    "arena": {"nombre":"Arena","primary":"#a9885c","primaryDark":"#8d7049","primaryDeeper":"#5f4a30","accent":"#d4bd97","bg":"#f7f2e9","bg2":"#ffffff","bg3":"#efe6d3","card":"#ffffff","border":"#ddceb0","text":"#332818","textMuted":"#8a7757","modo":"claro"}
  };
  const PARES = {
    vino: { oscuro: 'vino', claro: 'vinoClaro' }, dorado: { oscuro: 'dorado', claro: 'marfil' }, azulrey: { oscuro: 'azulrey', claro: 'plataclaro' },
    rosa: { oscuro: 'rosa', claro: 'pastel' }, esmeralda: { oscuro: 'esmeralda', claro: 'menta' }, naranja: { oscuro: 'naranja', claro: 'durazno' },
    violeta: { oscuro: 'violeta', claro: 'lila' }, carbon: { oscuro: 'carbon', claro: 'grismate' }, chocolate: { oscuro: 'chocolate', claro: 'cafe' },
    pizarra: { oscuro: 'pizarra', claro: 'grisclaro' }, azulcielo: { oscuro: 'azulcielo', claro: 'azulhielo' }, amarillosol: { oscuro: 'amarillosol', claro: 'amarilloclaro' },
    mostaza: { oscuro: 'mostaza', claro: 'arena' }
  };
  const DE_PAR = {}; Object.keys(PARES).forEach(k => { if (PARES[k].claro !== k) DE_PAR[PARES[k].claro] = k; });
  const COLORES = Object.keys(TEMAS).filter(k => !DE_PAR[k]);
  const nombreBase = k => TEMAS[k].nombre.replace(/\s*·\s*(Claro|Oscuro)$/i, '');
  const CLAVE_GUARDADA = 'monterroso.tema', CLAVE_MODO = 'monterroso.modo';
  const POR_DEFECTO = 'vino';
  const leerDe = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const guardarEn = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {  } };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mezcla = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  function luminancia(h) {
    const c = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const contraste = (a, b) => { const x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  function hastaContraste(c, fondo, min) {
    const hacia = luminancia(fondo) > 0.4 ? '#000000' : '#ffffff';
    for (let i = 0; i < 60 && contraste(c, fondo) < min; i++) c = mezcla(c, hacia, 0.06);
    return c;
  }
  function calcular(t, modo) {
    const tinte = t.primary, v = { nombre: t.nombre, modo };
    if (modo === 'oscuro') {
      Object.assign(v, { bg: mezcla(tinte, '#0c0c0f', 0.9), bg2: mezcla(tinte, '#141418', 0.86), bg3: mezcla(tinte, '#1d1d22', 0.82) });
      v.card = v.bg2; v.border = mezcla(tinte, '#2c2c32', 0.66);
      v.text = hastaContraste(mezcla(tinte, '#f5f2ee', 0.92), v.bg2, 12);
      v.textMuted = hastaContraste(mezcla(tinte, '#a9a4a0', 0.82), v.bg2, 4.6);
      v.primary = hastaContraste(t.primary, v.bg, 2.2); v.primaryDark = mezcla(v.primary, '#000000', 0.18); v.primaryDeeper = mezcla(v.primary, v.bg, 0.62);
      v.accent = hastaContraste(t.accent, v.bg2, 4.6);
    } else {
      Object.assign(v, { bg: mezcla(tinte, '#fbfaf8', 0.94), bg2: '#ffffff', bg3: mezcla(tinte, '#f2f0ec', 0.9) });
      v.card = '#ffffff'; v.border = mezcla(tinte, '#e1ddd6', 0.8);
      v.text = hastaContraste(mezcla(tinte, '#17151b', 0.88), v.bg, 12);
      v.textMuted = hastaContraste(mezcla(tinte, '#615c62', 0.85), v.bg, 4.6);
      v.primary = hastaContraste(t.primary, v.bg, 4.6); v.primaryDark = mezcla(v.primary, '#000000', 0.18);
      v.primaryDeeper = luminancia(t.primaryDeeper) < 0.08 ? t.primaryDeeper : hastaContraste(mezcla(v.primary, '#000000', 0.35), '#ffffff', 7);
      v.accent = hastaContraste(t.accent, v.bg, 3);
    }
    return v;
  }
  function aHsl(h) { let [r, g, b] = rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let hh = 0, ss = 0;
    if (mx !== mn) { const d = mx - mn; ss = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [hh, ss, l]; }
  function deHsl(hh, ss, l) { hh = ((hh % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * ss, x = c * (1 - Math.abs((hh / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
    return hex([r, g, b].map(v => (v + m) * 255)); }
  const distTono = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const ESTADOS = { claro: { exito: '#2a7353', aviso: '#8a5a0f', peligro: '#b3261e', info: '#2f5d8a' }, oscuro: { exito: '#5cc49a', aviso: '#e0b04f', peligro: '#f07b72', info: '#7fb0e0' } };
  function estadosDe(v, color) {
    const base = ESTADOS[v.modo], out = {}, [hp, sp] = aHsl(v.primary), fondo = v.modo === 'claro' ? v.bg : v.bg2;
    Object.keys(base).forEach(k => { let c = base[k];
      if (color !== 'vino') { let [h, s2, l] = aHsl(c);
        const d = distTono(h, hp); if (sp > 0.22 && d < 26) { const lado = (((h - hp) % 360) + 360) % 360 < 180 ? 1 : -1, nh = h + lado * Math.min(20, 30 - d);
          if (!Object.keys(base).some(o => o !== k && distTono(nh, aHsl(base[o])[0]) < 24)) h = nh; }
        c = deHsl(h, Math.min(1, s2 * 1.08), l); }
      out[k] = hastaContraste(c, fondo, 4.6); });
    return out;
  }
  const GRUPOS = [
    ['Clásicos', ['vino', 'dorado', 'azulrey', 'azulmarino', 'pizarra', 'carbon', 'chocolate', 'mostaza', 'teal', 'petroleo']],
    ['Suaves', ['rosa', 'esmeralda', 'naranja', 'violeta', 'azulcielo', 'amarillosol', 'olivini', 'terracota', 'grafito', 'medianoche']],
    ['Vivos', ['cyberpunk', 'lava', 'limon', 'aqua', 'negropuro']]
  ];
  const cache = {};
  function version(clave, modo) {
    const color = DE_PAR[clave] || (TEMAS[clave] ? clave : POR_DEFECTO);
    modo = modo === 'claro' ? 'claro' : 'oscuro';
    const k = color + ':' + modo; if (cache[k]) return cache[k];
    const par = PARES[color], hecho = par ? TEMAS[par[modo]] : TEMAS[color].modo === modo ? TEMAS[color] : null;
    const v = Object.assign(hecho ? Object.assign({}, hecho) : calcular(TEMAS[color], modo), { nombre: hecho && par ? nombreBase(par[modo]) : nombreBase(color), color, modo, calculada: !hecho });
    v.par = par && nombreBase(par.claro) !== nombreBase(par.oscuro) ? nombreBase(par.claro) + ' · ' + nombreBase(par.oscuro) : nombreBase(color);
    v.textMuted = hastaContraste(hastaContraste(v.textMuted, v.bg, 4.6), v.bg2, 4.6);
    for (let i = 0; i < 20 && Math.max(contraste('#ffffff', v.primary), contraste('#1a1414', v.primary)) < 4.6; i++) v.primary = mezcla(v.primary, luminancia(v.primary) > 0.18 ? '#000000' : '#ffffff', 0.05);
    const fondoTxt = v.modo === 'claro' ? v.bg : v.bg2;
    v.primaryTexto = hastaContraste(hastaContraste(v.primary, fondoTxt, 4.6), v.card || fondoTxt, 4.6);
    v.resaltado = color === 'vino' ? (v.modo === 'oscuro' ? '#b85c6e' : v.primary) : v.modo === 'oscuro' ? hastaContraste(mezcla(v.primary, '#ffffff', 0.25), v.bg2, 4.6) : v.primaryTexto;
    v.estados = estadosDe(v, color);
    leible(v);
    return (cache[k] = v);
  }
  const mejorSobre = c => contraste('#ffffff', c) >= contraste('#1a1414', c) ? '#ffffff' : '#1a1414';
  function leible(v) {
    const hacia = v.modo === 'claro' ? '#000000' : '#ffffff', pT = v.modo === 'claro' ? 0.10 : 0.26, pE = v.modo === 'claro' ? 0.12 : 0.18;
    const empujar = (c, fondos, min) => { for (let i = 0; i < 80 && fondos.some(f => contraste(c, f) < min); i++) c = mezcla(c, hacia, 0.04); return c; };
    const lisos = [v.bg, v.bg2, v.bg3, v.card || v.bg2], tinte = c => [].concat(...[pT, 0.16].map(p => [mezcla(v.bg, c, p), mezcla(v.bg2, c, p), mezcla(v.bg3, c, p)]));
    Object.keys(v.estados).forEach(k => { let c = v.estados[k];
      for (let i = 0; i < 40; i++) { const f = [v.bg2, v.bg3].map(b => mezcla(b, c, pE)).concat([v.bg2, v.bg3].map(b => mezcla(b, c, 0.22))); if (f.every(x => contraste(c, x) >= 4.6)) break; c = mezcla(c, hacia, 0.04); }
      v.estados[k] = c; });
    const chipsEstado = [].concat(...Object.keys(v.estados).map(k => [mezcla(v.bg2, v.estados[k], pE), mezcla(v.bg3, v.estados[k], pE)]));
    const todas = lisos.concat(tinte(v.primary), chipsEstado);
    v.text = empujar(v.text, todas, 7);
    v.textMuted = empujar(v.textMuted, todas, 4.75);
    v.primaryTexto = empujar(v.primaryTexto, lisos.concat(tinte(v.primary)), 4.6);
    v.accentTexto = empujar(v.accent, lisos.concat(tinte(v.primary)), 4.6);
    v.resaltado = empujar(v.resaltado, lisos.concat(tinte(v.primary)), 4.6);
    v.sobre = { primary: mejorSobre(v.primary), lateral: luminancia(v.primaryDeeper) > 0.2 ? '#151111' : '#f4ebe2' };
    if (contraste(v.sobre.lateral, v.primaryDeeper) < 4.6) v.sobre.lateral = mejorSobre(v.primaryDeeper);
    Object.keys(v.estados).forEach(k => { v.sobre[k] = mejorSobre(v.estados[k]); });
    for (let p = v.modo === 'claro' ? 0.24 : 0.5; p > 0.05; p -= 0.04) {
      v.selFondo = mezcla(v.bg2, v.primary, p); v.selTexto = contraste(v.text, v.selFondo) >= 7 ? v.text : mejorSobre(v.selFondo);
      if (contraste(v.selTexto, v.selFondo) >= 7) break; }
  }
  function varsDe(t) {
    const m = {
      '--primary': t.primary, '--primary-dark': t.primaryDark, '--primary-deeper': t.primaryDeeper,
      '--accent': t.accent, '--bg': t.bg, '--bg2': t.bg2, '--bg3': t.bg3, '--card': t.card,
      '--border': t.border, '--text': t.text, '--text-muted': t.textMuted,
      '--primary-texto': t.primaryTexto, '--accent-texto': t.accentTexto, '--vino-suave': t.resaltado,
      '--sobre-primary': t.sobre.primary, '--sobre-lateral': t.sobre.lateral,
      '--sel-fondo': t.selFondo, '--sel-texto': t.selTexto
    };
    Object.keys(t.estados).forEach(k => { m['--' + k] = t.estados[k]; m['--sobre-' + k] = t.sobre[k];
      m['--' + k + '-fondo'] = 'color-mix(in srgb, ' + t.estados[k] + ' ' + (t.modo === 'claro' ? 12 : 18) + '%, transparent)'; });
    return m;
  }
  const LETRAS = { normal: 'Normal', grande: 'Grande', mayor: 'Más grande' };
  let letraPref = 'normal';
  const oscuroEquipo = () => !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  let pref = null;
  function aplicar(clave, modo) {
    if (clave && String(clave).includes(':')) { const p = String(clave).split(':'); clave = p[0]; modo = modo || p[1]; }
    const color = DE_PAR[clave] || (TEMAS[clave] ? clave : POR_DEFECTO);
    if (!modo && DE_PAR[clave]) modo = 'claro';
    pref = ['claro', 'oscuro', 'auto'].includes(modo) ? modo : pref || (TEMAS[clave] ? TEMAS[clave].modo : 'oscuro');
    const efectivo = pref === 'auto' ? (oscuroEquipo() ? 'oscuro' : 'claro') : pref, t = version(color, efectivo);
    const r = document.documentElement, mapa = varsDe(t);
    for (const v in mapa) r.style.setProperty(v, mapa[v]);
    r.dataset.tema = color;
    r.dataset.modo = efectivo;
    r.dataset.modoElegido = pref;
    r.style.colorScheme = efectivo === 'claro' ? 'light' : 'dark';
    guardarEn(CLAVE_GUARDADA, color); guardarEn(CLAVE_MODO, pref);
    document.dispatchEvent(new CustomEvent('monterroso:tema', { detail: { clave: color, modo: pref, efectivo, tema: t, letra: letraPref } }));
  }
  function letra(n) {
    letraPref = LETRAS[n] ? n : 'normal'; document.documentElement.dataset.letra = letraPref; guardarEn('monterroso.letra', letraPref);
    const r = document.documentElement; document.dispatchEvent(new CustomEvent('monterroso:tema', { detail: { clave: r.dataset.tema, modo: pref, efectivo: r.dataset.modo, tema: version(r.dataset.tema, r.dataset.modo), letra: letraPref } }));
  }
  function alternarModo() { aplicar(document.documentElement.dataset.tema, document.documentElement.dataset.modo === 'claro' ? 'oscuro' : 'claro'); }
  if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'), alCambiar = () => { if (pref === 'auto') aplicar(document.documentElement.dataset.tema, 'auto'); };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar); else if (mq.addListener) mq.addListener(alCambiar); }
  let previo = null;
  function vistaPrevia(color) {
    const r = document.documentElement;
    if (!color) { if (previo) { previo.forEach(([k, v]) => (v ? r.style.setProperty(k, v) : r.style.removeProperty(k))); r.dataset.modo = previo.modo; r.style.colorScheme = previo.esquema; previo = null; } return; }
    const efectivo = r.dataset.modo, t = version(color, efectivo);
    if (!previo) { previo = VARS.map(k => [k, r.style.getPropertyValue(k)]); previo.modo = r.dataset.modo; previo.esquema = r.style.colorScheme; }
    const val = varsDe(t);
    Object.keys(val).forEach(k => r.style.setProperty(k, val[k]));
  }
  const VARS = Object.keys(varsDe(version(POR_DEFECTO, 'oscuro')));
  window.MonterrosoTema = { TEMAS, COLORES, GRUPOS, VARS, LETRAS, version, aplicar, alternarModo, vistaPrevia, letra, letraActual: () => letraPref, contraste,
    actual: () => document.documentElement.dataset.tema, modo: () => pref, efectivo: () => document.documentElement.dataset.modo };
  letraPref = LETRAS[leerDe('monterroso.letra')] ? leerDe('monterroso.letra') : 'normal'; document.documentElement.dataset.letra = letraPref;
  const guardado = leerDe(CLAVE_GUARDADA) || POR_DEFECTO, modoGuardado = leerDe(CLAVE_MODO);
  aplicar(guardado, modoGuardado || undefined);
})();
