// Compartir link de la página con mensaje personalizado
function compartirVotoCastigoLink() {
    const url = window.location.href;
    const mensaje = `¡Ya emití mi Voto de Castigo! Ingresa a este enlace para sumarte: ${url}`;
    if (navigator.share) {
        navigator.share({
            title: 'Voto de Castigo',
            text: mensaje,
            url: url
        });
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(mensaje);
        alert('¡Enlace copiado! Ahora puedes compartirlo donde quieras.');
    }
}
// ...existing code...
// --- COMPARTIR VOTO DE CASTIGO ---
function compartirVotoCastigo() {
    const shareData = {
        title: '¡Ya emití mi Voto de Castigo! 🇬🇹',
        text: '¡Ya avisé que no reelegiré a quienes subieron el combustible! Súmate al #VotoDeCastigo2027 en votocastigo.com',
        url: 'https://social-proyect.github.io/voto-castigo-gt-2027/'
    };
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => {
                alert('¡Gracias por compartir tu voto de castigo!');
            })
            .catch(() => {});
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('¡Texto para compartir copiado al portapapeles! Pega en tus redes sociales.');
    }
}

// --- COMPARTIR VOTO DE CASTIGO EN WHATSAPP ---
function compartirVotoWhatsApp() {
    const mensaje = encodeURIComponent('¡Ya emití mi #VotoDeCastigo! Súmate tú también en votocastigo.com 🇬🇹');
    const url = `https://wa.me/?text=${mensaje}`;
    window.open(url, '_blank');
}
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
    // Seccionar usando el campo distrito: solo Listado Nacional y Distritales
    const gridPartidos = document.getElementById('grid-partidos');
    const gridListadoNacional = document.getElementById('grid-listado-nacional');
    const gridDistritales = document.getElementById('grid-distritales');
    const listadoNacional = data.filter(d => d.distrito && d.distrito.trim().toLowerCase() === 'listado nacional');
    const distritales = data.filter(d => !d.distrito || d.distrito.trim().toLowerCase() !== 'listado nacional');
    // Opcional: dejar la sección de partidos vacía
    renderizarTarjetas([], gridPartidos);
    renderizarTarjetas(listadoNacional, gridListadoNacional);
    renderizarTarjetas(distritales, gridDistritales);
}

// --- 2. MOSTRAR TARJETAS EN EL GRID ---
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
    if (!inputBuscador) return; // No hacer nada si no existe el textbox
    inputBuscador.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase();
        // Filtrar por nombre o distrito y seccionar usando el campo distrito
        const listadoNacional = listaDiputadosCompleta.filter(d => d.distrito && d.distrito.trim().toLowerCase() === 'listado nacional' && (d.nombre.toLowerCase().includes(busqueda) || d.distrito.toLowerCase().includes(busqueda)));
        const distritales = listaDiputadosCompleta.filter(d => (!d.distrito || d.distrito.trim().toLowerCase() !== 'listado nacional') && (d.nombre.toLowerCase().includes(busqueda) || d.distrito.toLowerCase().includes(busqueda)));
        renderizarTarjetas([], document.getElementById('grid-partidos'));
        renderizarTarjetas(listadoNacional, document.getElementById('grid-listado-nacional'));
        renderizarTarjetas(distritales, document.getElementById('grid-distritales'));
    });
}

// --- 4. PROCESAR VOTO (IP + Supabase RPC) ---
window.procesarVoto = async function procesarVoto(idDiputado) {
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

            // Mostrar botón para compartir en redes sociales
            mostrarBotonCompartir();
        }
// Botón para compartir en redes sociales después de votar
function mostrarBotonCompartir() {
    // Evitar duplicados
    if (document.getElementById('btn-compartir-voto')) return;
    const container = document.querySelector('.tarjetas-section');
    if (!container) return;
    const btn = document.createElement('button');
    btn.id = 'btn-compartir-voto';
    btn.className = 'btn-compartir';
    btn.innerText = 'Compartir mi voto de castigo';
    btn.style.margin = '20px auto 0 auto';
    btn.style.display = 'block';
    btn.onclick = function() {
        const url = window.location.href;
        const mensaje = `¡Ya coloqué mi voto de castigo! Súmate a la Auditoría Ciudadana 🇬🇹 y vota tú también aquí: ${url}`;
        if (navigator.share) {
            navigator.share({
                title: 'Voto de Castigo 2027',
                text: mensaje,
                url: url
            });
        } else {
            // Fallback: copiar al portapapeles y mostrar mensaje
            navigator.clipboard.writeText(mensaje);
            alert('¡Mensaje copiado! Pega y comparte en tus redes sociales.');
        }
    };
    container.appendChild(btn);
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
    // Obtener todos los registros y contar IPs únicas en el frontend
    const { data, error } = await supabaseClient
        .from('registros_votos')
        .select('ip_address');

    if (error) {
        console.error('[VotoCastigo] Error al obtener IPs únicas:', error);
        return;
    }

    // Filtrar IPs únicas
    const ipsUnicas = new Set(data.map(r => r.ip_address).filter(Boolean));
    const total = ipsUnicas.size;

    console.log('[VotoCastigo] Conteo IPs únicas:', total);
    document.getElementById('total-votos-count').innerText = total.toLocaleString('es-GT');
}
