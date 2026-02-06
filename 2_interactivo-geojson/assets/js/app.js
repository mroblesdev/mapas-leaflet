// Inicializar mapa centrado en México
let map = L.map('map').setView([19.4326, -99.1332], 5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.inegi.org.mx/">INEGI</a> - Censo de Población y Vivienda 2010'
}).addTo(map);

// Control de información
const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
    let contents = 'Coloca el cursor sobre un estado';
    if (props) {
        contents = props.NOM_ENT ? `<b>${props.NOM_ENT}</b>` : '';
        contents += props.POBLACION ? `<br>Población: ${props.POBLACION.toLocaleString()}` : '';
    }
    this._div.innerHTML = `<h3>Densidad de población México</h3>${contents}`;
};

info.addTo(map);

let geojsonLayer;

// Cargar datos GeoJSON
fetch('assets/geojson/estados_censo_2020.json')
    .then(response => response.json())
    .then(data => {
        cargarGeoJSON(data)
    })
    .catch(error => console.error('Error fetching data:', error));

// Función para obtener el color basado en la población total
function getColor(d) {
    return d > 15 ? '#0F381F' :
        d > 12 ? '#195D33' :
            d > 9 ? '#228147' :
                d > 6 ? '#2CA55A' :
                    d > 3 ? '#36C96E' : '#5AD388';
}

// Función para aplicar estilo a cada estado
function style(feature) {
    let population = (feature.properties.POBLACION / 1000000) || 0;
    return {
        //fillColor: '#0000ee',
        fillColor: getColor(population),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.9
    };
}

// Función para resaltar el estado al pasar el cursor sobre él
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    layer.bringToFront();
    info.update(layer.feature.properties);
}

// Función para cargar el GeoJSON en el mapa
function cargarGeoJSON(statesData) {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    // obtener el valor máximo de población total para normalizar los colores
    const maxPopulation = Math.max(...statesData.features.map(feature => feature.properties.p_total || 0));

    geojsonLayer = L.geoJson(statesData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds());
}

// Función para restablecer el estilo del estado al quitar el cursor
function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    info.update();
}

// Función para hacer zoom al estado al hacer clic en él
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

// Función para asignar eventos a cada estado
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Agregar leyenda al mapa
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {

    const div = L.DomUtil.create('div', 'info legend');
    const grades = [0, 3, 6, 9, 12, 15];
    const labels = [];
    let from, to;

    for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(`<i style="background:${getColor(from + 1)}"></i> ${from}${to ? `&ndash;${to} M` : '+'}`);
    }

    div.innerHTML = labels.join('<br>');
    return div;
};

legend.addTo(map);
