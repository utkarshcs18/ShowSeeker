import { base_api, watchmode_api, IMG_PATH, SEARCH_API } from "./keys.js";

window.onload = async () => {
    trendingMovies();
    setupSearch();
    setupModal(); 
};

async function trendingMovies(){
    try {
        const response = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${base_api}`);
        const data = await response.json();
        const currentMovies = data.results.slice(0,5);

        displayRecommendations(currentMovies);
    }catch(error){
        console.error(error);
    }
}

function displayRecommendations(movies){
    const grid = document.querySelector(".content-grid");
    grid.innerHTML = '';

    movies.forEach(item => {
        if (item.poster_path) {
            const card = createMovieCard(item); // CHANGED TO USE createMovieCard
            grid.appendChild(card);
        }
    });
}

function displaySearchResults(movies, query){
    const recommendationsTitle = document.querySelector(".section-title");
    const contentSection = document.querySelector(".content-section");
    recommendationsTitle.style.display = "none";
    contentSection.style.display = "none";

    const resultsSection = document.querySelector(".search-results-section");
    const resultsGrid = document.querySelector(".results-grid");
    const resultsTitle = document.querySelector(".results-title");

    resultsSection.style.display = "block";
    resultsTitle.textContent = `Search Results for "${query}"`;
    resultsGrid.innerHTML = '';

    if(movies && movies.length > 0){
        movies.forEach(item => {
            if (item.poster_path) {
                const card = createMovieCard(item);
                resultsGrid.appendChild(card); 
            }
        });
    } else {
        resultsGrid.innerHTML = "<p style='color: #fff; text-align: center;'>No results found. Try a different search term.</p>";
    }
}

function createMovieCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
        <img src="${IMG_PATH + item.poster_path}" alt="${item.title || item.name}">
        <h4>${item.title || item.name}</h4>
    `;
    
    card.addEventListener('click', () => {
        openModal(item);
    });
    
    return card;
}

function setupModal() {
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
       
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

function openModal(movie) {
    const modal = document.getElementById('movieModal');
    modal.style.display = 'block';
    
    displayMovieDetails(movie);
    fetchOTTPlatforms(movie.title || movie.name, movie.media_type);
}

function displayMovieDetails(movie) {
    const imageDiv = document.querySelector('.modal .image-div');
    if (imageDiv && movie.poster_path) {
        imageDiv.style.backgroundImage = `url(${IMG_PATH + movie.poster_path})`;
        imageDiv.style.backgroundSize = 'cover';
        imageDiv.style.backgroundPosition = 'center';
        imageDiv.innerHTML = '';
    }
    
    const descriptionDiv = document.querySelector('.modal .description-div');
    if (descriptionDiv) {
        descriptionDiv.innerHTML = `<strong>Description:</strong> ${movie.overview || 'No description available'}`;
    }
    
    const ratingDiv = document.querySelector('.modal .rating-div');
    if (ratingDiv) {
        ratingDiv.innerHTML = `<strong>Rating:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) + '/10' : 'N/A'}`;
    }

    const ottDiv = document.querySelector('.modal .ott-div');
    if (ottDiv) {
        ottDiv.innerHTML = '<strong>Available on:</strong> Loading...';
    }
}

async function fetchOTTPlatforms(title, mediaType) {
    try {
        const searchUrl = `https://api.watchmode.com/v1/search/?apiKey=${watchmode_api}&search_field=name&search_value=${encodeURIComponent(title)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        console.log("Watchmode search results:", searchData);
        
        if (searchData.title_results && searchData.title_results.length > 0) {
            const firstResult = searchData.title_results[0];
            const titleId = firstResult.id;
            
            const detailsUrl = `https://api.watchmode.com/v1/title/${titleId}/details/?apiKey=${watchmode_api}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            console.log("Watchmode details:", detailsData);
            
            displayOTTPlatforms(detailsData.sources);
        } else {
            const ottDiv = document.querySelector('.modal .ott-div');
            if (ottDiv) {
                ottDiv.innerHTML = '<strong>Available on:</strong> Not found';
            }
        }
        
    } catch(error) {
        console.error('Error fetching OTT platforms:', error);
        const ottDiv = document.querySelector('.modal .ott-div');
        if (ottDiv) {
            ottDiv.innerHTML = '<strong>Available on:</strong> Information unavailable';
        }
    }
}

function displayOTTPlatforms(sources) {
    const ottDiv = document.querySelector('.modal .ott-div');
    
    if (!ottDiv) return;
    
    if (sources && sources.length > 0) {
        const streamingSources = sources.filter(source => 
            source.type === 'sub' || source.format === 'streaming'
        );
        
        if (streamingSources.length > 0) {
            const platforms = [...new Set(streamingSources.map(s => s.name))];
            ottDiv.innerHTML = `<strong>Available on:</strong> ${platforms.slice(0, 5).join(', ')}`;
        } else {
            ottDiv.innerHTML = '<strong>Available on:</strong> Available for purchase/rent only';
        }
    } else {
        ottDiv.innerHTML = '<strong>Available on:</strong> Not available for streaming';
    }
}

function setupSearch() {
    const searchbtn = document.querySelector(".search-btn");
    const searchInput = document.querySelector(".search");

    if (searchbtn && searchInput) {
        searchbtn.addEventListener("click", () => {
            const searchValue = searchInput.value.trim();
            if(searchValue){
                searchMovie(searchValue);
            }
        });

        searchInput.addEventListener("keypress", (e) => {
            if(e.key === 'Enter'){
                const searchValue = searchInput.value.trim();
                if(searchValue){
                    searchMovie(searchValue);
                }
            }
        });
    }
}

async function searchMovie(query) {
    try{
        const response = await fetch(SEARCH_API + encodeURIComponent(query));
        const data = await response.json();
        displaySearchResults(data.results, query);
    }catch(error){
        console.error("Search error:", error);
        const resultsGrid = document.querySelector(".results-grid");
        if (resultsGrid) {
            resultsGrid.innerHTML = "<p style='color: #fff; text-align: center;'>Error searching. Please try again.</p>";
        }
    }
}