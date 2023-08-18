// Function to join GeoJSON features with the table data based on a common attribute/key
function joinData(geojsonFeatures, tableData, geojsonKey, tableKey) {
    return geojsonFeatures.map(feature => {
        const joinValue = feature.properties[geojsonKey];
        const tableRow = tableData.find(row => row[tableKey] === joinValue);
        return { ...feature, properties: { ...feature.properties, ...tableRow } };
    });
}

// Function to zoom to the full extent of the data on the map
function zoomToFullData(map, data) {
    // Get the bounds of the GeoJSON data on the map
    var bounds = L.geoJSON(data[0]).getBounds();
    bounds.extend(L.geoJSON(data[1]).getBounds()); // Extend bounds with the second layer

    // Fit the map to the bounds
    map.fitBounds(bounds);
}

function getChoroplethStyle(feature) {
    return {
        fillColor: getColor(feature.properties.pop_tot),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

function getColor(d) {
    return d > 600000 ? 'red' :
        d > 400000 ? 'orange' :
        d > 250000 ? 'yellow' :
        'green';
}

function setupMap(map, osm, data) {
    var geojsonLayer1 = L.geoJSON(data[0], {
        onEachFeature: function (feature, layer) {
            // Add popups for each feature
            var popupContent = '<b>Județ: </b>' + feature.properties.name;

            // Access the additional properties from the joined CSV
            if (feature.properties.pop_tot) {
                popupContent += '<br><b>Populatie total: </b>' + feature.properties.pop_tot;
            }

            // Access the additional properties from the joined CSV
            if (feature.properties['0 - 4']) {
                popupContent += '<br><b>Populatie 0 - 4: </b>' + feature.properties['0 - 4'];
            }

            layer.bindPopup(popupContent);
			
			// Add tooltips to the map
            if (feature.properties.nume) {
                layer.bindTooltip(feature.properties.nume, {
                    permanent: true, // Make the tooltip hide on mouseout
                    direction: 'center', // Center the tooltip on the mouse pointer
                    className: 'feature-tooltip', // Custom CSS class for styling the tooltip
                    offset: [0, 0] // Set the tooltip offset to center on the mouse pointer
                });
            }
        },
        style: getChoroplethStyle // Use the choropleth style function
    });


    var geojsonLayer2 = L.geoJSON(data[1], {
        onEachFeature: function (feature, layer) {
            // Add popups for each feature
            var popupContent = '<b>Date statistice</b>' +
                '<br><b>Județ: </b>' + feature.properties.county +
                '<br><b>Siruta: </b>' + feature.properties.natcode +
                '<br><b>UAT: </b>' + feature.properties.name;

            // Access the additional properties from the joined CSV
            if (feature.properties.pop_tot) {
                popupContent += '<br><b>Populatie total: </b>' + feature.properties.pop_tot;
            }

            layer.bindPopup(popupContent);
        },
        style: getChoroplethStyle // Use the choropleth style function
    });

    // Load and parse judete_pop.csv and uat_pop.csv
    var judetePopUrl = 'http://localhost:8000/date/judete_pop.csv';
    var uatPopUrl = 'http://localhost:8000/date/uat_pop.csv';
    
	Promise.all([fetch(judetePopUrl), fetch(uatPopUrl)])
        .then(responses => Promise.all(responses.map(response => response.text())))
        .then(csvData => {
            // Convert CSV data to JSON using PapaParse
            var judetePopData = Papa.parse(csvData[0], { header: true, skipEmptyLines: true }).data;
            var uatPopData = Papa.parse(csvData[1], { header: true, skipEmptyLines: true }).data;

            // Join GeoJSON features with the table data for both layers
            const joinedGeojsonLayer1 = joinData(data[0].features, judetePopData, 'natCode', 'natCode');
            const joinedGeojsonLayer2 = joinData(data[1].features, uatPopData, 'natcode', 'natcode');

            // Update the data in the layers with the joined data
            geojsonLayer1.clearLayers();
            geojsonLayer1.addData(joinedGeojsonLayer1);

            geojsonLayer2.clearLayers();
            geojsonLayer2.addData(joinedGeojsonLayer2);

            // Add both layers to the map and control
            var Basemaps = {
                "OSM": osm
            };

            var Overlays = {
                "Judete Layer": geojsonLayer1,
                "UAT Layer": geojsonLayer2
            };

            geojsonLayer1.options.maxZoom = 10;
            geojsonLayer2.options.minZoom = 10;

            // Add the layers to the map initially
            geojsonLayer1.addTo(map);

            var overlayControl = L.control.layers(Basemaps, Overlays).addTo(map);

            // Hide/show the UAT Layer based on the zoom level
            map.on('zoomend', function () {
                if (map.getZoom() >= 10) {
                    if (map.hasLayer(geojsonLayer1)) {
                        map.removeLayer(geojsonLayer1);
                    }
                } else {
                    if (!map.hasLayer(geojsonLayer1)) {
                        map.addLayer(geojsonLayer1);
                    }
                }
            });
            map.on('zoomend', function () {
                if (map.getZoom() < 10) {
                    if (map.hasLayer(geojsonLayer2)) {
                        map.removeLayer(geojsonLayer2);
                    }
                } else {
                    if (!map.hasLayer(geojsonLayer2)) {
                        map.addLayer(geojsonLayer2);
                    }
                }
            });

            // Add the legend to the map
            var legend = L.control({ position: 'bottomright' });

            // Add legend to the map
            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend');
                var grades = [0, 250000, 400000, 600000]; // Adjust the grades as needed
                var labels = [];

                // Loop through the grades to generate a label with a colored square for each interval
                for (var i = 0; i < grades.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
                }

                return div;
            };

            legend.addTo(map);

            // Add event listener for the button click
            document.getElementById('zoomToFullData').addEventListener('click', function () {
                zoomToFullData(map, data);
            });
			
			zoomToFullData(map, data);

			
			// Add buttons to the layer control
			overlayControl._container.innerHTML += `<div><button id="open-table-layer1">Open Table Layer 1</button></div>`;
			overlayControl._container.innerHTML += `<div><button id="open-table-layer2">Open Table Layer 2</button></div>`;
			
			// Add event listeners to the buttons
			document.getElementById('open-table-layer1').addEventListener('click', function () {
				const tableContentLayer1 = generateTableContentForLayer1(geojsonLayer1.getLayers());
				document.getElementById('table-container').innerHTML = tableContentLayer1;
			});

			document.getElementById('open-table-layer2').addEventListener('click', function () {
				const tableContentLayer2 = generateTableContentForLayer2(geojsonLayer2.getLayers());
				document.getElementById('table-container').innerHTML = tableContentLayer2;
			});
			
			// Function to generate table content for Layer 1
			function generateTableContentForLayer1(layers) {
				let tableHTML = '<h3>Layer 1 Data</h3><table><tr><th>Name</th><th>Population</th></tr>';

				layers.forEach(layer => {
				  const name = layer.feature.properties.name;
				  const population = layer.feature.properties.pop_tot;

				  tableHTML += `<tr><td>${name}</td><td>${population}</td></tr>`;
				});

				tableHTML += '</table><button id="close-table-layer1">Close Table</button>';
				return tableHTML;
			}

			  // Function to generate table content for Layer 2
			function generateTableContentForLayer2(layers) {
				let tableHTML = '<h3>Layer 2 Data</h3><table><tr><th>Name</th><th>Population</th></tr>';

				layers.forEach(layer => {
				  const name = layer.feature.properties.name;
				  const population = layer.feature.properties.pop_tot;

				  tableHTML += `<tr><td>${name}</td><td>${population}</td></tr>`;
				});

				tableHTML += '</table><button id="close-table-layer2">Close Table</button>';
				return tableHTML;
			}
			  
			  // Add event listeners to the close buttons
			document.getElementById('table-container').addEventListener('click', function (event) {
				if (event.target.id === 'close-table-layer1') {
				  document.getElementById('table-container').innerHTML = '';
				} else if (event.target.id === 'close-table-layer2') {
				  document.getElementById('table-container').innerHTML = '';
				}
			});
		});
	
}
