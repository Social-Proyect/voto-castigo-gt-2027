// ...existing code...
// --- INICIALIZACIÓN DE SUPABASE ---
window.SUPABASE_URL = 'https://fcevakmwpcujvaermkzo.supabase.co'; 
window.SUPABASE_ANON_KEY = 'sb_publishable_WQGmuNXfqjdk7o9heE1hfA_N_-uJ6IS';
const { createClient } = supabase;
const supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Variables globales para la búsqueda
let listaDiputadosCompleta = [];

// --- EVENTOS AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    inicializar();
});

// --- FUNCIÓN PRINCIPAL DE INICIO ---
async function inicializar() {
    await obtenerDiputados();
    await obtenerTotalVotos();
    inicializarBuscador();
}

// --- 1. OBTENER DATOS DE SUPABASE (Real-time read) ---
async function obtenerDiputados() {
    const grid = document.getElementById('grid-diputados');
    
    const { data, error } = await supabaseClient
        .from('diputados')
        .select('*')
        .order('votos_castigo', { ascending: false }); // Ordenar por los más castigados

    if (error) {
        grid.innerHTML = `<div class="error">Error al conectar con la base de datos de 2027.</div>`;
        console.error("Error de Supabase:", error);
        return;
    }

    listaDiputadosCompleta = data; // Guardar para la búsqueda local
    renderizarTarjetas(data);
        const gridPartidos = document.getElementById('grid-partidos');
        const gridListadoNacional = document.getElementById('grid-listado-nacional');
        const gridDistritales = document.getElementById('grid-distritales');

        // Separar por tipo
        const partidos = data.filter(d => d.tipo === 'partido');
        const listadoNacional = data.filter(d => d.tipo === 'listado_nacional');
        const distritales = data.filter(d => d.tipo === 'distrital');

        renderizarTarjetas(partidos, gridPartidos);
        renderizarTarjetas(listadoNacional, gridListadoNacional);
        renderizarTarjetas(distritales, gridDistritales);
}

// --- 2. MOSTRAR TARJETAS EN EL GRID ---
function renderizarTarjetas(diputados) {
    function renderizarTarjetas(diputados, grid) {
        if (!grid) return;
        grid.innerHTML = '';

        if (!diputados || diputados.length === 0) {
            grid.innerHTML = `<div class="loading-spinner">No se encontraron resultados en esta sección.</div>`;
            return;
        }

        diputados.forEach(d => {
            // Lógica de "Alto Riesgo" (borde rojo si tiene > 100 votos)
            const riesgoClase = d.votos_castigo > 100 ? 'alto-riesgo' : '';
            const badgeHTML = d.votos_castigo > 100 ? `<div class="status-badge red">Reelección en Riesgo</div>` : '';

            const card = `
                <div class="diputado-card ${riesgoClase}" data-id="${d.id}">
                    ${badgeHTML}
                    <div class="card-details">
                        <h3 class="nombre">${d.nombre}</h3>
                        <p class="partido">${d.partido}</p>
                        <p class="distrito">${d.distrito}</p>
                    </div>
                    <div class="votos-container">
                        <span class="votos-count" id="votos-${d.id}">${d.votos_castigo}</span>
                        <span class="votos-label">Guatemaltecos NO votarán por él</span>
                    </div>
                    <button onclick="procesarVoto(${d.id})" class="btn-castigo" id="btn-${d.id}">
                        🗳️ Emitir Voto de Castigo 2027
                    </button>
                </div>
            `;
            grid.innerHTML += card;
        });
    function renderizarTarjetas(diputados, grid) {
        if (!grid) return;
        grid.innerHTML = '';

        if (!diputados || diputados.length === 0) {
            grid.innerHTML = `<div class="loading-spinner">No se encontraron resultados en esta sección.</div>`;
            return;
        }

        diputados.forEach(d => {
            // Lógica de "Alto Riesgo" (borde rojo si tiene > 100 votos)
            const riesgoClase = d.votos_castigo > 100 ? 'alto-riesgo' : '';
            const badgeHTML = d.votos_castigo > 100 ? `<div class="status-badge red">Reelección en Riesgo</div>` : '';

            const card = `
                <div class="diputado-card ${riesgoClase}" data-id="${d.id}">
                    ${badgeHTML}
                    <div class="card-details">
                        <h3 class="nombre">${d.nombre}</h3>
                        <p class="partido">${d.partido}</p>
                        <p class="distrito">${d.distrito}</p>
                    </div>
                    <div class="votos-container">
                        <span class="votos-count" id="votos-${d.id}">${d.votos_castigo}</span>
                        <span class="votos-label">Guatemaltecos NO votarán por él</span>
                    </div>
                    <button onclick="procesarVoto(${d.id})" class="btn-castigo" id="btn-${d.id}">
                        🗳️ Emitir Voto de Castigo 2027
                    </button>
                </div>
            `;
            grid.innerHTML += card;
        });
}

// --- 3. LÓGICA DEL BUSCADOR EN TIEMPO REAL (oninput) ---
function inicializarBuscador() {
    const inputBuscador = document.getElementById('buscador');
    inputBuscador.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase();
        // Filtrar por nombre o distrito
        const partidos = listaDiputadosCompleta.filter(d => d.tipo === 'partido' && (d.nombre.toLowerCase().includes(busqueda) || d.distrito.toLowerCase().includes(busqueda)));
        const listadoNacional = listaDiputadosCompleta.filter(d => d.tipo === 'listado_nacional' && (d.nombre.toLowerCase().includes(busqueda) || d.distrito.toLowerCase().includes(busqueda)));
        const distritales = listaDiputadosCompleta.filter(d => d.tipo === 'distrital' && (d.nombre.toLowerCase().includes(busqueda) || d.distrito.toLowerCase().includes(busqueda)));
        renderizarTarjetas(partidos, document.getElementById('grid-partidos'));
        renderizarTarjetas(listadoNacional, document.getElementById('grid-listado-nacional'));
        renderizarTarjetas(distritales, document.getElementById('grid-distritales'));
    });
}

// --- 4. PROCESAR VOTO (IP + Supabase RPC) ---
async function procesarVoto(idDiputado) {
    const btn = document.getElementById(`btn-${idDiputado}`);
    btn.disabled = true; // Deshabilitar para evitar múltiples clicks
    btn.innerText = "Procesando...";

    try {
        // A. Obtener IP pública del usuario (Protección Anti-Fraude)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error("No se pudo obtener la IP.");
        const ipData = await ipResponse.json();
        const userIp = ipData.ip;

        // B. Llamar a la función segura de Supabase (RPC) que creamos
        const { data: resultado, error } = await supabaseClient
            .rpc('incrementar_voto_castigo_seguro', { 
                target_id: idDiputado, 
                user_ip: userIp 
            });

        if (error) throw error;

        if (resultado === 'ya_votaste') {
            alert("⚠️ La democracia se protege con honestidad. Tu dirección IP ya registra un voto de castigo para este diputado.");
            btn.innerText = "Ya votaste por él";
        } else {
            alert("✅ Tu voto de castigo ha sido registrado. Este diputado sabrá que su reelección en 2027 está en juego.");
            btn.innerText = "¡Voto Registrado!";
            // Consultar el valor actualizado desde la base de datos
            const { data: diputadoActualizado, error: errorDip } = await supabaseClient
                .from('diputados')
                .select('votos_castigo')
                .eq('id', idDiputado)
                .single();
            if (!errorDip && diputadoActualizado) {
                const votosSpan = document.getElementById(`votos-${idDiputado}`);
                votosSpan.innerText = diputadoActualizado.votos_castigo;
            }
            obtenerTotalVotos(); // Actualizar banner total
        }

    } catch (err) {
        console.error("Error en el proceso de voto:", err);
        alert("Hubo un problema al registrar tu voto. Por favor intenta de nuevo.");
        btn.disabled = false;
        btn.innerText = "🗳️ Emitir Voto de Castigo 2027";
    }
}

// --- 5. OBTENER TOTAL DE VOTOS (Banner Superior) ---
async function obtenerTotalVotos() {
    const { data, error } = await supabaseClient
        .from('diputados')
        .select('votos_castigo');

    if (error) return;

    // Sumar todos los votos_castigo usando reduce
    const total = data.reduce((sum, d) => sum + d.votos_castigo, 0);
    document.getElementById('total-votos-count').innerText = total.toLocaleString('es-GT');
