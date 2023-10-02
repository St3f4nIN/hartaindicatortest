// HTML Elements
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const clearButton = document.getElementById("clear-button");

let mapList = document.querySelectorAll("ul#map_list li"); // Define mapList initially

// Function to show autocomplete suggestions and search results
function showSuggestionsAndResults() {
  const searchTerm = searchInput.value.toLowerCase();
  searchResults.innerHTML = ""; // Clear previous suggestions and results

  if (searchTerm === "") {
    // If the search input is empty, reset the list to its initial state or reload the page
    location.reload(); // This line reloads the page
    return;
  }

  // Create a container for search results
  const searchResultsContainer = document.createElement("ul");
  searchResultsContainer.classList.add("search-results-container");

  if (mapList) {
    mapList.forEach((item) => {
      const title = item.querySelector(".title").textContent.toLowerCase();
      const descr = item.querySelector(".descr").textContent.toLowerCase();

      if (title.includes(searchTerm) || descr.includes(searchTerm)) {
        // Clone the matching item
        const clonedItem = item.cloneNode(true);

        // Add the cloned item to the search results container
        searchResultsContainer.appendChild(clonedItem);

        // Display the matching item
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Append the search results container to the search results element
  searchResults.appendChild(searchResultsContainer);

  // Create an option for the suggestion list (Moved this part inside the loop)
  if (mapList) {
    mapList.forEach((item) => {
      const title = item.querySelector(".title").textContent.toLowerCase();
      if (title.includes(searchTerm)) {
        const option = document.createElement("option");
        option.value = title;
        searchResults.appendChild(option);
      }
    });
  }
}

// Event Listeners
searchInput.addEventListener("input", showSuggestionsAndResults);

searchButton.addEventListener("click", function () {
  searchItems();
});

searchInput.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    searchItems();
  }
});

// Function to perform search
function searchItems() {
  const searchTerm = searchInput.value.toLowerCase();
  const items = document.querySelectorAll("ul#map_list li");

  if (mapList) {
    mapList.forEach((item) => {
      const title = item.querySelector(".title").textContent.toLowerCase();
      const descr = item.querySelector(".descr").textContent.toLowerCase();

      if (title.includes(searchTerm) || descr.includes(searchTerm)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Clear autocomplete suggestions when search is performed
  searchResults.innerHTML = "";
}

// Function to clear search input
function clearSearch() {
  searchInput.value = "";
  searchResults.innerHTML = "";
}

clearButton.addEventListener("click", function () {
  searchInput.value = ""; // Clear the input field
  searchResults.innerHTML = ""; // Clear the autocomplete suggestions
  searchItems(); // Refresh the search results
});

document.getElementById("clear-button").addEventListener("click", function () {
  location.reload(); // This line reloads the page
});
