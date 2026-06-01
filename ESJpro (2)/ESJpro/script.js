/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDHns-KFFdvmEyhA66iWZo9GF-6dXvDCmU",
  authDomain: "esj-pro.firebaseapp.com",
  projectId: "esj-pro",
  storageBucket: "esj-pro.firebasestorage.app",
  messagingSenderId: "1080005611566",
  appId: "1:1080005611566:web:ead5aa8fb14c8f9c724fbf"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
db.enablePersistence({
  synchronizeTabs: true
})
  .then(() => {
    console.log("✅ Modo offline activado");
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.log("⚠️ La app ya está abierta en otra pestaña");
    } else if (err.code === "unimplemented") {
      console.log("⚠️ El navegador no soporta offline");
    } else {
      console.log(err);
    }
  });
/* =====================================================
   PIEZAS TIEMPO REAL
===================================================== */

function escucharPiezas() {
  db.collection("piezas")
    .orderBy("id", "desc")
    .onSnapshot(
      (snapshot) => {
        piezas = [];
        piezasPintura = [];
        historialFinal = [];

        snapshot.forEach((doc) => {
          const pieza = doc.data();

          if (!pieza) return;

          pieza.firebaseId = doc.id;

          pieza.historial = pieza.historial || [];

          pieza.fecha = pieza.fecha || obtenerFecha();

          pieza.estado = pieza.estado || "ARMADO";

          if (pieza.estado === "PINTURA") {
            piezasPintura.push(pieza);
          } else if (pieza.estado === "FINALIZADA") {
            historialFinal.push(pieza);
          } else {
            piezas.push(pieza);
          }
        });

        console.log("✅ PIEZAS CARGADAS");

        actualizarUI();
      },
      (error) => {
        console.log("❌ ERROR FIREBASE:", error);
      }
    );
}
/* =====================================================
   VARIABLES
===================================================== */

let piezas = [];

let piezasPintura = [];

let historialFinal = [];

let obras = JSON.parse(localStorage.getItem("obras")) || [
  "Nave CUU",
  "ESJ",
  "Porsche",
  "Prologis",
  "Prologis 4",
  "GCC",
  "JD Pinion",
  "Puerto del Aire",
  "Farmacia GDL",
  "Autozone"
];

const coloresObras = {
  "Nave CUU": "#42a5f5",
  ESJ: "#66bb6a",
  Porsche: "#ab47bc",
  Prologis: "#ec407a",
  "Prologis 4": "#f06292",
  GCC: "#ff7043",
  "JD Pinion": "#ffa726",
  "Puerto del Aire": "#26c6da",
  "Farmacia GDL": "#9ccc65",
  Autozone: "#ef5350"
};
const coloresEstado = {
  ARMADO: "#1565c0",
  SOLDADURA: "#d50000",
  LIMPIEZA: "#00c853",
  PINTURA: "#8e24aa",
  FINALIZADA: "#616161"
};

let ubicacionSeleccionada = "";

const ubicaciones = [
  "L1-F1",
  "L1-F2",
  "L2-F1",
  "L2-F2",
  "L3-F1",
  "L3-F2",
  "L4-F1",
  "L4-F2",
  "L5-F1",
  "L5-F2",
  "L5.5-F1",
  "L5.5-F2",
  "L6-F1",
  "L6-F2",
  "L7-F1",
  "L7-F2"
];

/* =====================================================
   SONIDO
===================================================== */
function reproducirSonido() {
  const audio = new Audio(
    "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
  );

  audio.volume = 1;

  audio.play();
}
/* =====================================================
   VALIDAR CALIDAD
===================================================== */

function validarCalidad() {
  const nombre = prompt("👷 Nombre de quien libera (CALIDAD):");

  if (!nombre) {
    alert("Debes ingresar nombre");
    return null;
  }

  const password = prompt("🔒 Ingresa contraseña:");

  const contraseñaCorrecta = "1234";

  if (password !== contraseñaCorrecta) {
    alert("❌ Contraseña incorrecta");
    return null;
  }

  reproducirSonido();

  return nombre;
}

/* =====================================================
   TABS
===================================================== */

function abrirTab(id, boton) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active-tab");
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const tab = document.getElementById(id);

  if (tab) {
    tab.classList.add("active-tab");
  }

  if (boton) {
    boton.classList.add("active");
  }
}

/* =====================================================
   GUARDAR
===================================================== */

async function guardarFirestore() {
  await db.collection("datos").doc("produccion").set({
    piezas,
    piezasPintura,
    historialFinal
  });
}

async function guardarObras() {
  await db.collection("datos").doc("obras").set({
    obras
  });
}
db.collection("datos")
  .doc("obras")
  .onSnapshot((doc) => {
    if (!doc.exists) return;

    obras = doc.data().obras || [];

    cargarObras();
  });

/* =====================================================
   ACTUALIZAR UI
===================================================== */
function actualizarUI() {
  mostrarPiezas();

  mostrarPintura();

  mostrarHistorialGeneral();

  mostrarReportes();

  actualizarMapaIndustrial();
}
/* =====================================================
   OBRAS
===================================================== */

function cargarObras() {
  const select = document.getElementById("obra");

  if (!select) return;

  select.innerHTML = "";

  obras.forEach((obra) => {
    const option = document.createElement("option");

    option.textContent = obra;

    select.appendChild(option);
  });
}

function agregarObra() {
  const nuevaObra = prompt("Nueva obra:");

  if (!nuevaObra) return;

  obras.push(nuevaObra);

  guardarObras();

  cargarObras();
}

/* =====================================================
   UBICACIONES
===================================================== */

function crearBotonesUbicacion() {
  const contenedor = document.getElementById("ubicaciones");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  ubicaciones.forEach((ubicacion) => {
    const btn = document.createElement("div");

    let claseZona = "";

    if (
      ubicacion.startsWith("L1") ||
      ubicacion.startsWith("L2") ||
      ubicacion.startsWith("L3")
    ) {
      claseZona = "zona1";
    } else if (ubicacion.startsWith("L4") || ubicacion.startsWith("L5")) {
      claseZona = "zona2";
    } else {
      claseZona = "zona3";
    }

    btn.className = `ubicacion-btn ${claseZona}`;

    btn.innerText = ubicacion;

    btn.onclick = () => {
      ubicacionSeleccionada = ubicacion;

      document.querySelectorAll(".ubicacion-btn").forEach((b) => {
        b.classList.remove("ubicacion-activa");
      });

      btn.classList.add("ubicacion-activa");
    };

    contenedor.appendChild(btn);
  });
}

/* =====================================================
   FECHAS
===================================================== */

function obtenerFecha() {
  const ahora = new Date();

  return (
    ahora.toLocaleDateString() +
    " " +
    ahora.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  );
}

/* =====================================================
   PIEZAS
===================================================== */

async function agregarPieza() {
  const nombre = document.getElementById("nombre")?.value.trim();

  const fase = document.getElementById("fase")?.value.trim();

  const obra = document.getElementById("obra")?.value;

  if (!nombre) {
    alert("Ingresa nombre");
    return;
  }

  if (!fase) {
    alert("Ingresa fase");
    return;
  }

  if (!ubicacionSeleccionada) {
    alert("Selecciona ubicación");
    return;
  }

  const nuevaPieza = {
    id: Date.now(),

    nombre,

    fase,

    obra,

    ubicacion: ubicacionSeleccionada,

    estado: "ARMADO",

    color: coloresObras[obra] || "#1565c0",

    colorEstado: coloresEstado["ARMADO"],

    fecha: obtenerFecha(),

    historial: [
      {
        accion: "REGISTRO EN ARMADO",

        fecha: obtenerFecha()
      }
    ]
  };

  try {
    await db.collection("piezas").add(nuevaPieza);

    document.getElementById("nombre").value = "";

    document.getElementById("fase").value = "";

    ubicacionSeleccionada = "";

    document.querySelectorAll(".ubicacion-btn").forEach((btn) => {
      btn.classList.remove("ubicacion-activa");
    });

    reproducirSonido();

    alert("✅ Pieza registrada");
  } catch (error) {
    console.log(error);

    alert("❌ Error guardando en Firebase");
  }
}

/* =====================================================
   CAMBIAR ESTADO
===================================================== */

async function cambiarEstado(id, estado) {
  const calidad = validarCalidad();

  if (!calidad) return;

  const pieza = piezas.find((p) => p.id === id);

  if (!pieza) return;

  pieza.estado = estado;

  pieza.colorEstado = coloresEstado[estado];

  pieza.historial.push({
    accion: `✅ LIBERADO A ${estado} POR ${calidad}`,

    fecha: obtenerFecha()
  });

  await db.collection("piezas").doc(pieza.firebaseId).update({
    estado: pieza.estado,

    colorEstado: pieza.colorEstado,

    historial: pieza.historial
  });
}

/* =====================================================
   MOVER A PINTURA
===================================================== */

async function moverAPintura(id) {
  const calidad = validarCalidad();

  if (!calidad) return;

  const pieza = piezas.find((p) => p.id === id);

  if (!pieza) return;

  pieza.estado = "PINTURA";

  pieza.colorEstado = coloresEstado["PINTURA"];

  pieza.historial.push({
    accion: `° LIBERADA A PINTURA POR ${calidad}`,

    fecha: obtenerFecha()
  });

  await db.collection("piezas").doc(pieza.firebaseId).update({
    estado: pieza.estado,

    colorEstado: pieza.colorEstado,

    historial: pieza.historial
  });
}
/* =====================================================
   ELIMINAR PIEZA
===================================================== */

async function eliminarPieza(id) {
  const confirmar = confirm("¿Eliminar pieza?");

  if (!confirmar) return;

  const pieza = piezas.find((p) => p.id == id);

  if (!pieza) {
    alert("❌ No se encontró la pieza");

    return;
  }

  if (!pieza.firebaseId) {
    alert("❌ firebaseId no encontrado");

    console.log(pieza);

    return;
  }

  try {
    await db.collection("piezas").doc(pieza.firebaseId).delete();

    reproducirSonido();

    alert("✅ Pieza eliminada");
  } catch (error) {
    console.log(error);

    alert("❌ Error eliminando pieza");
  }
}

/* =====================================================
   ELIMINAR PINTURA
===================================================== */

async function eliminarPiezaPintura(id) {
  const confirmar = confirm("¿Finalizar pieza?");

  if (!confirmar) return;

  const pieza = piezasPintura.find((p) => p.id === id);

  if (!pieza) return;

  pieza.estado = "FINALIZADA";

  pieza.colorEstado = coloresEstado["FINALIZADA"];

  pieza.historial.push({
    accion: "PIEZA FINALIZADA",

    fecha: obtenerFecha()
  });

  await db.collection("piezas").doc(pieza.firebaseId).update({
    estado: pieza.estado,

    colorEstado: pieza.colorEstado,

    historial: pieza.historial
  });
}
/* =====================================================
   ELIMINAR INDIVIDUAL
===================================================== */

async function eliminarPiezaIndividual(id, estado) {
  const confirmar = confirm("¿Eliminar esta pieza?");

  if (!confirmar) return;

  let pieza = null;

  if (estado === "PINTURA") {
    pieza = piezasPintura.find((p) => p.id == id);
  } else if (estado === "FINALIZADA") {
    pieza = historialFinal.find((p) => p.id == id);
  } else {
    pieza = piezas.find((p) => p.id == id);
  }

  if (!pieza) return;

  await db.collection("piezas").doc(pieza.firebaseId).delete();
}

/* =====================================================
   TOGGLE HISTORIAL
===================================================== */

function toggleHistorial(id) {
  const historial = document.getElementById(`historial-${id}`);

  if (!historial) return;

  historial.style.display =
    historial.style.display === "none" ? "block" : "none";
}
/* =====================================================
   MENU CONTEXTUAL UBICACIONES
===================================================== */

function toggleMenuLineas(id) {
  const menu = document.getElementById(`menu-lineas-${id}`);

  if (!menu) return;

  menu.classList.toggle("activo");
}

async function cambiarUbicacionPieza(id, nuevaUbicacion) {
  let pieza = piezas.find((p) => p.id === id);

  if (!pieza) {
    pieza = piezasPintura.find((p) => p.id === id);
  }

  if (!pieza) return;

  pieza.ubicacion = nuevaUbicacion;

  pieza.historial.push({
    accion: `📍 CAMBIO DE UBICACIÓN A ${nuevaUbicacion}`,
    fecha: obtenerFecha()
  });

  await db.collection("piezas").doc(pieza.firebaseId).update({
    ubicacion: pieza.ubicacion,
    historial: pieza.historial
  });

  reproducirSonido();
}
/* =====================================================
   MOSTRAR PIEZAS
===================================================== */

function mostrarPiezas() {
  const lista = document.getElementById("listaPiezas");

  if (!lista) return;

  lista.innerHTML = "";

  const textoBusqueda = "";

  const faseBusqueda =
    document.getElementById("buscarFase")?.value.toLowerCase() || "";

  [...piezas]
    .filter((pieza) => {
      const nombre = (pieza.nombre || "").toLowerCase();

      const obra = (pieza.obra || "").toLowerCase();

      const fase = (pieza.fase || "").toLowerCase();

      return fase.includes(faseBusqueda);
    })
    .reverse()
    .forEach((pieza) => {
      const div = document.createElement("div");

      div.className = "pieza";
      div.style.borderTop = `12px solid ${pieza.colorEstado || "#1565c0"}`;
      div.innerHTML = `

            <h2 class="titulo">
                ${pieza.nombre}
            </h2>

            <p class="info">
                ° ${pieza.obra}
            </p>
<p class="info">
° FASE ${pieza.fase || "N/A"}
</p>
            <p class="info">
                ° ${pieza.ubicacion}
            </p>

           <div class="estado ${(pieza.estado || "").toLowerCase()}">
              ${pieza.estado || "SIN ESTADO"}
            </div>

            <div class="botones">

                ${
                  pieza.estado === "ARMADO"
                    ? `

    <button
    class="action-btn soldadura"
    onclick="cambiarEstado(${pieza.id}, 'SOLDADURA')">

    SOLDADURA

    </button>

    <button
    class="action-btn"
    style="background:linear-gradient(135deg,#616161,#9e9e9e);"
    onclick="toggleMenuLineas(${pieza.id})">

    📍 LINEA

    </button>

    <div
    id="menu-lineas-${pieza.id}"
    class="context-menu-lineas">

      ${ubicaciones
        .map(
          (u) => `

          <button
          class="linea-context-btn"
          onclick="cambiarUbicacionPieza(${pieza.id}, '${u}')">
            ${u}
          </button>

        `
        )
        .join("")}

    </div>

    `
                    : ""
                }
${
  pieza.estado === "SOLDADURA"
    ? `

    <button
    class="action-btn limpieza"
    onclick="cambiarEstado(${pieza.id}, 'LIMPIEZA')">

    LIMPIEZA

    </button>

    <button
    class="action-btn"
    style="background:linear-gradient(135deg,#616161,#9e9e9e);"
    onclick="toggleMenuLineas(${pieza.id})">

    📍 LINEA

    </button>

    <div
    id="menu-lineas-${pieza.id}"
    class="context-menu-lineas">

      ${ubicaciones
        .map(
          (u) => `

          <button
          class="linea-context-btn"
          onclick="cambiarUbicacionPieza(${pieza.id}, '${u}')">
            ${u}
          </button>

        `
        )
        .join("")}

    </div>

    `
    : ""
}

                ${
                  pieza.estado === "LIMPIEZA"
                    ? `

    <button
    class="action-btn armado"
    onclick="moverAPintura(${pieza.id})">

    ° PINTURA

    </button>

    <button
    class="action-btn"
    style="background:linear-gradient(135deg,#616161,#9e9e9e);"
    onclick="toggleMenuLineas(${pieza.id})">

    📍 LINEA

    </button>

    <div
    id="menu-lineas-${pieza.id}"
    class="context-menu-lineas">

      ${ubicaciones
        .map(
          (u) => `

          <button
          class="linea-context-btn"
          onclick="cambiarUbicacionPieza(${pieza.id}, '${u}')">
            ${u}
          </button>

        `
        )
        .join("")}

    </div>

    `
                    : ""
                }

                <button
                class="action-btn historial-btn"
                onclick="toggleHistorial(${pieza.id})">

                HISTORIAL

                </button>

                <button
                class="action-btn delete-btn"
                onclick="eliminarPieza(${pieza.id})">

                ELIMINAR

                </button>

            </div>

            <div
            id="historial-${pieza.id}"
            class="historial"
            style="display:none;">

                ${pieza.historial
                  .map(
                    (item) => `

                    <div class="historial-item">

                        <p>
                        ⚙️ ${item.accion}
                        </p>

                        <p>
                        🕒 ${item.fecha}
                        </p>

                    </div>

                `
                  )
                  .join("")}

            </div>
        `;

      lista.appendChild(div);
    });
}

/* =====================================================
   MOSTRAR PINTURA
===================================================== */

function mostrarPintura() {
  const contenedor = document.getElementById("listaPintura");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  [...piezasPintura].reverse().forEach((pieza) => {
    contenedor.innerHTML += `

            <div class="pieza">

                <div
                style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                ">

                    <h2 class="titulo">
                        ${pieza.nombre}
                    </h2>

                    <button
                    onclick="eliminarPiezaPintura(${pieza.id})"
                    style="
                    width:55px;
                    min-width:55px;
                    margin-top:0;
                    background:linear-gradient(
                        135deg,
                        #212121,
                        #616161
                    );
                    font-size:24px;
                    border-radius:14px;
                    ">

                    ⋮

                    </button>

                </div>

                <p class="info">
                    ° ${pieza.obra}
                </p>

                <p class="info">
                    ° ${pieza.ubicacion}
                </p>

                <div class="estado limpieza">
                    ° PINTURA
                </div>

            </div>

        `;
  });
}

function obtenerNave(ubicacion) {
  if (
    ubicacion.startsWith("L1") ||
    ubicacion.startsWith("L2") ||
    ubicacion.startsWith("L3")
  ) {
    return "🏭 NAVE 1";
  }

  if (ubicacion.startsWith("L4") || ubicacion.startsWith("L5")) {
    return "🏭 NAVE 2";
  }

  return "🏭 NAVE 3";
}

function obtenerSemana(fechaTexto) {
  const fecha = new Date(fechaTexto);

  const primerDia = new Date(fecha.getFullYear(), 0, 1);

  const dias = Math.floor((fecha - primerDia) / (24 * 60 * 60 * 1000));

  const semana = Math.ceil((dias + 1) / 7);

  return `📅 SEMANA ${semana}`;
}

function obtenerMes(fechaTexto) {
  const fecha = new Date(fechaTexto);

  if (isNaN(fecha.getTime())) {
    return null;
  }

  const meses = [
    {
      nombre: "ENERO",
      color: "#42a5f5"
    },

    {
      nombre: "FEBRERO",
      color: "#ec407a"
    },

    {
      nombre: "MARZO",
      color: "#66bb6a"
    },

    {
      nombre: "ABRIL",
      color: "#ffa726"
    },

    {
      nombre: "MAYO",
      color: "#ab47bc"
    },

    {
      nombre: "JUNIO",
      color: "#26c6da"
    },

    {
      nombre: "JULIO",
      color: "#ef5350"
    },

    {
      nombre: "AGOSTO",
      color: "#8d6e63"
    },

    {
      nombre: "SEPTIEMBRE",
      color: "#5c6bc0"
    },

    {
      nombre: "OCTUBRE",
      color: "#d81b60"
    },

    {
      nombre: "NOVIEMBRE",
      color: "#43a047"
    },

    {
      nombre: "DICIEMBRE",
      color: "#fb8c00"
    }
  ];

  return meses[fecha.getMonth()];
}
/* =====================================================
   HISTORIAL GENERAL
===================================================== */

function mostrarHistorialGeneral() {
  const contenedor = document.getElementById("historialCompleto");

  if (!contenedor) return;

  contenedor.innerHTML = "";

  const historialCompleto = [...piezas, ...piezasPintura, ...historialFinal];

  const grupos = {};

  historialCompleto.forEach((pieza) => {
    if (!pieza.ubicacion) return;

    const nave = obtenerNave(pieza.ubicacion);

    const semana = obtenerSemana(pieza.fecha);

    const mes = obtenerMes(pieza.fecha);

    if (!mes) return;

    const nombreMes = mes.nombre;
    if (!grupos[nombreMes]) {
      grupos[nombreMes] = {
        color: mes.color,
        semanas: {}
      };
    }

    if (!grupos[nombreMes].semanas[semana]) {
      grupos[nombreMes].semanas[semana] = {};
    }

    if (!grupos[nombreMes].semanas[semana][nave]) {
      grupos[nombreMes].semanas[semana][nave] = {};
    }

    const faseKey = `FASE-${(pieza.fase || "SIN-FASE").replace(/\s/g, "-")}`;

    if (!grupos[nombreMes].semanas[semana][nave][faseKey]) {
      grupos[nombreMes].semanas[semana][nave][faseKey] = [];
    }

    grupos[nombreMes].semanas[semana][nave][faseKey].push(pieza);
  });

  Object.keys(grupos)
    .reverse()
    .forEach((nombreMes) => {
      const colorMes = grupos[nombreMes].color;

      contenedor.innerHTML += `

<details
style="
margin-bottom:20px;
background:white;
border-radius:22px;
padding:12px;
border-top:10px solid ${colorMes};
box-shadow:0 6px 16px rgba(0,0,0,0.12);
">

<summary
style="
cursor:pointer;
font-size:24px;
font-weight:bold;
color:${colorMes};
padding:10px;
">

📆 ${nombreMes}

</summary>

<div id="mes-${nombreMes}">
</div>

</details>

`;

      const mesDiv = document.getElementById(`mes-${nombreMes}`);

      Object.keys(grupos[nombreMes].semanas)
        .reverse()
        .forEach((semana) => {
          mesDiv.innerHTML += `

<details
style="
margin-top:15px;
background:#f5f5f5;
border-radius:18px;
padding:10px;
">

<summary
style="
cursor:pointer;
font-size:20px;
font-weight:bold;
color:#1565c0;
">

${semana}

</summary>

<div id="${nombreMes}-${semana}">
</div>

</details>

`;

          const semanaDiv = document.getElementById(`${nombreMes}-${semana}`);

          Object.keys(grupos[nombreMes].semanas[semana]).forEach((nave) => {
            semanaDiv.innerHTML += `

<details
style="
margin-top:15px;
background:white;
border-radius:18px;
padding:10px;
border-left:8px solid #37474f;
">

<summary
style="
cursor:pointer;
font-size:18px;
font-weight:bold;
color:#37474f;
">

${nave}

</summary>

<div id="${nombreMes}-${semana}-${nave}">
</div>

</details>

`;

            const naveDiv = document.getElementById(
              `${nombreMes}-${semana}-${nave}`
            );

            Object.keys(grupos[nombreMes].semanas[semana][nave])
              .reverse()
              .forEach((faseKey) => {
                const piezasFase =
                  grupos[nombreMes].semanas[semana][nave][faseKey];

                const nombreFase = piezasFase[0]?.fase || "SIN FASE";

                naveDiv.innerHTML += `

<div style="
margin-top:15px;
padding:12px;
border-radius:16px;
background:#eceff1;
font-weight:bold;
font-size:18px;
color:#263238;
">

° FASE ${nombreFase}

</div>

<div id="fase-${nombreMes}-${semana}-${nave}-${faseKey}">
</div>

`;

                const faseDiv = document.getElementById(
                  `fase-${nombreMes}-${semana}-${nave}-${faseKey}`
                );

                piezasFase.reverse().forEach((pieza) => {
                  let historialHTML = "";

                  (pieza.historial || []).forEach((item) => {
                    historialHTML += `

<div class="historial-item">

<p>
⚙️ ${item.accion}
</p>

<p>
🕒 ${item.fecha}
</p>

</div>

`;
                  });

                  const colorObra = coloresObras[pieza.obra] || "#1565c0";

                  faseDiv.innerHTML += `

<details class="historial-pieza"
style="
border-top:8px solid ${colorObra};
padding:15px;
margin-top:15px;
border-radius:18px;
background:white;
box-shadow:0 4px 12px rgba(0,0,0,0.08);
">

<summary style="
cursor:pointer;
list-style:none;
">

<div style="
display:flex;
justify-content:space-between;
align-items:center;
gap:10px;
">

<h3 style="
color:${colorObra};
margin:0;
">

🔩 ${pieza.nombre}

</h3>

<div
onclick="
event.stopPropagation();
eliminarPiezaIndividual(
'${pieza.id}',
'${pieza.estado}'
)"
style="
width:55px;
min-width:55px;
height:55px;
display:flex;
justify-content:center;
align-items:center;
background:linear-gradient(
135deg,
#212121,
#616161
);
color:white;
font-size:24px;
border-radius:14px;
cursor:pointer;
">

⋮

</div>

</div>

</summary>

<div style="margin-top:15px;">

<p>
° ${pieza.obra}
</p>

<p>
° Fase:
${pieza.fase || "SIN FASE"}
</p>

<p>
° ${pieza.ubicacion}
</p>

<p>
° Estado:
${pieza.estado}
</p>

<p>
 Registro:
${pieza.fecha}
</p>

${historialHTML}

</div>

</details>

`;
                });
              });
          });
        });
    });
}
/* =====================================================
   REPORTES
===================================================== */

function mostrarReportes() {
  const totalPiezas = document.getElementById("totalPiezas");

  const totalArmado = document.getElementById("totalArmado");

  const totalSoldadura = document.getElementById("totalSoldadura");

  const totalLimpieza = document.getElementById("totalLimpieza");

  if (totalPiezas) {
    totalPiezas.innerText = `🔩 Total piezas: ${
      piezas.length + piezasPintura.length + historialFinal.length
    }`;
  }

  if (totalArmado) {
    totalArmado.innerText = `🔵 Armado: ${
      piezas.filter((p) => p.estado === "ARMADO").length
    }`;
  }

  if (totalSoldadura) {
    totalSoldadura.innerText = `🔴 Soldadura: ${
      piezas.filter((p) => p.estado === "SOLDADURA").length
    }`;
  }

  if (totalLimpieza) {
    totalLimpieza.innerText = `🟢 Limpieza: ${
      piezas.filter((p) => p.estado === "LIMPIEZA").length
    }`;
  }
}

/* =====================================================
   SERVICE WORKER
===================================================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => {
        console.log("PWA lista");
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

/* =====================================================
   INICIO
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  cargarObras();

  crearBotonesUbicacion();

  escucharPiezas();

  actualizarUI();
});

async function iniciarSesion() {
  const email = document.getElementById("email-input").value.trim();

  const password = document.getElementById("password-input").value.trim();

  if (!email || !password) {
    alert("Completa los datos");

    return;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);

    document.getElementById("login-screen").style.display = "none";

    document.getElementById("app-container").style.display = "block";

    document.getElementById("logout-btn").style.display = "block";

    // ADMIN
    if (email === "admin@esj.com") {
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.style.display = "block";
      });
    }

    // SUPERVISORES
    else {
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        const texto = btn.innerText;
        if (!texto.includes("PRODUCCIÓN")) {
          btn.style.display = "none";
        }

        const mapaBtn = document.getElementById("mapa-btn");

        if (mapaBtn) {
          mapaBtn.style.display = "inline-block";
        }
        if (mapaBtn) {
          mapaBtn.style.display = "inline-block";
        }
      });

      abrirTab("produccion", document.querySelector(".tab-btn"));
    }

    alert("✅ Bienvenido");
  } catch (error) {
    console.log(error);

    alert("❌ Usuario o contraseña incorrectos");
  }
}
/* =====================================================
   CERRAR SESIÓN
===================================================== */

async function cerrarSesion() {
  const confirmar = confirm("¿Cerrar sesión?");

  if (!confirmar) return;

  await firebase.auth().signOut();

  document.getElementById("login-screen").style.display = "flex";

  document.getElementById("app-container").style.display = "none";

  document.getElementById("email-input").value = "";

  document.getElementById("password-input").value = "";
}
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("login-screen").style.display = "none";

    document.getElementById("app-container").style.display = "block";

    document.getElementById("logout-btn").style.display = "block";
    if (document.getElementById("mapa-btn")) {
      document.getElementById("mapa-btn").style.display = "inline-block";
    }
    // ADMIN

    if (user.email === "admin@esj.com") {
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.style.display = "block";
      });
    }

    // SUPERVISORES
    else {
      document.querySelectorAll(".tab-btn").forEach((btn) => {
        const texto = btn.innerText;

        if (!texto.includes("PRODUCCIÓN")) {
          btn.style.display = "none";
        }
      });

      abrirTab("produccion", document.querySelector(".tab-btn"));
    }
  } else {
    document.getElementById("login-screen").style.display = "flex";

    document.getElementById("app-container").style.display = "none";

    document.getElementById("logout-btn").style.display = "none";
  }
});
function exportarDatos() {
  const datos = {
    piezas,
    piezasPintura,
    historialFinal
  };

  const blob = new Blob([JSON.stringify(datos, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "backup-esj.json";

  a.click();
}

function actualizarMapaIndustrial() {
  // RESET TODAS LAS LÍNEAS

  ubicaciones.forEach((ubicacion) => {
    ["armado", "soldadura"].forEach((proceso) => {
      const linea = document.getElementById(`${ubicacion}-${proceso}`);

      if (!linea) return;

      linea.classList.remove("ocupada");

      linea.classList.add("libre");

      linea.innerHTML = `
        <span>${ubicacion}</span>
        <div class="info-linea">
          🟢 LIBRE
        </div>
      `;
    });
  });

  // PIEZAS ACTIVAS

  const piezasActivas = [...piezas, ...piezasPintura];

  piezasActivas.forEach((pieza) => {
    let proceso = "";

    if (pieza.estado === "ARMADO") {
      proceso = "armado";
    }

    if (pieza.estado === "SOLDADURA" || pieza.estado === "LIMPIEZA") {
      proceso = "soldadura";
    }

    const linea = document.getElementById(`${pieza.ubicacion}-${proceso}`);

    if (!linea) return;

    linea.classList.remove("libre");

    linea.classList.add("ocupada");

    // COLORES POR ESTADO

    if (pieza.estado === "ARMADO") {
      linea.style.background = "linear-gradient(135deg,#1565c0,#42a5f5)";
    }

    if (pieza.estado === "SOLDADURA") {
      linea.style.background = "linear-gradient(135deg,#d50000,#ff5252)";
    }

    if (pieza.estado === "LIMPIEZA") {
      linea.style.background = "linear-gradient(135deg,#616161,#9e9e9e)";
    }
    linea.innerHTML = `
      <span>${pieza.ubicacion}</span>

      <div class="info-linea">

        🔩 ${pieza.nombre}
        <br>

        🏗️ ${pieza.obra}
        <br>

        📍 FASE ${pieza.fase}
        <br>

        ⚙️ ${pieza.estado}

      </div>
    `;
  });

  // ÁREA PINTURA

  const pinturaDiv = document.getElementById("contenido-pintura-tv");

  if (pinturaDiv) {
    if (piezasPintura.length === 0) {
      pinturaDiv.innerHTML = "🟢 SIN PIEZAS";
    } else {
      pinturaDiv.innerHTML = "";

      piezasPintura.forEach((pieza) => {
        pinturaDiv.innerHTML += `

          <div class="pieza-pintura-tv">

            <strong>
              🔩 ${pieza.nombre}
            </strong>

            <br><br>

            🏗️ ${pieza.obra}

            <br>

            📍 ${pieza.ubicacion}

            <br>

            ⚙️ ${pieza.estado}

          </div>

        `;
      });
    }
  }
}
/* =====================================================
   ABRIR / CERRAR MAPA
===================================================== */

function abrirMapa() {
  document.getElementById("mapaOverlay").classList.add("activo");
}

function cerrarMapa() {
  document.getElementById("mapaOverlay").classList.remove("activo");
}
/* =====================================================
   MENU SESIÓN
===================================================== */

function toggleMenuSesion() {
  const menu = document.getElementById("menuSesion");

  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
}

/* =====================================================
   BUSCAR UBICACIÓN POR FASE
===================================================== */

function buscarUbicacionPorFase() {
  const texto = document
    .getElementById("buscarFaseMapa")
    .value.toLowerCase()
    .trim();

  const resultado = document.getElementById("resultadoBusquedaMapa");

  if (!resultado) return;

  resultado.innerHTML = "";

  if (!texto) {
    return;
  }

  const todas = [...piezas, ...piezasPintura, ...historialFinal];

  const filtradas = todas.filter((pieza) => {
    return pieza.fase && pieza.fase.toLowerCase().includes(texto);
  });

  if (filtradas.length === 0) {
    resultado.innerHTML = `
      <div class="resultado-fase">
        ❌ SIN RESULTADOS
      </div>
    `;

    return;
  }

  filtradas.reverse().forEach((pieza) => {
    resultado.innerHTML += `

      <div class="resultado-fase">

        🔩 ${pieza.nombre}

        <br><br>

        📍 UBICACIÓN:
        ${pieza.ubicacion}

        <br><br>

        ⚙️ ${pieza.estado}

        <br><br>

        🏗️ ${pieza.obra}

      </div>

    `;
  });
}
window.addEventListener("online", () => {
  console.log("🌐 INTERNET RECONECTADO");

  escucharPiezas();
});
/* =====================================================
   EXPORTAR EXCEL
===================================================== */

function exportarExcel() {
  const datos = [];

  const todasLasPiezas = [...piezas, ...piezasPintura, ...historialFinal];

  todasLasPiezas.forEach((pieza) => {
    datos.push({
      PIEZA: pieza.nombre,

      FASE: pieza.fase,

      OBRA: pieza.obra,

      UBICACION: pieza.ubicacion,

      ESTADO: pieza.estado,

      FECHA: pieza.fecha
    });
  });

  if (datos.length === 0) {
    alert("❌ No hay datos");

    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(datos);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "REGISTROS");

  XLSX.writeFile(workbook, "REGISTROS_ESJ.xlsx");
}