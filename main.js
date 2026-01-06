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
            const card = createMovieCard(item); 
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
        resultsGrid.innerHTML = "<p style='color: #fff; text-align: center;'>No results found. Try a different search.</p>";
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
    
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    const movieTitle = movie.title || movie.name;
    fetchOTTPlatforms(movie.id, mediaType, movieTitle);
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
        descriptionDiv.innerHTML = `
            <strong>Synopsis</strong>
            <p>${movie.overview || 'No description available'}</p>
        `;
    }
    
    const ratingDiv = document.querySelector('.modal .rating-div');
    if (ratingDiv) {
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        ratingDiv.innerHTML = `
            <strong>Rating</strong>
            <div class="rating-score">${rating}<span style="font-size: 18px; color: #888;">/10</span></div>
        `;
    }

    const ottDiv = document.querySelector('.modal .ott-div');
    if (ottDiv) {
        ottDiv.innerHTML = '<strong>Watch Now</strong><div class="platform-buttons"><span style="color: #888;">Loading platforms...</span></div>';
    }
}


async function fetchOTTPlatforms(movieId, mediaType, movieTitle) {
    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `https://api.themoviedb.org/3/${type}/${movieId}/watch/providers?api_key=${base_api}`;
        console.log("Fetching TMDB providers:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("TMDB providers:", data);
        
        const ottDiv = document.querySelector('.modal .ott-div');
        if (!ottDiv) return;
        
        if (data.results) {
            const region = data.results.IN || data.results.US || Object.values(data.results)[0];
            
            if (region) {
                const flatrate = region.flatrate || [];
                const buy = region.buy || [];
                const rent = region.rent || [];
                
                if (flatrate.length > 0) {
                    displayClickablePlatforms(flatrate, movieTitle, ottDiv);
                } else if (buy.length > 0 || rent.length > 0) {
                    const allPlatforms = [...buy, ...rent];
                    displayClickablePlatforms(allPlatforms, movieTitle, ottDiv, '(rent/buy)');
                } else {
                    ottDiv.innerHTML = '<strong>Watch Now</strong> Not available for streaming';
                }
            } else {
                ottDiv.innerHTML = '<strong>Watch Now</strong> Not available in your region / Not available for streaming';
            }
        } else {
            ottDiv.innerHTML = '<strong>Watch Now</strong> No info available';
        }
    } catch(error) {
        console.error('Error fetching OTT:', error);
        const ottDiv = document.querySelector('.modal .ott-div');
        if (ottDiv) {
            ottDiv.innerHTML = '<strong>Available on:</strong> Error loading';
        }
    }
}

function displayClickablePlatforms(platforms, movieTitle, ottDiv, suffix = '') {
    const uniquePlatforms = [...new Map(platforms.map(p => [p.provider_id, p])).values()].slice(0, 5);
    
    const platformIcons = {
        'Netflix': '',
        'Amazon Prime Video': '',
        'Disney Plus': '',
        'Disney+ Hotstar': '',
        'Hotstar': '',
        'Apple TV Plus': '',
        'Apple TV': '',
        'Hulu': '',
        'HBO Max': '',
        'Max': '',
        'YouTube': '',
        'SonyLIV': '',
        'Zee5': '',
        'default': ''
    };
    
    const getSearchUrl = (providerName, title) => {
        const encodedTitle = encodeURIComponent(title);
        
        const searchUrls = {
            'Netflix': `https://www.netflix.com/search?q=${encodedTitle}`,
            'Amazon Prime Video': `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${encodedTitle}`,
            'Disney Plus': `https://www.disneyplus.com/search?q=${encodedTitle}`,
            'Hotstar': `https://www.hotstar.com/in/search?q=${encodedTitle}`,
            'Disney+ Hotstar': `https://www.hotstar.com/in/search?q=${encodedTitle}`,
            'Apple TV Plus': `https://tv.apple.com/search?q=${encodedTitle}`,
            'Apple TV': `https://tv.apple.com/search?q=${encodedTitle}`,
            'Hulu': `https://www.hulu.com/search?q=${encodedTitle}`,
            'HBO Max': `https://www.max.com/search?q=${encodedTitle}`,
            'Max': `https://www.max.com/search?q=${encodedTitle}`,
            'Paramount Plus': `https://www.paramountplus.com/search/?query=${encodedTitle}`,
            'Paramount+': `https://www.paramountplus.com/search/?query=${encodedTitle}`,
            'Peacock': `https://www.peacocktv.com/search/${encodedTitle}`,
            'YouTube': `https://www.youtube.com/results?search_query=${encodedTitle}`,
            'Google Play Movies': `https://play.google.com/store/search?q=${encodedTitle}&c=movies`,
            'SonyLIV': `https://www.sonyliv.com/search?q=${encodedTitle}`,
            'Zee5': `https://www.zee5.com/search?q=${encodedTitle}`,
            'Voot': `https://www.voot.com/search?q=${encodedTitle}`,
            'JioCinema': `https://www.jiocinema.com/search?q=${encodedTitle}`,
            'MX Player': `https://www.mxplayer.in/search?q=${encodedTitle}`
        };
        
        return searchUrls[providerName] || `https://www.google.com/search?q=${encodedTitle}+watch+online`;
    };
    
    const platformHTML = uniquePlatforms.map(platform => {
        const url = getSearchUrl(platform.provider_name, movieTitle);
        const icon = platformIcons[platform.provider_name] || platformIcons['default'];
        
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="platform-btn">
                   <span>${icon}</span>
                   <span>${platform.provider_name}</span>
                </a>`;
    }).join('');
    
    ottDiv.innerHTML = `
        <strong>Watch Now</strong>
        <div class="platform-buttons">
            ${platformHTML}
        </div>
        ${suffix ? '<span style="font-size: 13px; color: #666; display: block; margin-top: 12px;">' + suffix + '</span>' : ''}
    `;
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