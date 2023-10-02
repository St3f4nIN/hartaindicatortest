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

//Function for choropleth style
function getChoroplethStyle(feature, layerType) {
    let intervals, colors;
    
    if (layerType === 'layer1') {
        intervals = [0, 250000, 400000, 600000];
    } else if (layerType === 'layer2') {
        intervals = [0, 5000, 50000, 100000];
    }

    colors = ['green', 'yellow', 'orange', 'red'];

    const value = feature.properties.pop_tot;
    let fillColor = colors[colors.length - 1];
	
    for (let i = intervals.length - 1; i >= 0; i--) {
        if (value >= intervals[i]) {
            fillColor = colors[i];
            break;
        }
    }

    return {
        fillColor: fillColor,
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
    };
}

let selectedLayer = null;
let selectedLayer1 = null;
let selectedLayerBounds = null;
let countyFilterDropdown = null;


function setupMap(map, osm, data) {
	console.log('Functia setuMap pornita.');
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
                popupContent += '<br><b>Populație 0 - 4: </b>' + feature.properties['0 - 4'];
				popupContent += '<br><b>Populație 5 - 9: </b>' + feature.properties[' 5 - 9'];
				popupContent += '<br><b>Populație 10 - 14: </b>' + feature.properties[' 10 - 14'];
				popupContent += '<br><b>Populație 15 - 19: </b>' + feature.properties['15 - 19'];
				popupContent += '<br><b>Populație 20 - 24: </b>' + feature.properties['20 - 24'];
				popupContent += '<br><b>Populație 25 - 29: </b>' + feature.properties['25 - 29'];
				popupContent += '<br><b>Populație 30 - 34: </b>' + feature.properties['30 - 34'];
				popupContent += '<br><b>Populație 35 - 39: </b>' + feature.properties['35 - 39'];
				popupContent += '<br><b>Populație 40 - 44: </b>' + feature.properties['40 - 44'];
				popupContent += '<br><b>Populație 45 - 49: </b>' + feature.properties['45 - 49'];
				popupContent += '<br><b>Populație 50 - 54: </b>' + feature.properties['50 - 54'];
				popupContent += '<br><b>Populație 55 - 59: </b>' + feature.properties['55 - 59'];
				popupContent += '<br><b>Populație 60 - 64: </b>' + feature.properties['60 - 64'];
				popupContent += '<br><b>Populație 65 - 69: </b>' + feature.properties['65 - 69'];
				popupContent += '<br><b>Populație 70 - 74: </b>' + feature.properties['70 - 74'];
				popupContent += '<br><b>Populație 75 - 79: </b>' + feature.properties['75 - 79'];
				popupContent += '<br><b>Populație 80 - 85: </b>' + feature.properties['80 - 85'];
				popupContent += '<br><b>Populație peste 85 ani: </b>' + feature.properties['85 ani'];
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
			layer.on('add', function () {
            selectedLayer = layer;
			});
        },
        style: function (feature) {
			return getChoroplethStyle(feature, 'layer1');
		}
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
        style: function (feature) {
			return getChoroplethStyle(feature, 'layer2');
		}
    });

    // Load and parse judete_pop.csv and uat_pop.csv
    var judetePopUrl = 'https://st3f4nin.github.io/hartaindicatortest/date/judete_pop.csv';
    var uatPopUrl = 'https://st3f4nin.github.io/hartaindicatortest/date/uat_pop.csv';
    
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
			
			// Define intervals and colors for both layers
			var layer1Intervals = [0, 250000, 400000, 600000];
			var layer2Intervals = [0, 5000, 50000, 100000];
			var colors = ['green', 'yellow', 'orange', 'red'];

			// Function to create a legend for a specific layer
			function createLegend(intervals) {
				var legend = L.control({ position: 'bottomright' });
				
				legend.onAdd = function (map) {
					var div = L.DomUtil.create('div', 'info legend');
					
					// Loop through the intervals to generate a label with a colored square for each interval
					for (var i = 0; i < intervals.length; i++) {
						div.innerHTML +=
							'<i style="background:' + colors[i] + '"></i> ' +
							intervals[i] + (intervals[i + 1] ? '&ndash;' + intervals[i + 1] + '<br>' : '+');
					}
					
					return div;
				};
				
				return legend;
			}

			// Create legends for both layers
			var legendLayer1 = createLegend(layer1Intervals);
			var legendLayer2 = createLegend(layer2Intervals);

			// Add initial legend to the map (for geojsonLayer1 by default)
			legendLayer1.addTo(map);

			// Function to update the legend based on the visible layer
			function updateLegend(layerType) {
				if (layerType === 'layer1') {
					legendLayer1.addTo(map);
					map.removeControl(legendLayer2);
				} else if (layerType === 'layer2') {
					legendLayer2.addTo(map);
					map.removeControl(legendLayer1);
				}
			}

			// Hide/show the UAT Layer based on the zoom level
			map.on('zoomend', function () {
				if (map.getZoom() >= 10) {
					if (map.hasLayer(geojsonLayer1)) {
						map.removeLayer(geojsonLayer1);
						updateLegend('layer2');
					}
				} else {
					if (!map.hasLayer(geojsonLayer1)) {
						map.addLayer(geojsonLayer1);
						updateLegend('layer1');
					}
				}
			});

			map.on('zoomend', function () {
				if (map.getZoom() < 10) {
					if (map.hasLayer(geojsonLayer2)) {
						map.removeLayer(geojsonLayer2);
						updateLegend('layer1');
					}
				} else {
					if (!map.hasLayer(geojsonLayer2)) {
						map.addLayer(geojsonLayer2);
						updateLegend('layer2');
					}
				}
			});
			
            // Add event listener for the button click
            document.getElementById('zoomToFullData').addEventListener('click', function () {
                zoomToFullData(map, data);
            });
			
			zoomToFullData(map, data);
			
			// Create a search control for geojsonLayer2
			var searchControl = L.control({
				position: 'topright'
			});
			
			
			function updateSearchOptions(selectedCounty) {
				//console.log('Functie update Selected county:', selectedCounty);
				var nameOptions = [];
				//console.log('Functie update nameOption gol:', nameOptions);
				
				if (!selectedCounty || selectedCounty === '') {
					joinedGeojsonLayer2.forEach(function (feature) {
						nameOptions.push(feature.properties.name);
					});
				} else {
					joinedGeojsonLayer2.forEach(function (feature) {
						if (feature.properties.county === selectedCounty) {
							nameOptions.push(feature.properties.name);
						}
					});
				}
				
				var nameSelect = document.getElementById('search-name');
				//nameSelect.innerHTML = ''; // Clear previous options
				nameSelect.innerHTML = '<option value="" selected>Selectează</option>';
				
				// Populate the 'search-name' select element with the options
				nameOptions.forEach(function (name) {
					var option = document.createElement('option');
					option.value = name;
					option.textContent = name;
					nameSelect.appendChild(option);
				});
			}
			
			var countyOptions;
			
			var mainContainer = document.getElementById('search-control');
			
			// Declare the container variable 
			var container;
			var searchCounty;
			var searchName;
			var searchButton;
			
			searchControl.onAdd = function (map) {
				container = L.DomUtil.create('div', 'search-container');
				searchCounty = L.DomUtil.create('div', 'search-county');
				searchName = L.DomUtil.create('div', 'search-name');
				searchButton = L.DomUtil.create('div', 'search-btn');
				
				    // Append select elements and button to the search container
				container.appendChild(searchCounty);
				container.appendChild(searchName);
				container.appendChild(searchButton);
				
				// Append the search container to the main container
				mainContainer.appendChild(container);
				
				
				//console.log('Before population of search-county:');
				//selectedCounty = document.getElementById('search-county'); 
				//console.log('s-a selectat un county:', selectedCounty);

				// Populate the county options
				countyOptions = Array.from(new Set(joinedGeojsonLayer2.map(function (feature) {
					return feature.properties.county; 
				})));
				
				// Sort the countyOptions alphabetically
				countyOptions.sort();

				var countyOptionsHTML = countyOptions
					.map(county => `<option value="${county}">${county}</option>`)
					.join('');
				//console.log('After population of search-county2:', countyOptions);
				
				container.innerHTML = `
					<select id="search-county">
						<option value="">Județ</option>
						${countyOptionsHTML}
					</select>
					<select id="search-name">
						<option value="" selected>UAT</option>
					</select>
					<button id="search-btn">Caută</button>
				`;
				
				var nameSelect = container.querySelector('#search-name');
				
				//console.log('s-a selectat un nume:', nameSelect);
				
				nameSelect.addEventListener('change', function (event) {
					var selectedName = event.target.value;
					//console.log('Dupa ce s-a selectat un nume:', selectedName);
					// Perform any additional action you want when the name is selected (if needed)
				});
			    

				//var searchButton = document.getElementById('search-btn');
				var searchButton = container.querySelector('#search-btn');
				searchButton.addEventListener('click', function () {
					var selectedCounty = container.querySelector('#search-county').value;
					var selectedName = container.querySelector('#search-name').value;

					if (selectedCounty && selectedName) {
						var selectedFeature = joinedGeojsonLayer2.find(function (feature) {
							return feature.properties.county === selectedCounty && feature.properties.name === selectedName;
						});

						if (selectedFeature) {
							selectedLayerBounds = L.geoJSON(selectedFeature).getBounds();
							var bounds = selectedLayerBounds;
							map.fitBounds(bounds);

							// Remove the style from previously selected layer (if any)
							if (selectedLayer) {
								selectedLayer.setStyle({ weight: 1, color: 'white' });
							}

							selectedLayer = geojsonLayer2.getLayers().find(layer => {
								return layer.feature.properties.county === selectedCounty && layer.feature.properties.name === selectedName;
							});

							setTimeout(function(){
							if (selectedLayer) {
								// Highlight the selected layer
								selectedLayer.setStyle({ weight: 5, color: 'blue' });
								
								// Bring the selected layer to the front
								selectedLayer.bringToFront();
							}
							},350);
							
						}
					}
				});
				
				// Add event listener for the search button
				searchButton.addEventListener('click', function () {
					showLabel = true; // Set the flag to show the label
				});
				
			//var selectCounty = document.getElementById('search-county');
			var selectCounty = container.querySelector('#search-county');

			selectCounty.addEventListener('change', function (event) {
				var selectedCounty = event.target.value;
				updateSearchOptions(selectedCounty);
			});

			return container;
			};
			
			searchControl.addTo(map);
			
			// Event listener for map movement (panning)
			map.on('moveend', function () {
				if (selectedLayerBounds && !map.getBounds().contains(selectedLayerBounds)) {
					// If the selected feature's bounds are no longer visible in the map bounds, clear the selection
					selectedLayer.setStyle({ weight: 1, color: 'white' });
				}
			});

			// Event listener for map zooming
			map.on('zoomend', function () {
				if (selectedLayerBounds && map.getZoom() > (map.getMinZoom() + 2)) {
					// If the user zooms out more than 2 levels, clear the selection
					selectedLayer.setStyle({ weight: 1, color: 'white' });
				}
			});

			// Call the getContainer routine.
			var htmlObject = searchControl.getContainer();

			// Get the desired parent node.
			var parentContainer = document.getElementById('search-control');

			// Append the search container to the main container
			parentContainer.appendChild(htmlObject);

			
			// Function to open the table initially
			function openTableLayer1() {
				const tableContainerLayer1 = document.getElementById('table-container-layer1');
				const countyFilterContainer = document.getElementById('county-filter-container');

				tableContainerLayer1.style.display = 'block';

				// Generate table content for Layer 1 and populate it
				const tableContentLayer1 = generateTableContentForLayer1(geojsonLayer1.getLayers());
				tableContainerLayer1.innerHTML = tableContentLayer1;

				// Hide the filter container
				countyFilterContainer.style.display = 'none';
			}

			// Call the function to open the table on page load
			openTableLayer1();
			
						
			// Add event listeners to the buttons open tables
			document.getElementById('open-table-layer1').addEventListener('click', function () {
				const tableContainerLayer1 = document.getElementById('table-container-layer1');
				const tableContainerLayer2 = document.getElementById('table-container-layer2');
				const countyFilterContainer = document.getElementById('county-filter-container');

				// Toggle the display of the Layer 1 table
				if (tableContainerLayer1.style.display === 'block') {
					tableContainerLayer1.style.display = 'none';
					countyFilterContainer.style.display = 'none'; // Hide the filter container
				} else {
					tableContainerLayer1.style.display = 'block';

					// Close Layer 2 table if it's open
					if (tableContainerLayer2.style.display === 'block') {
						tableContainerLayer2.style.display = 'none';
						console.log('inchis');
					}

					// Generate table content for Layer 1 and populate it
					const tableContentLayer1 = generateTableContentForLayer1(geojsonLayer1.getLayers());
					tableContainerLayer1.innerHTML = tableContentLayer1;
				}
				// Hide the filter container
				countyFilterContainer.style.display = 'none';
				});

			// Function to generate table content for Layer 1
			function generateTableContentForLayer1(layers) {
				let tableHTML = '<h3>Județe</h3><table><tr><th>Denumire</th><th>Populație totală</th></tr>';

				layers.forEach(layer => {
				  const name = layer.feature.properties.name;
				  const population = layer.feature.properties.pop_tot;

				  tableHTML += `<tr data-name="${name}"><td>${name}</td><td>${population}</td></tr>`;
				});

				tableHTML += '</table>';
				console.log('updateTableContentForLayer1 completed.');

				return tableHTML;
			}

			document.getElementById('open-table-layer2').addEventListener('click', function () {
				console.log('Buton 2 apasat.');
				const tableContainerLayer2 = document.getElementById('table-container-layer2');
				const tableContainerLayer1 = document.getElementById('table-container-layer1');
				const countyFilterContainer = document.getElementById('county-filter-container');

				// Close Layer 1 table if it's open
				if (tableContainerLayer1.style.display === 'block') {
					tableContainerLayer1.style.display = 'none';
				}

				// Toggle the display of the Layer 2 table
				if (tableContainerLayer2.style.display === 'block') {
					tableContainerLayer2.style.display = 'none';
					countyFilterContainer.style.display = 'none'; // Hide the filter container
				} else {
					tableContainerLayer2.style.display = 'block';
					countyFilterContainer.style.display = 'block'; // Show the filter container

					// Populate the county filter dropdown
					populateCountyFilterDropdown();

					// Get the first county alphabetically
					const firstCounty = countyOptions[0];

					// Call the updateTableContentForLayer2 function with the first county
					updateTableContentForLayer2(firstCounty);
					// Add event listener to update the table when county selection changes
					countyFilterDropdown.addEventListener('change', function () {
						console.log('populateCountyFilterDropdown() event listener activated.');
						const selectedCounty = countyFilterDropdown.value;
						console.log('Variabla selected county in functia populare filtru: ', selectedCounty);
						updateTableContentForLayer2(selectedCounty);
					});	
				}
			});	

		

			function populateCountyFilterDropdown() {
				console.log('populateCountyFilterDropdown() is being called.');
				countyFilterDropdown = document.getElementById('county-filter');
				if (countyFilterDropdown) {
					// Clear previous options
					countyFilterDropdown.innerHTML = '<option value="">Judete</option>';

					// Populate the dropdown with county options
					countyOptions.forEach(county => {
						const option = document.createElement('option');
						option.value = county;
						option.textContent = county;
						countyFilterDropdown.appendChild(option);
					});
					console.log('s-a populat lista.')
				}
				console.log('populateCountyFilterDropdown() completed.');
			}
			
			function updateTableContentForLayer2(selectedCounty) {
				console.log('updateTableContentForLayer2(selectedCounty) is being called. Variabla selectata: ', selectedCounty);
				const tableContainer = document.getElementById('table-container-layer2');
				const layers = geojsonLayer2.getLayers();

				let tableHTML = '<h3>Municipii, Orașe sau Comune</h3><table><tr><th>Denumire</th><th>Populație totală</th></tr>';
				
				//console.log('tableHTML inainte if: ',tableHTML);

				layers.forEach(layer => {
					const name = layer.feature.properties.name;
					const population = layer.feature.properties.pop_tot;
					const county = layer.feature.properties.county;

					
					// Filter rows based on selected county
					if (!selectedCounty || selectedCounty === county) {
						tableHTML += `<tr data-name="${name}"><td>${name}</td><td>${population}</td></tr>`;
					}
				});

				tableHTML += '</table>';
				tableContainer.innerHTML = tableHTML;

				// Regenerate the "county-filter" dropdown
				const countyFilterDropdown = document.getElementById('county-filter');
				countyFilterDropdown.innerHTML = '<option value="">Județe</option>';
				countyOptions.forEach(county => {
					const option = document.createElement('option');
					option.value = county;
					option.textContent = county;
					countyFilterDropdown.appendChild(option);
				});
				
				console.log('updateTableContentForLayer2 completed.');
			}
			
			// Function to highlight a selected polygon and zoom to its extent (with minimum zoom level)
			function highlightPolygon(layer, name) {
				if (selectedLayer1) {
					selectedLayer1.setStyle({weight: 1, color: 'white' });
				}
				selectedLayer1 = layer.getLayers().find(layer => {
					return layer.feature.properties.name === name;
				});

				if (selectedLayer1) {
					// Highlight the selected layer
					selectedLayer1.setStyle({weight: 5, color: 'blue' });

					// Bring the selected layer to the front
					
					setTimeout(function(){
						selectedLayer1.bringToFront();
					},150);

					// Get the bounds of the selected polygon
					const bounds = selectedLayer1.getBounds();

					// Calculate the best zoom level that fits the polygon within the map's viewport
					const bestZoom = map.getBoundsZoom(bounds);

					// Set the new zoom level and center the map on the polygon based on the selected layer
					if (layer === geojsonLayer1) {
						// Adjust the zoom level if needed for layer 1
						const finalZoom = 9;
						map.setView(bounds.getCenter(), finalZoom);
					} else if (layer === geojsonLayer2) {
						// Adjust the zoom level if needed for layer 2
						const finalZoom = bestZoom - 1; 
						map.setView(bounds.getCenter(), finalZoom);
					}
				} 
				console.log('selectie finalizata');
			}




			
			// Add event listeners to the table rows for layer 1
			document.getElementById('table-container-layer1').addEventListener('click', function (event) {
				const selectedName = event.target.parentElement.getAttribute('data-name');
				if (selectedName) {
					highlightPolygon(geojsonLayer1, selectedName);
				}
			});

			// Add event listeners to the table rows for layer 2
			document.getElementById('table-container-layer2').addEventListener('click', function (event) {
				const selectedName = event.target.parentElement.getAttribute('data-name');
				if (selectedName) {
					highlightPolygon(geojsonLayer2, selectedName);
				}
			});
		});
		console.log('Functia setuMap finalizata.');
}
