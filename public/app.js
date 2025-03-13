// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// Global flvPlayer reference
let flvPlayer = null;

// Moderation settings
let showModerationResults = false;
// AI Response settings
let showAIResponses = false;
// Sound notification settings
let enableSoundNotifications = false;
// Notification settings
let enableMentionNotifications = true;
let enableModerationNotifications = true;
// User's own username (for mention notifications)
let yourUsername = '';
// AI provider settings
let aiProvider = 'openai';
let aiModel = '';
// Store available Ollama models
let availableOllamaModels = [];
// FLV Stream setting
let enableFlvStream = true;

// Global variables for moderation stats
let moderationStats = {
    total: 0,
    flagged: 0,
    safe: 0,
    categories: {
        harassment: 0,
        hate: 0,
        sexual: 0,
        violence: 0,
        self_harm: 0,
        illegal: 0
    }
};

// User list management
let currentUsersList = {
    friends: [],
    undesirables: []
};

// Flag to track if the user lists UI is open
let userListsVisible = false;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

// Function to play notification sound for flagged comments
function playFlaggedCommentSound(force = false) {
    if (force || enableSoundNotifications) {
        const sound = document.getElementById('flaggedCommentSound');
        if (sound) {
            // Reset the sound to the beginning (in case it's already playing)
            sound.currentTime = 0;
            sound.play().catch(error => {
                // Handle autoplay issues (like Chrome requiring user interaction)
                console.warn('Erreur lors de la lecture du son de notification:', error);
            });
        }
    }
}

// Function to show notification when user is mentioned
function showMentionNotification(data, text) {
    if (!yourUsername || !enableMentionNotifications) return; // Skip if username not set or notifications disabled
    
    // Create notification element
    const notification = $(`
        <div class="notification mention">
            <button class="notification-close" title="Fermer"></button>
            <div class="notification-title">Vous avez été mentionné par ${data.uniqueId}</div>
            <div class="notification-message">${sanitize(text)}</div>
        </div>
    `);
    
    // Add close button functionality
    notification.find('.notification-close').on('click', function() {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    // Add to notification container
    $('#notification-container').append(notification);
    
    // Play sound
    playFlaggedCommentSound(true);
}

// Function to show notification for moderated content
function showModerationNotification(data, text, moderationResult) {
    if (!enableModerationNotifications) return; // Skip if notifications disabled
    
    // Get the reason for flagging
    let reason = '';
    if (moderationResult.categories) {
        for (const category in moderationResult.categories) {
            if (moderationResult.categories[category]) {
                reason += (reason ? ', ' : '') + category;
            }
        }
    }
    
    // Create notification element
    const notification = $(`
        <div class="notification moderation">
            <button class="notification-close" title="Fermer"></button>
            <div class="notification-title">Contenu inapproprié détecté de ${data.uniqueId}</div>
            <div class="notification-message">${sanitize(text)}</div>
            <div class="notification-reason">Raison: ${reason || 'Non spécifiée'}</div>
        </div>
    `);
    
    // Add close button functionality
    notification.find('.notification-close').on('click', function() {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    // Add to notification container
    $('#notification-container').append(notification);
    
    // Play sound
    playFlaggedCommentSound(true);
}

// Function to update moderation stats
function updateModerationStats(moderationResult) {
    moderationStats.total++;
    
    if (moderationResult.flagged) {
        moderationStats.flagged++;
        
        // Update categories
        for (const [category, value] of Object.entries(moderationResult.categories)) {
            if (value) {
                moderationStats.categories[category]++;
            }
        }
    } else {
        moderationStats.safe++;
    }
    
    // Update the UI
    updateModerationSummaryUI();
}

// Function to update the moderation summary UI
function updateModerationSummaryUI() {
    if (!$('#moderation-summary').length) {
        return;
    }
    
    // Update the counts
    $('#moderation-total-count').text(moderationStats.total);
    $('#moderation-flagged-count').text(moderationStats.flagged);
    $('#moderation-safe-count').text(moderationStats.safe);
    
    // Update the categories
    const categoriesDiv = $('#moderation-categories');
    categoriesDiv.empty();
    
    for (const [category, count] of Object.entries(moderationStats.categories)) {
        if (count > 0) {
            categoriesDiv.append(`
                <div class="moderation-stat">
                    <span>${category}</span>
                    <span class="moderation-stat-count flagged-count">${count}</span>
                </div>
            `);
        }
    }
}

$(document).ready(() => {
    // Initialize tooltips and popovers from Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    // Update theme handling
    function setTheme(isDark) {
        if (isDark) {
            $('body').addClass('dark-theme');
            $('html').attr('data-bs-theme', 'dark');
            $('#darkThemeToggle').prop('checked', true);
        } else {
            $('body').removeClass('dark-theme');
            $('html').attr('data-bs-theme', 'light');
            $('#darkThemeToggle').prop('checked', false);
        }
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkTheme');
    setTheme(savedTheme === 'true');
    
    // Handle dark theme toggle
    $('#darkThemeToggle').change(function() {
        const isDark = $(this).is(':checked');
        setTheme(isDark);
        localStorage.setItem('darkTheme', isDark.toString());
    });
    
    // Connect button functionality
    $('#connectButton').click(connect);
    
    // Remove any existing click handlers and add new one for toggle user lists panel
    //$('#toggleUserLists').off('click').on('click', function(event) {
      //  toggleUserListsPanel(event);
    //});
    
    // Handle tabs with Bootstrap
    // No need for custom tab handling as Bootstrap handles it with data-bs-toggle
    
    // Load user lists
    loadUserLists();
    
    // Setup notification permissions
    setupNotifications();
    
    // AI Provider Selection
    $('input[name="aiProvider"]').change(function() {
        aiProvider = $(this).val();
        
        // Show/hide the appropriate settings section
        if (aiProvider === 'openai') {
            $('#openaiSettings').show();
            $('#ollamaSettings').hide();
        } else if (aiProvider === 'ollama') {
            $('#openaiSettings').hide();
            $('#ollamaSettings').show();
        }
    });
    
    // Update username when input changes
    $('#yourUsernameInput').on('change', function() {
        yourUsername = $(this).val().trim().toLowerCase();
    });
    
    // Feature toggle handlers
    $('#showModerationToggle').on('change', function() {
        showModerationResults = $(this).is(':checked');
    });
    
    $('#showResponsesToggle').on('change', function() {
        showAIResponses = $(this).is(':checked');
    });
    
    $('#enableMentionNotification').on('change', function() {
        enableMentionNotifications = $(this).is(':checked');
    });
    
    $('#enableModerationNotification').on('change', function() {
        enableModerationNotifications = $(this).is(':checked');
    });
    
    $('#enableSoundToggle').on('change', function() {
        enableSoundNotifications = $(this).is(':checked');
    });
    
    // FLV Stream toggle handler
    $('#enableFlvStreamToggle').on('change', function() {
        enableFlvStream = $(this).is(':checked');
        
        // If stream is disabled and player exists, stop the video
        if (!enableFlvStream && flvPlayer) {
            // Hide video container
            $('#videoContainer').hide();
            
            // Clean up player
            flvPlayer.pause();
            flvPlayer.unload();
            flvPlayer.detachMediaElement();
            flvPlayer.destroy();
            flvPlayer = null;
        } else if (enableFlvStream && connection.isConnected) {
            // If stream is enabled and we're already connected, try to reinitialize the player
            const streamUrl = connection.getStreamUrl();
            if (streamUrl) {
                $('#videoContainer').show();
                initializeVideoPlayer(streamUrl);
            }
        }
    });
    
    // Initialize values from URL parameters (for OBS overlay)
    if (window.settings.showModeration !== undefined) {
        showModerationResults = !!window.settings.showModeration;
        $('#showModerationToggle').prop('checked', showModerationResults);
    }
    
    if (window.settings.showResponses !== undefined) {
        showAIResponses = !!window.settings.showResponses;
        $('#showResponsesToggle').prop('checked', showAIResponses);
    }
    
    if (window.settings.enableSound !== undefined) {
        enableSoundNotifications = !!window.settings.enableSound;
        $('#enableSoundToggle').prop('checked', enableSoundNotifications);
    }
    
    if (window.settings.enableMentionNotification !== undefined) {
        enableMentionNotifications = !!window.settings.enableMentionNotification;
        $('#enableMentionNotification').prop('checked', enableMentionNotifications);
    }
    
    if (window.settings.enableModerationNotification !== undefined) {
        enableModerationNotifications = !!window.settings.enableModerationNotification;
        $('#enableModerationNotification').prop('checked', enableModerationNotifications);
    }
    
    if (window.settings.yourUsername !== undefined) {
        yourUsername = window.settings.yourUsername;
        $('#yourUsernameInput').val(yourUsername);
    }
    
    // Apply FLV stream setting from URL parameter (for OBS overlay)
    if (window.settings.enableFlvStream !== undefined) {
        enableFlvStream = !!parseInt(window.settings.enableFlvStream);
        $('#enableFlvStreamToggle').prop('checked', enableFlvStream);
    }
    
    // Apply dark theme from URL parameter (for OBS overlay)
    if (window.settings.darkTheme !== undefined) {
        const darkTheme = !!parseInt(window.settings.darkTheme);
        if (darkTheme) {
            $('body').addClass('dark-theme');
            $('#darkThemeToggle').prop('checked', true);
        }
    }
    
    // Handle Ollama model selection
    $('#ollamaModel').change(function() {
        aiModel = $(this).val();
    });
    
    // Save user's username when entered
    $('#yourUsernameInput').on('change', function() {
        yourUsername = $(this).val().trim();
        // Remove @ symbol if present
        if (yourUsername.startsWith('@')) {
            yourUsername = yourUsername.substring(1);
        }
        
        // Store in localStorage for convenience
        if (yourUsername) {
            localStorage.setItem('tiktokUsername', yourUsername);
        } else {
            localStorage.removeItem('tiktokUsername');
        }
    });
    
    // Load username from localStorage if available
    const savedUsername = localStorage.getItem('tiktokUsername');
    if (savedUsername) {
        $('#yourUsernameInput').val(savedUsername);
        yourUsername = savedUsername;
    }

    // Add moderation toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="showModerationToggle"> Afficher les résultats de modération
            </label>
        </div>
    `);

    // Add AI responses toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="showResponsesToggle"> Afficher les réponses suggérées par l'IA
            </label>
        </div>
    `);

    // Add sound notification toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="enableSoundToggle"> Jouer un son pour les commentaires signalés
            </label>
        </div>
    `);

    // Add moderation summary section
    $('.splitstatetable').after(`
        <div class="moderation-summary" id="moderation-summary">
            <h3>Résumé de Modération</h3>
            <div class="moderation-stat">
                <span>Total des messages analysés:</span>
                <span class="moderation-stat-count" id="moderation-total-count">0</span>
            </div>
            <div class="moderation-stat">
                <span>Messages sûrs:</span>
                <span class="moderation-stat-count safe-count" id="moderation-safe-count">0</span>
            </div>
            <div class="moderation-stat">
                <span>Messages signalés:</span>
                <span class="moderation-stat-count flagged-count" id="moderation-flagged-count">0</span>
            </div>
            <h4>Catégories signalées:</h4>
            <div id="moderation-categories"></div>
        </div>
    `);

    // Initially hide the moderation summary
    $('#moderation-summary').toggle(false);

    // Handle moderation toggle
    $('#showModerationToggle').change(function() {
        showModerationResults = $(this).is(':checked');
        if (showModerationResults) {
            $('body').addClass('show-moderation');
            $('#moderation-summary').show();
        } else {
            $('body').removeClass('show-moderation');
            $('#moderation-summary').hide();
        }
    });

    // Handle AI responses toggle
    $('#showResponsesToggle').change(function() {
        showAIResponses = $(this).is(':checked');
        if (showAIResponses) {
            $('body').addClass('show-responses');
        } else {
            $('body').removeClass('show-responses');
        }
    });

    // Handle sound notification toggle
    $('#enableSoundToggle').change(function() {
        enableSoundNotifications = $(this).is(':checked');
        
        // Play a test sound when enabled
        if (enableSoundNotifications) {
            playFlaggedCommentSound();
        }
    });

    if (window.settings.username) connect();
    
    // Listen for Ollama models from the server
    connection.on('ollamaModels', (models) => {
        availableOllamaModels = models;
        
        // Populate the model dropdown
        const $modelSelect = $('#ollamaModel');
        $modelSelect.empty();
        
        if (models.length === 0) {
            $modelSelect.append('<option value="">Aucun modèle disponible</option>');
            $('.ollamaStatus').text('Aucun modèle trouvé sur le serveur Ollama ou serveur inaccessible').addClass('error');
        } else {
            // Add models to the dropdown
            models.forEach(model => {
                $modelSelect.append(`<option value="${model.name}">${model.name} (${model.details.parameter_size || 'Taille inconnue'})</option>`);
            });
            
            // Select the first model by default
            if (models.length > 0) {
                aiModel = models[0].name;
                $modelSelect.val(aiModel);
            }
            
            $('.ollamaStatus').text(`Connecté au serveur Ollama avec ${models.length} modèles disponibles`).removeClass('error').addClass('success');
        }
    });

    // Add event listener for the user lists toggle button
    $('#toggleUserLists').click(toggleUserListsPanel);
    
    // Load user lists on startup
    loadUserLists();
})

// Function to initialize or update the video player with a stream URL
function initializeVideoPlayer(streamUrl) {
    // Check if flvjs is supported
    if (!flvjs.isSupported()) {
        console.error('FLV playback is not supported in this browser.');
        return;
    }
    
    console.log('Initializing video player with URL:', streamUrl);
    const videoElement = document.getElementById('flvPlayer');
    
    if (!videoElement) {
        console.error('Video element with ID "flvPlayer" not found in the DOM');
        return;
    }
    
    // Destroy existing player if it exists
    if (flvPlayer) {
        flvPlayer.pause();
        flvPlayer.unload();
        flvPlayer.detachMediaElement();
        flvPlayer.destroy();
        flvPlayer = null;
    }
    
    // Create new player with the stream URL
    flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: streamUrl,
        isLive: true
    });
    
    flvPlayer.attachMediaElement(videoElement);
    flvPlayer.load();
    
    // Ensure video container is visible
    $('#videoContainer').show();
    
    // Set autoplay attribute and play
    videoElement.autoplay = true;
    
    // Play the video (may be blocked by browser autoplay policies)
    flvPlayer.play().catch(error => {
        console.warn('Auto-play was prevented by the browser. Please click play:', error);
        // Show a message to the user that they need to interact with the video
        $('#videoContainer').prepend('<div class="alert alert-warning alert-dismissible fade show" role="alert">Cliquez sur le lecteur vidéo pour lancer la lecture<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>');
    });
}

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connexion en cours...');

        // Include AI provider settings in connection options
        const options = {
            enableExtendedGiftInfo: true,
            aiProvider: aiProvider,
            aiModel: aiModel,
            showModeration: showModerationResults,
            showResponses: showAIResponses
        };
        
        // Add OpenAI API key if OpenAI is selected and key is provided
        if (aiProvider === 'openai') {
            const openaiApiKey = $('#openaiApiKey').val();
            if (openaiApiKey) {
                options.openaiApiKey = openaiApiKey;
            }
        }

        connection.connect(uniqueId, options).then((state,data) => {
            console.log('Connecté à la salle', state.roomId);
            console.log(state);
            console.log(data);
            // This is the URL of the video stream flv
            const streamUrl = state.roomInfo.stream_url.flv_pull_url.SD1;
            console.log(state.roomInfo.stream_url.flv_pull_url);
            console.log('Stream URL:', streamUrl);
            $('#stateText').text(`Connecté à la salle ${state.roomId}`);

            // Initialize video player with the stream URL only if enabled
            if (streamUrl && enableFlvStream) {
                initializeVideoPlayer(streamUrl);
                // Store the stream URL in the connection object for later use
                connection.getStreamUrl = function() { return streamUrl; };
                connection.isConnected = true;
            } else if (!enableFlvStream) {
                console.log('FLV stream disabled by user setting');
                $('#videoContainer').hide();
                connection.getStreamUrl = function() { return streamUrl; };
                connection.isConnected = true;
            } else {
                console.error('No stream URL available');
                $('#videoContainer').html('<div class="alert alert-danger">Aucun flux vidéo disponible pour ce direct</div>');
                connection.isConnected = false;
            }

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();
            
            // Play a test sound on successful connection to verify it works
            playFlaggedCommentSound(true); // Force play the sound on connection

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);
            
            // Hide video container on error
            $('#videoContainer').hide();

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert("Aucun nom d'utilisateur saisi");
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    $('#roomStats').html(`Spectateurs: <b>${viewerCount.toLocaleString()}</b> J'aime: <b>${likeCount.toLocaleString()}</b> Diamants gagnés: <b>${diamondsCount.toLocaleString()}</b>`)
}

// Update generateUsernameLink to include user actions
function generateUsernameLink(data) {
    return `
        <div class="username-container">
            <a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.nickname}</a>
            ${createUserActionButtons(data)}
        </div>
    `;
}

// Function to create user action buttons
function createUserActionButtons(data) {
    return `
        <div class="user-actions-dropdown">
            <button class="user-actions-toggle">•••</button>
            <div class="user-actions-menu">
                <button class="add-to-friends" data-tiktok-id="${data.uniqueId}" data-nickname="${data.nickname}">Ajouter aux amis</button>
                <button class="add-to-undesirables" data-tiktok-id="${data.uniqueId}" data-nickname="${data.nickname}">Ajouter aux indésirables</button>
            </div>
        </div>
    `;
}

// Update addChatItem to highlight friends and show undesirables in red
function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();
    
    // Check if message mentions the user
    if (yourUsername && text) {
        // Check for @username pattern (case insensitive)
        const mentionRegex = new RegExp(`@${yourUsername}\\b`, 'i');
        if (mentionRegex.test(text)) {
            // Show notification and play sound
            showMentionNotification(data, text);
        }
    }
    
    // Check if user is in undesirables list - mark in red instead of hiding
    const undesirable = currentUsersList.undesirables.find(u => u.tiktok_id === data.uniqueId);
    const isFriend = currentUsersList.friends.some(f => f.tiktok_id === data.uniqueId);
    
    // Set appropriate class based on user status
    let userStatusClass = '';
    if (isFriend) {
        userStatusClass = 'friend-message';
    } else if (undesirable) {
        userStatusClass = 'undesirable-message';
    }

    // Construct the message with the existing HTML structure
    let containerContent = `
        <div class="chatitem ${userStatusClass}">
            <div>
                <img class="miniprofilepicture" src="${data.profilePictureUrl}">
                <span>
                    <b>${generateUsernameLink(data)}:</b> <span class="comment-text">${text}</span>
                </span>
                ${data.moderation || data.pendingModeration ? '<a href="#" class="moderation-toggle">[Modération]</a>' : ''}
                ${data.suggestedResponse || data.pendingResponse ? '<a href="#" class="response-toggle">[Réponse IA]</a>' : ''}
            </div>
        </div>
    `;

    // Create the main chat div
    let chatDiv = $(
        `<div class=${summarize ? 'temporary' : 'static'} data-msg-id="${data.msgId}">
            ${containerContent}
        </div>`
    );

    // Add moderation info if available
    if (data.moderation) {
        let moderationClass = data.moderation.flagged ? 'moderation-flagged' : 'moderation-safe';
        let moderationInfoDiv = $(`<div class="moderation-info ${moderationClass}" style="display:none;"></div>`);
        
        // Calculate the sum of all category scores
        let totalScore = 0;
        for (const score of Object.values(data.moderation.category_scores)) {
            totalScore += score;
        }
        
        // Add flagged status with badge and total score
        moderationInfoDiv.append(`
            <div>
                <strong>${data.moderation.flagged ? 'SIGNALÉ' : 'SÛR'}</strong>
                <span class="moderation-total-score">(Score total: ${totalScore.toFixed(2)})</span>
                <span class="moderation-badge ${data.moderation.flagged ? 'flagged' : 'safe'}">
                    ${data.moderation.flagged ? '⚠️' : '✓'}
                </span>
            </div>
        `);
        
        // Handle flagged content notifications
        if (data.moderation.flagged) {
            // Play notification sound for flagged comments
            playFlaggedCommentSound();
            
            // Show moderation notification if enabled
            if (enableModerationNotifications) {
                showModerationNotification(data, text, data.moderation);
            }
        }
        
        // Add Ollama reason if available and flagged
        if (data.moderation.flagged && data.moderation.ollama_reason) {
            moderationInfoDiv.append(`<div class="moderation-reason"><strong>Raison:</strong> ${data.moderation.ollama_reason}</div>`);
        }
        
        // Add category information for ALL messages (not just flagged ones)
        let categoriesDiv = $('<div class="moderation-categories"></div>');
        let hasCategories = false;
        
        for (const [category, score] of Object.entries(data.moderation.category_scores)) {
            const formattedScore = score.toFixed(2);
            const isFlagged = data.moderation.categories[category];
            const categoryClass = isFlagged ? 'flagged' : 'safe';
            
            // Only show categories with non-zero scores or that are flagged
            if (score > 0 || isFlagged) {
                categoriesDiv.append(`<span class="moderation-category ${categoryClass}">${category}: ${formattedScore}</span>`);
                hasCategories = true;
            }
        }
        
        // Only append categories div if it has content
        if (hasCategories) {
            moderationInfoDiv.append(categoriesDiv);
        }
        
        chatDiv.append(moderationInfoDiv);
        
        // Add click handler for the moderation toggle
        chatDiv.find('.moderation-toggle').click(function(e) {
            e.preventDefault();
            moderationInfoDiv.toggle();
        });
        
        // Update moderation stats
        updateModerationStats(data.moderation);
    } else if (data.pendingModeration) {
        // Add empty placeholder for the moderation info
        let loadingDiv = $(`<div class="moderation-info" style="display:none;">
            <div class="loading-text">Analyse de modération en cours...</div>
        </div>`);
        chatDiv.append(loadingDiv);
        
        // Update the toggle to show loading status
        chatDiv.find('.moderation-toggle').addClass('loading').html('[Modération...]');
    }

    // Add suggested response if available
    if (data.suggestedResponse) {
        let responseInfoDiv = $(`<div class="response-info" style="display:none;"><strong>Réponse suggérée par l'IA :</strong> <p>${sanitize(data.suggestedResponse)}</p></div>`);
        chatDiv.append(responseInfoDiv);
        
        // Add click handler for the response toggle
        chatDiv.find('.response-toggle').click(function(e) {
            e.preventDefault();
            responseInfoDiv.toggle();
        });
    } else if (data.pendingResponse) {
        // Add empty placeholder for the response
        let loadingDiv = $(`<div class="response-info" style="display:none;">
            <div class="loading-text">Génération de la réponse IA en cours...</div>
        </div>`);
        chatDiv.append(loadingDiv);
        
        // Update the toggle to show loading status
        chatDiv.find('.response-toggle').addClass('loading').html('[Réponse IA...]');
    }

    container.append(chatDiv);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);

    // Attach event handlers for user action buttons
    chatDiv.find('.add-to-friends').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        addToFriendsList(tiktokId, nickname);
    });
    
    chatDiv.find('.add-to-undesirables').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
        addToUndesirablesList(tiktokId, nickname, reason);
    });
    
    // Show/hide dropdown menu when toggle is clicked
    chatDiv.find('.user-actions-toggle').click(function(e) {
        e.stopPropagation();
        $(this).next('.user-actions-menu').toggle();
    });
    
    // Hide dropdown when clicking elsewhere
    $(document).click(function() {
        $('.user-actions-menu').hide();
    });
}

// Load user lists on startup
function loadUserLists() {
    console.log('Chargement des listes d\'utilisateurs...');
    
    // Initialize lists if not already done
    if (!currentUsersList) {
        currentUsersList = {
            friends: [],
            undesirables: []
        };
    }
    
    // Show loading indicators in lists
    $('#friendsList').html('<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></div>');
    $('#undesirablesList').html('<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></div>');
    
    // Track loading state
    let friendsLoaded = false;
    let undesirableLoaded = false;
    
    // Function to update UI once both lists are loaded
    function updateUI() {
        if (friendsLoaded && undesirableLoaded) {
            console.log("Both lists loaded, updating UI");
            updateUserListsUI();
        }
    }
    
    // Load friends with fetch API
    fetch('/api/users/friends')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${data.length} amis chargés`);
            currentUsersList.friends = data;
            friendsLoaded = true;
            updateUI();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des amis:', error);
            // Set empty list on error to avoid undefined errors
            currentUsersList.friends = [];
            // Show error in friends list
            $('#friendsList').html(`<div class="alert alert-danger">Erreur lors du chargement des amis: ${error.message}</div>`);
            friendsLoaded = true;
            updateUI();
        });
    
    // Load undesirables with fetch API
    fetch('/api/users/undesirables')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${data.length} indésirables chargés`);
            currentUsersList.undesirables = data;
            undesirableLoaded = true;
            updateUI();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des indésirables:', error);
            // Set empty list on error to avoid undefined errors
            currentUsersList.undesirables = [];
            // Show error in undesirables list
            $('#undesirablesList').html(`<div class="alert alert-danger">Erreur lors du chargement des indésirables: ${error.message}</div>`);
            undesirableLoaded = true;
            updateUI();
        });
}

// Update the user lists UI
function updateUserListsUI() {
    // No need to check if panel is visible - always update the lists
    // This ensures data is ready when panel is opened
    
    const friendsList = $('#friendsList');
    const undesirablesList = $('#undesirablesList');
    
    console.log('Mise à jour des listes d\'utilisateurs');
    console.log(`Amis: ${currentUsersList.friends.length}`);
    console.log(`Indésirables: ${currentUsersList.undesirables.length}`);
    
    // Debug - check if elements exist
    console.log('friendsList element exists:', friendsList.length > 0);
    console.log('undesirablesList element exists:', undesirablesList.length > 0);
    
    // Debug - show current user lists data
    console.log('Friends data:', JSON.stringify(currentUsersList.friends));
    console.log('Undesirables data:', JSON.stringify(currentUsersList.undesirables));
    
    // Update friends list
    friendsList.empty();
    if (!currentUsersList.friends || currentUsersList.friends.length === 0) {
        friendsList.append('<div class="empty-list-message">Aucun ami dans la liste</div>');
    } else {
        currentUsersList.friends.forEach(friend => {
            const lastSeen = new Date(friend.last_seen).toLocaleString();
            const item = $(`
                <div class="user-list-item card mb-2" data-tiktok-id="${friend.nickname}">
                    <div class="card-body">
                        <div class="user-info">
                            <a href="https://www.tiktok.com/@${friend.tiktok_id}" target="_blank" class="user-nickname">${friend.nickname}</a>
                            <span class="user-id">@${friend.tiktok_id}</span>
                            <span class="user-last-seen">Dernière apparition: ${lastSeen}</span>
                        </div>
                        <div class="user-actions mt-2">
                            <button class="remove-friend btn btn-sm btn-outline-danger" data-tiktok-id="${friend.tiktok_id}" data-nickname="${friend.nickname}">
                                <i class="bi bi-trash me-1"></i>Retirer
                            </button>
                            <button class="move-to-undesirable btn btn-sm btn-outline-warning ms-2" data-tiktok-id="${friend.tiktok_id}" data-nickname="${friend.nickname}">
                                <i class="bi bi-arrow-right me-1"></i>Déplacer vers indésirables
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            console.log('Adding friend item to DOM:', friend.nickname);
            friendsList.append(item);
        });
    }
    
    // Update undesirables list
    undesirablesList.empty();
    if (!currentUsersList.undesirables || currentUsersList.undesirables.length === 0) {
        undesirablesList.append('<div class="empty-list-message">Aucun utilisateur indésirable dans la liste</div>');
    } else {
        currentUsersList.undesirables.forEach(user => {
            const lastSeen = new Date(user.last_seen).toLocaleString();
            const reason = user.reason ? `<span class="undesirable-reason">Raison: ${user.reason}</span>` : '';
            const item = $(`
                <div class="user-list-item card mb-2" data-tiktok-id="${user.nickname}">
                    <div class="card-body">
                        <div class="user-info">
                            <a href="https://www.tiktok.com/@${user.tiktok_id}" target="_blank" class="user-nickname">${user.nickname}</a>
                            <span class="user-id">@${user.tiktok_id}</span>
                            <span class="user-last-seen">Dernière apparition: ${lastSeen}</span>
                            ${reason}
                        </div>
                        <div class="user-actions mt-2">
                            <button class="remove-undesirable btn btn-sm btn-outline-danger" data-tiktok-id="${user.tiktok_id}" data-nickname="${user.nickname}">
                                <i class="bi bi-trash me-1"></i>Retirer
                            </button>
                            <button class="move-to-friend btn btn-sm btn-outline-success ms-2" data-tiktok-id="${user.tiktok_id}" data-nickname="${user.nickname}">
                                <i class="bi bi-arrow-right me-1"></i>Déplacer vers amis
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            console.log('Adding undesirable item to DOM:', user.nickname);
            undesirablesList.append(item);
        });
    }
    
    // Debug - check final DOM content
    //console.log('Final friendsList HTML content:', friendsList.html());
    //console.log('Final undesirablesList HTML content:', undesirablesList.html());
    
    // Re-attach event listeners
    attachUserActionListeners();
}

// Function to attach event listeners to user action buttons
function attachUserActionListeners() {
    // Remove old event listeners by cloning and replacing elements
    $('.remove-friend').each(function() {
        const clone = $(this).clone(true);
        $(this).replaceWith(clone);
    });
    
    $('.move-to-undesirable').each(function() {
        const clone = $(this).clone(true);
        $(this).replaceWith(clone);
    });
    
    $('.remove-undesirable').each(function() {
        const clone = $(this).clone(true);
        $(this).replaceWith(clone);
    });
    
    $('.move-to-friend').each(function() {
        const clone = $(this).clone(true);
        $(this).replaceWith(clone);
    });
    
    // Add new event listeners
    $('.remove-friend').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        console.log(`Removing friend: ${tiktokId}`);
        removeFriend(tiktokId);
    });
    
    $('.move-to-undesirable').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        console.log(`Moving to undesirable: ${tiktokId} (${nickname})`);
        moveToUndesirable(tiktokId, nickname);
    });
    
    $('.remove-undesirable').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        console.log(`Removing undesirable: ${tiktokId}`);
        removeUndesirable(tiktokId);
    });
    
    $('.move-to-friend').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        console.log(`Moving to friend: ${tiktokId} (${nickname})`);
        moveToFriend(tiktokId, nickname);
    });
    
    // User search results action buttons
    $('.add-to-friends-search').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        console.log(`Adding to friends from search: ${tiktokId} (${nickname})`);
        addToFriendsList(tiktokId, nickname);
    });
    
    $('.add-to-undesirables-search').click(function() {
        const tiktokId = $(this).data('tiktok-id');
        const nickname = $(this).data('nickname');
        const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
        console.log(`Adding to undesirables from search: ${tiktokId} (${nickname})`);
        addToUndesirablesList(tiktokId, nickname, reason);
    });
}

// Add user to friends list
function addToFriendsList(tiktokId, nickname) {
    console.log(`Ajout de l'utilisateur ${nickname} (@${tiktokId}) aux amis`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Ajout de ${nickname} (@${tiktokId}) aux amis...
    </div>`);
    
    fetch('/api/users/friends', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tiktokId, nickname }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                ${nickname} (@${tiktokId}) ajouté(e) aux amis
            </div>`);
            
            // Switch to friends tab to show the new friend
            $('#friends-tab-btn').tab('show');
        } else {
            showNotification(`<div class="text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors de l'ajout aux amis: ${data.error || 'Erreur inconnue'}
            </div>`);
        }
    })
    .catch(error => {
        console.error('Error adding friend:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors de l'ajout aux amis: ${error.message}
        </div>`);
    });
}

// Add user to undesirables list
function addToUndesirablesList(tiktokId, nickname, reason = '') {
    console.log(`Ajout de l'utilisateur ${nickname} (@${tiktokId}) aux indésirables ${reason ? `(raison: ${reason})` : ''}`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Ajout de ${nickname} (@${tiktokId}) aux indésirables...
    </div>`);
    
    fetch('/api/users/undesirables', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tiktokId, nickname, reason }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                ${nickname} (@${tiktokId}) ajouté(e) aux indésirables
            </div>`);
            
            // Switch to undesirables tab to show the new undesirable
            $('#undesirables-tab-btn').tab('show');
        } else {
            showNotification(`<div class="text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors de l'ajout aux indésirables: ${data.error || 'Erreur inconnue'}
            </div>`);
        }
    })
    .catch(error => {
        console.error('Error adding undesirable:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors de l'ajout aux indésirables: ${error.message}
        </div>`);
    });
}

// Remove user from friends list
function removeFriend(tiktokId) {
    console.log(`Suppression de l'ami ${tiktokId}`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Suppression en cours...
    </div>`);
    
    fetch(`/api/users/friends/${tiktokId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                Utilisateur retiré des amis
            </div>`);
        } else {
            showNotification(`<div class="text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors de la suppression: ${data.error || 'Erreur inconnue'}
            </div>`);
        }
    })
    .catch(error => {
        console.error('Error removing friend:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors de la suppression: ${error.message}
        </div>`);
    });
}

// Remove user from undesirables list
function removeUndesirable(tiktokId) {
    console.log(`Suppression de l'indésirable ${tiktokId}`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Suppression en cours...
    </div>`);
    
    fetch(`/api/users/undesirables/${tiktokId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                Utilisateur retiré des indésirables
            </div>`);
        } else {
            showNotification(`<div class="text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors de la suppression: ${data.error || 'Erreur inconnue'}
            </div>`);
        }
    })
    .catch(error => {
        console.error('Error removing undesirable:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors de la suppression: ${error.message}
        </div>`);
    });
}

// Move user from friends to undesirables
function moveToUndesirable(tiktokId, nickname) {
    const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
    
    console.log(`Déplacement de ${nickname} (@${tiktokId}) vers les indésirables ${reason ? `(raison: ${reason})` : ''}`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Déplacement de ${nickname} vers les indésirables...
    </div>`);
    
    // First remove from friends
    fetch(`/api/users/friends/${tiktokId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP lors de la suppression des amis: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(`Échec de la suppression des amis: ${data.error || 'Erreur inconnue'}`);
        }
        
        // Then add to undesirables
        return fetch('/api/users/undesirables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tiktokId, nickname, reason }),
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP lors de l'ajout aux indésirables: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                ${nickname} déplacé vers les indésirables
            </div>`);
            
            // Switch to undesirables tab
            $('#undesirables-tab-btn').tab('show');
        } else {
            throw new Error(`Échec de l'ajout aux indésirables: ${data.error || 'Erreur inconnue'}`);
        }
    })
    .catch(error => {
        console.error('Error moving user to undesirables:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors du déplacement vers les indésirables: ${error.message}
        </div>`);
        
        // Reload lists to ensure consistent state
        loadUserLists();
    });
}

// Move user from undesirables to friends
function moveToFriend(tiktokId, nickname) {
    console.log(`Déplacement de ${nickname} (@${tiktokId}) vers les amis`);
    
    // Afficher un indicateur de chargement
    showNotification(`<div class="d-flex align-items-center">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Déplacement de ${nickname} vers les amis...
    </div>`);
    
    // First remove from undesirables
    fetch(`/api/users/undesirables/${tiktokId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP lors de la suppression des indésirables: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(`Échec de la suppression des indésirables: ${data.error || 'Erreur inconnue'}`);
        }
        
        // Then add to friends
        return fetch('/api/users/friends', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tiktokId, nickname }),
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP lors de l'ajout aux amis: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload lists
            loadUserLists();
            showNotification(`<div class="text-success">
                <i class="bi bi-check-circle me-2"></i>
                ${nickname} déplacé vers les amis
            </div>`);
            
            // Switch to friends tab
            $('#friends-tab-btn').tab('show');
        } else {
            throw new Error(`Échec de l'ajout aux amis: ${data.error || 'Erreur inconnue'}`);
        }
    })
    .catch(error => {
        console.error('Error moving user to friends:', error);
        showNotification(`<div class="text-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Erreur lors du déplacement vers les amis: ${error.message}
        </div>`);
        
        // Reload lists to ensure consistent state
        loadUserLists();
    });
}

// Show notification
function showNotification(message) {
    const notification = $(`
        <div class="notification">
            <button class="notification-close" title="Fermer"></button>
            ${message}
        </div>
    `);
    
    // Add close button functionality
    notification.find('.notification-close').on('click', function() {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    $('#notification-container').append(notification);
}

// Show a notification when a friend or undesirable joins
function showJoinNotification(data, userType) {
    const name = data.nickname || data.uniqueId;
    let notificationClass = userType === 'friend' ? 'friend-join' : 'undesirable-join';
    let notificationTitle = userType === 'friend' ? 'Ami a rejoint' : 'Indésirable a rejoint';
    
    const notification = $(`
        <div class="notification ${notificationClass}">
            <button class="notification-close" title="Fermer"></button>
            <div class="notification-title">${notificationTitle}</div>
            <div class="notification-message">
                <b>${name}</b> (@${data.uniqueId}) a rejoint le chat
            </div>
        </div>
    `);
    
    // Add close button functionality
    notification.find('.notification-close').on('click', function() {
        notification.fadeOut(300, function() {
            $(this).remove();
        });
    });
    
    $('#notification-container').append(notification);
    
    // Play sound if enabled
    if (enableSoundNotifications) {
        playFlaggedCommentSound(true);
    }
}

// Toggle user lists panel
function toggleUserListsPanel(event) {
    // Prevent default behavior and stop propagation
    if (event) {
        //event.preventDefault();
        //event.stopPropagation();
    }
    
    console.log("Toggling user lists panel. Current visibility:", userListsVisible);
    
    userListsVisible = !userListsVisible;
    
    if (userListsVisible) {
        console.log("Opening user lists panel");
        $('#user-lists-panel').fadeIn(200);
        $('#toggleUserLists').addClass('active');
        
        // Reload user lists when opening panel
        loadUserLists();
        
        // Make sure the correct tab is active based on Bootstrap's tab system
        if (!$('.tab-pane.active').length) {
            // Activate first tab if none is active
            $('#friends-tab-btn').tab('show');
        }
        
        // Ensure the tabs are clickable and working correctly
        $('#undesirables-tab-btn').off('click').on('click', function() {
            console.log("Undesirables tab clicked");
            $(this).tab('show');
        });
        
        $('#friends-tab-btn').off('click').on('click', function() {
            console.log("Friends tab clicked");
            $(this).tab('show');
        });
        
        $('#search-tab-btn').off('click').on('click', function() {
            console.log("Search tab clicked");
            $(this).tab('show');
        });
    } else {
        console.log("Closing user lists panel");
        $('#user-lists-panel').fadeOut(200);
        $('#toggleUserLists').removeClass('active');
    }
}

// Check user status when user information is available
function checkUserStatus(data) {
    if (data && data.uniqueId) {
        //socket.emit('getUserStatus', data.uniqueId);
    }
}

// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        console.log('Room user:');
        console.log(msg);
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} j'aime`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    // Debug: Log the member event
    console.log('Member joined:', msg);
    
    // Check if the user is a friend or undesirable
    const isFriend = currentUsersList.friends.some(f => f.tiktok_id === msg.uniqueId);
    const undesirable = currentUsersList.undesirables.find(u => u.tiktok_id === msg.uniqueId);
    
    // Show notification if user is a friend or undesirable
    if (isFriend) {
        showJoinNotification(msg, 'friend');
    } else if (undesirable) {
        showJoinNotification(msg, 'undesirable');
    }
    
    // Add the user to the database for future reference
    if (msg.uniqueId && msg.nickname) {
        // Stocker l'utilisateur en base de données en utilisant l'API
        fetch('/api/users/search?query=' + encodeURIComponent(msg.uniqueId))
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    // L'utilisateur n'existe pas, on le crée via l'API
                    fetch('/api/users/friends', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            tiktokId: msg.uniqueId, 
                            nickname: msg.nickname 
                        }),
                    }).then(() => {
                        // Puis on le retire de la liste des amis s'il n'est pas un ami
                        if (!isFriend) {
                            fetch(`/api/users/friends/${msg.uniqueId}`, { 
                                method: 'DELETE' 
                            });
                        }
                    });
                }
            })
            .catch(error => console.error('Error handling user in database:', error));
    }
    
    // Regular join message handling - only skip if explicitly set to "0"
    if (window.settings.showJoins === "0") {
        console.log('Member join messages are disabled');
        return;
    }

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;
    console.log('Adding join message with delay:', joinMsgDelay);

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        
        // Use different color for friends and undesirables
        let messageColor = '#21b2c2'; // default color
        if (isFriend) {
            messageColor = '#4CAF50'; // green for friends
        } else if (undesirable) {
            messageColor = '#F44336'; // red for undesirables
        }
        
        // Add the join message to the chat
        console.log('Displaying join message for:', msg.uniqueId);
        addChatItem(messageColor, msg, 'a rejoint', false); // Change summarize to false to ensure the message isn't treated as temporary
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (msg) => {
    if (window.settings.showChats === "0") return;

    addChatItem('', msg, msg.comment);
})

// Handle chat updates (moderation and suggested responses)
connection.on('chatUpdate', (update) => {
    if (window.settings.showChats === "0") return;
    console.log('Chat update');
    console.log(update.type);
    const msgId = update.id;
    const chatDiv = $(`.chatcontainer div[data-msg-id="${msgId}"], .eventcontainer div[data-msg-id="${msgId}"]`);
    
    if (!chatDiv.length) {
        console.log('No chat div found');
        return;
    }
    
    if (update.type === 'moderation') {
        // Update moderation
        const moderationToggle = chatDiv.find('.moderation-toggle');
        console.log('Moderation toggle');
        console.log(moderationToggle.length);
        
        // If no toggle exists, create one
        if (moderationToggle.length === 0) {
            const chatItemDiv = chatDiv.find('.chatitem > div > span');
            chatItemDiv.append('<a href="#" class="moderation-toggle">[Modération]</a>');
        } else {
            // Replace loading indicator with regular moderation toggle
            moderationToggle.removeClass('loading');
            moderationToggle.html('[Modération]');
        }
        
        // Remove any existing moderation info
        chatDiv.find('.moderation-info').remove();
        
        // Add moderation info if available
        if (update.data.moderation) {
            console.log('Moderation info');
            console.log(update.data.moderation);
            let moderationClass = update.data.moderation.flagged ? 'moderation-flagged' : 'moderation-safe';
            let moderationInfoDiv = $(`<div class="moderation-info ${moderationClass}" style="display:none;"></div>`);
            
            // Calculate the sum of all category scores
            let totalScore = 0;
            for (const score of Object.values(update.data.moderation.category_scores)) {
                totalScore += score;
            }
            
            // Add flagged status with badge and total score
            moderationInfoDiv.append(`
                <div>
                    <strong>${update.data.moderation.flagged ? 'SIGNALÉ' : 'SÛR'}</strong>
                    <span class="moderation-total-score">(Score total: ${totalScore.toFixed(2)})</span>
                    <span class="moderation-badge ${update.data.moderation.flagged ? 'flagged' : 'safe'}">
                        ${update.data.moderation.flagged ? '⚠️' : '✓'}
                    </span>
                </div>
            `);
            
            // Handle flagged content notifications
            if (update.data.moderation.flagged) {
                // Play notification sound for flagged comments
                playFlaggedCommentSound();
                
                // Show moderation notification if enabled
                if (enableModerationNotifications) {
                    showModerationNotification(update.data, update.data.comment, update.data.moderation);
                }
            }
            
            // Add Ollama reason if available and flagged
            if (update.data.moderation.flagged && update.data.moderation.ollama_reason) {
                moderationInfoDiv.append(`<div class="moderation-reason"><strong>Raison:</strong> ${update.data.moderation.ollama_reason}</div>`);
            }
            
            // Add category information for ALL messages (not just flagged ones)
            let categoriesDiv = $('<div class="moderation-categories"></div>');
            let hasCategories = false;
            
            for (const [category, score] of Object.entries(update.data.moderation.category_scores)) {
                const formattedScore = score.toFixed(2);
                const isFlagged = update.data.moderation.categories[category];
                const categoryClass = isFlagged ? 'flagged' : 'safe';
                
                // Only show categories with non-zero scores or that are flagged
                if (score > 0 || isFlagged) {
                    categoriesDiv.append(`<span class="moderation-category ${categoryClass}">${category}: ${formattedScore}</span>`);
                    hasCategories = true;
                }
            }
            
            // Only append categories div if it has content
            if (hasCategories) {
                moderationInfoDiv.append(categoriesDiv);
            }
            
            chatDiv.append(moderationInfoDiv);
            
            // Add click handler for the moderation toggle
            chatDiv.find('.moderation-toggle').click(function(e) {
                e.preventDefault();
                moderationInfoDiv.toggle();
            });
            
            // Update moderation stats
            updateModerationStats(update.data.moderation);
        } else {
            // No moderation, remove the toggle
            chatDiv.find('.moderation-toggle').remove();
        }
    } else if (update.type === 'response') {
        // Update response
        const responseToggle = chatDiv.find('.response-toggle');
        
        // If no toggle exists, create one
        if (responseToggle.length === 0 && update.data.suggestedResponse) {
            const chatItemDiv = chatDiv.find('.chatitem > div > span');
            chatItemDiv.append('<a href="#" class="response-toggle">[Réponse IA]</a>');
        } else if (responseToggle.length > 0) {
            // Replace loading indicator with regular response toggle if there's a response
            if (update.data.suggestedResponse) {
                console.log('Suggested response');
                console.log(update.data.suggestedResponse);
                responseToggle.removeClass('loading');
                responseToggle.html('[Réponse IA]');
                
                // Remove any existing response info
                chatDiv.find('.response-info').remove();
                
                // Add suggested response
                let responseInfoDiv = $(`<div class="response-info" style="display:none;"><strong>Réponse suggérée par l'IA :</strong> <p>${sanitize(update.data.suggestedResponse)}</p></div>`);
                chatDiv.append(responseInfoDiv);
                
                // Add click handler for the response toggle
                chatDiv.find('.response-toggle').click(function(e) {
                    e.preventDefault();
                    responseInfoDiv.toggle();
                });
            } else {
                // No response, remove the toggle and info
                responseToggle.remove();
                chatDiv.find('.response-info').remove();
            }
        }
    }
    console.log('Chat update end');
})

// New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

// Handle stream end - clean up video player
connection.on('streamEnd', () => {
    $('#stateText').text('Le direct est terminé.');
    
    // Clean up video player
    if (flvPlayer) {
        flvPlayer.pause();
        flvPlayer.unload();
        flvPlayer.detachMediaElement();
        flvPlayer.destroy();
        flvPlayer = null;
    }
    
    // Show stream ended message
    $('#videoContainer').html('<div class="alert alert-info">Le direct est terminé</div>');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new gift to the gift container
 */
function addGiftItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Nom: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Répétition: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Coût: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamants</b><span>
                            </td>
                        </tr>
                    </table>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

// Setup notifications container with clear all button
function setupNotifications() {
    // Add clear all button if it doesn't exist yet
    if ($('.clear-notifications').length === 0) {
        const clearButton = $(`
            <button class="clear-notifications btn btn-sm">
                <i class="bi bi-x-circle me-1"></i>Effacer tout
            </button>
        `);
        
        // Add click handler to clear all notifications
        clearButton.on('click', function() {
            $('#notification-container .notification').fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // Add button at the beginning of container
        $('#notification-container').prepend(clearButton);
        
        // Initially hide the button until notifications appear
        clearButton.hide();
    }
    
    // Create a MutationObserver to watch for changes to notifications
    const observer = new MutationObserver(function(mutations) {
        const hasNotifications = $('#notification-container .notification').length > 0;
        if (hasNotifications) {
            $('.clear-notifications').show();
        } else {
            $('.clear-notifications').hide();
        }
    });
    
    // Start observing
    observer.observe(document.getElementById('notification-container'), {
        childList: true,
        subtree: true
    });
}