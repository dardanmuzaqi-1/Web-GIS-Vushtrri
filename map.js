// Shtresa bazë
var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: 'Map data © Google',
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenTopoMap contributors'
});

// Inicimi i hartës me shtresën bazë
var map = L.map('map', {
  center: [42.37, 21.08],
  zoom: 10,
  layers: [streetLayer] // Shtresa fillestare
});

// Kontrolli për shtresat bazë
var baseLayers = {
  "Standard": streetLayer,
  "Satellite": satelliteLayer,
  "Terrain": terrainLayer
};

// Kontrolli i shtresave për t'u shtuar në hartë
L.control.layers(baseLayers).addTo(map);


// Krijimi i grupit për shtresat e vizatuara
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Shto kontrollin për vizatim dhe editim
var drawControl = new L.Control.Draw({
  position: 'topright', // Vendos veglat në këndin e sipërm majtas
  edit: {
    featureGroup: drawnItems // Grupi i elementeve të vizatuara
  },
  draw: {
    polygon: true,
    polyline: true,
    rectangle: true,
    circle: true,
    marker: true
  }
});
map.addControl(drawControl);

// Event kur krijohet një formë
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  drawnItems.addLayer(layer); // Shto shtresën e re në grupin ekzistues
  console.log('Shtuar element i ri:', layer);
});

// Event kur editohet një formë
map.on(L.Draw.Event.EDITED, function (event) {
  console.log('Elemente të edituara:', event.layers);
});

// Event kur fshihet një formë
map.on(L.Draw.Event.DELETED, function (event) {
  console.log('Elemente të fshira:', event.layers);
});


L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'lokacioni.png', // Ikona juaj default nëse mungon
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Ikonat e personalizuara për Start dhe End
var startIcon = L.icon({
  iconUrl: 'start.png', // Replace with the path to your start icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32], // Opsionale: Vendos popup më lart sesa ikona
});

var endIcon = L.icon({
  iconUrl: 'end.png', // Replace with the path to your end icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32], // Opsionale: Vendos popup më lart sesa ikona
});

var startMarker, endMarker;
var isRoutingEnabled = false; // Flag to check if routing is enabled


// Inicimi i kontrollit për rrugë
var control = L.Routing.control({
  waypoints: [],
  routeWhileDragging: true,
  geocoder: L.Control.Geocoder.nominatim(),
  createMarker: function (i, wp, n) {
    // Krijimi i markuesve vetëm për start dhe end
    var icon = i === 0 ? startIcon : (i === n - 1 ? endIcon : null);
    return icon ? L.marker(wp.latLng, { icon: icon, draggable: true }) : null;
  }
}).addTo(map);

// Fsheh kutitë e inputeve përmes CSS
var geocoders = document.querySelector('.leaflet-routing-container .leaflet-routing-geocoders');
if (geocoders) {
  geocoders.style.display = 'none'; // Fshih elementin për fushat
}


// Funksioni për përditësimin e rrugës
function updateRoute() {
  var waypoints = [];
  if (startMarker) waypoints.push(startMarker.getLatLng());
  if (endMarker) waypoints.push(endMarker.getLatLng());

  if (waypoints.length >= 2) {
    control.setWaypoints(waypoints); // Vendos waypoint-et për rrugën
    console.log("Waypoint-e për rrugën:", waypoints);
  } else {
    console.log("Duhet të ketë të paktën dy waypoint-e për të krijuar një rrugë.");
  }
}




// Krijimi i një div-i për ikonat
var customControls = L.control({ position: 'topright' });

customControls.onAdd = function () {
  var div = L.DomUtil.create('div', 'custom-controls');

  // Ndalimi i propagimit të klikimeve në hartë
  L.DomEvent.disableClickPropagation(div);

  // Ikona për start
  div.innerHTML += `<div id="customStartIcon" class="control-icon" title="Set Start">🚩</div>`;

  // Ikona për end
  div.innerHTML += `<div id="customEndIcon" class="control-icon" title="Set End">🏁</div>`;

  // Ikona për fshirje
  div.innerHTML += `<div id="customClearIcon" class="control-icon" title="Clear Data">🗑️</div>`;

  // Ikona për live location
  div.innerHTML += `<div id="customLiveIcon" class="control-icon" title="Live Location">📍</div>`;

  return div;
};

customControls.addTo(map);


var routeCoordinates = []; // Ruaj koordinatat e rrugës

// Sigurohu që të kapim koordinatat e rrugës sapo të gjendet nga OpenStreetMap
control.on('routesfound', function (e) {
  routeCoordinates = e.routes[0].coordinates.map(coord => [coord.lng, coord.lat]); // Ruaj rrugën e plotë
  console.log("Koordinatat e rrugës:", routeCoordinates); // Debugging
});

function saveRoute() {
  var geojson = drawnItems.toGeoJSON(); // Merr shtresat e vizatuara

  // ✅ Kontrollo nëse rruga është gjetur dhe është ruajtur
  if (routeCoordinates.length > 0) {
    var routeGeoJSON = {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": routeCoordinates // Shto rrugën e saktë me kthesa
      },
      "properties": {
        "name": "Rruga e planifikuar",
        "description": "Kjo është rruga e shkarkuar nga OpenStreetMap Routing API"
      }
    };

    geojson.features.push(routeGeoJSON); // Shto rrugën në skedarin GeoJSON
  }

  // 🚨 Nëse nuk ka as vizatime as rrugë, shfaq mesazh
  if (geojson.features.length === 0) {
    alert("Nuk ka të dhëna për të ruajtur! Ju lutemi vizatoni ose vendosni një rrugë.");
    console.log("❌ Asnjë rrugë ose vizatim nuk u gjet!");
    return;
  }

  var geojsonString = JSON.stringify(geojson, null, 2);
  console.log("✅ GeoJSON i krijuar:", geojsonString);

  // Shkarko si skedar
  var blob = new Blob([geojsonString], { type: "application/json" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "route.geojson";
  link.click();
}


// Funksionalitet për ikonën "Live Location"
document.getElementById("customLiveIcon").addEventListener("click", toggleLiveLocation);


// Funksionaliteti për vendosjen e pikës së fillimit
document.getElementById("customStartIcon").addEventListener("click", function () {
  map.on('click', function (e) {
    if (!startMarker) {
      startMarker = L.marker(e.latlng, { icon: startIcon, draggable: true })
        .addTo(map)
        .bindPopup("Start Point")
        .openPopup();
      startMarker.on('dragend', updateRoute);
      console.log("Start Point vendosur:", e.latlng);
      map.off('click'); // Ndal eventi pas vendosjes
    }
  });
});

// Funksionaliteti për vendosjen e pikës së përfundimit
document.getElementById("customEndIcon").addEventListener("click", function () {
  map.on('click', function (e) {
    if (!endMarker) {
      endMarker = L.marker(e.latlng, { icon: endIcon, draggable: true })
        .addTo(map)
        .bindPopup("End Point")
        .openPopup();
      endMarker.on('dragend', updateRoute);
      console.log("End Point vendosur:", e.latlng);
      map.off('click'); // Ndal eventi pas vendosjes
      updateRoute(); // Përditëso rrugën pas vendosjes
    }
  });
});
  // Funksionaliteti për fshirjen e të dhënave
  document.getElementById("customClearIcon").addEventListener("click", function () {
    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }
    control.setWaypoints([]); // Hiq waypoint-et nga rruga
    console.log("Të dhënat për start dhe end janë fshirë.");
  });



var liveLocationMarker;
var accuracyCircle;
var isLiveLocationEnabled = false;

// Funksioni për të gjetur dhe treguar lokacionin live
function toggleLiveLocation() {
  isLiveLocationEnabled = !isLiveLocationEnabled;

  if (isLiveLocationEnabled) {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        function (position) {
          var lat = position.coords.latitude;
          var lng = position.coords.longitude;
          var accuracy = position.coords.accuracy;

          // Shto ose përditëso markuesin e lokacionit live
          if (!liveLocationMarker) {
            liveLocationMarker = L.marker([lat, lng], {
              draggable: false,
              title: "Lokacioni Im",
            }).addTo(map).bindPopup("Ky është lokacioni juaj aktual.");
          } else {
            liveLocationMarker.setLatLng([lat, lng]);
          }

          // Shto ose përditëso rrethin e saktësisë
          if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
          }
          accuracyCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

          // Qendro harta mbi lokacionin
          map.setView([lat, lng], 14);
          console.log(`Accuracy radius: ${accuracy} meters`);
        },
        function (error) {
          console.error("Error accessing geolocation:", error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation nuk mbështetet nga shfletuesi juaj.");
    }
  } else {
    // Hiq markuesin kur funksioni çaktivizohet
    if (liveLocationMarker) {
      map.removeLayer(liveLocationMarker);
      liveLocationMarker = null;
    }
    if (accuracyCircle) {
      map.removeLayer(accuracyCircle);
      accuracyCircle = null;
    }
  }
}


function searchLocation(type) {
  var location = type === 'start' ? document.getElementById('startLocation').value : document.getElementById('endLocation').value;

  var url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;    
 
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        var lat = parseFloat(data[0].lat);
        var lng = parseFloat(data[0].lon);

        if (type === 'start') {
          if (startMarker) {
            map.removeLayer(startMarker);
          }
          startMarker = L.marker([lat, lng], { icon: startIcon, draggable: true })
            .addTo(map)
            .bindPopup('Start Point');
          startMarker.on('dragend', updateRoute);
        } else if (type === 'end') {
          if (endMarker) {
            map.removeLayer(endMarker);
          }
          endMarker = L.marker([lat, lng], { icon: endIcon, draggable: true })
            .addTo(map)
            .bindPopup('End Point');
          endMarker.on('dragend', updateRoute);
        }

        updateRoute();
        map.setView([lat, lng], 14);
      } else {
        alert('Location not found. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error fetching location:', error);
    });
}

let isInputFocused = false; // Flamur për të treguar fokusin në input ose sugjerime

// Funksioni për të hapur dhe mbyllur widget-in
function toggleSearchWidget() {
  const widget = document.querySelector('.search-widget');
  widget.classList.toggle('closed');
  widget.classList.toggle('active');
}

// Aktivizimi automatik kur afrohet kursorin
const widget = document.querySelector('.search-widget');

// Kur kursorin afrohet te widget-i
widget.addEventListener('mouseenter', () => {
  widget.classList.add('active'); // Hapet
  widget.classList.remove('closed'); // Hiqet gjendja e mbyllur
});

// Kur kursorin largohet nga widget-i
widget.addEventListener('mouseleave', () => {
  widget.classList.remove('active'); // Mbyllet
  widget.classList.add('closed'); // Vendoset në gjendjen e mbyllur
});


// Event për të kontrolluar fokusin e input-it
const searchInputs = document.querySelectorAll('.search-input');

searchInputs.forEach(input => {
  input.addEventListener('focus', () => {
    isInputFocused = true; // Kur input-i është fokusuar
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      isInputFocused = false; // Kur input-i humb fokusin
    }, 200); // Prisni për përfundimin e klikimeve në sugjerime
  });
});


function autocompleteSearch(type) {
  const inputId = type === 'start' ? 'startLocation' : 'endLocation';
  const suggestionsId = type === 'start' ? 'startSuggestions' : 'endSuggestions';

  const query = document.getElementById(inputId).value;
  const suggestions = document.getElementById(suggestionsId);

  suggestions.innerHTML = ''; // Pastrimi i sugjerimeve të mëparshme

  if (query.length < 3) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)

    .then(response => response.json())
    .then(data => {
      data.forEach(location => {
        const li = document.createElement('li');
        li.textContent = location.display_name;
        li.onclick = () => {
          document.getElementById(inputId).value = location.display_name;
          suggestions.innerHTML = ''; // Pastrimi i sugjerimeve pas përzgjedhjes
        };
        suggestions.appendChild(li);
      });
    })
    .catch(error => console.error('Error fetching suggestions:', error));
}

// Funksioni për të hapur dhe mbyllur widget-in e raportimit
function toggleReportWidget() {
  const container = document.querySelector('.report-container');
  container.classList.toggle('active');
}

// Aktivizimi automatik kur afrohet kursorin
const reportWidget = document.querySelector('.report-widget');

reportWidget.addEventListener('mouseenter', () => {
  const container = document.querySelector('.report-container');
  container.classList.add('active');
});

reportWidget.addEventListener('mouseleave', () => {
  const container = document.querySelector('.report-container');
  container.classList.remove('active');
});
// Statistika për vizitat
let visitCount = localStorage.getItem('visitCount') || 0;
visitCount++;
localStorage.setItem('visitCount', visitCount);
console.log(`Vizita: ${visitCount}`);


 // Krijimi i një div-i për ikonat
  var customControls = L.control({ position: 'topright' });

  customControls.onAdd = function () {
    var div = L.DomUtil.create('div', 'custom-controls');

    // Ndalimi i propagimit të klikimeve në hartë
    L.DomEvent.disableClickPropagation(div);


    
    // Ikona për end
    div.innerHTML += `<div id="customEndIcon" class="control-icon" title="Set End">🏁</div>`;
 
    

    
    // Ikona për live location
div.innerHTML += `<div id="customLiveIcon" class="control-icon" title="Live Location">📍</div>`;

    return div;
  };


// Dërgimi i raportit
document.getElementById('submitReport').addEventListener('click', () => {
  const description = document.getElementById('reportDescription').value.trim();
  if (description) {
    console.log(`Raporti i dërguar: ${description}`);

    alert('Raporti juaj u pranua. Faleminderit!');
    document.getElementById('reportDescription').value = ''; // Pastroni fushën pas dërgimit
  } else {
    alert('Ju lutemi përshkruani gabimin.');
  }
});

