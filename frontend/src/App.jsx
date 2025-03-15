import { useState, useEffect, useRef } from 'react'
import './App.css'
import TikTokConnection from './utils/TikTokConnection'
import * as UserApi from './utils/UserApi'

// Import Bootstrap icons (if they're not already in index.html)
// If you're using a bundler, you can use this import instead
// import 'bootstrap-icons/font/bootstrap-icons.css'

// Import components
import ConnectionForm from './components/ConnectionForm'
import Settings from './components/Settings'
import StatsBar from './components/StatsBar'
import VideoPlayer from './components/VideoPlayer'
import ChatContainer from './components/ChatContainer'
import GiftsContainer from './components/GiftsContainer'
import UserLists from './components/UserLists'
import ModerationStats from './components/ModerationStats'
import Notifications from './components/Notifications'
import MazicList from './components/MazicList'
import TopLikers from './components/TopLikers'

function App() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const [availableOllamaModels, setAvailableOllamaModels] = useState([])
  
  // Counters
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [diamondsCount, setDiamondsCount] = useState(0)
  
  // Chat & gifts state & likes
  const [chatMessages, setChatMessages] = useState([])
  const [gifts, setGifts] = useState([])
  const [likes, setLikes] = useState([])
  
  // AI response state
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  
  // Settings
  const [showModeration, setShowModeration] = useState(false)
  const [showAIResponses, setShowAIResponses] = useState(false)
  const [enableSoundNotifications, setEnableSoundNotifications] = useState(false)
  const [enableMentionNotifications, setEnableMentionNotifications] = useState(true)
  const [yourUsername, setYourUsername] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')
  const [aiModel, setAiModel] = useState('')
  const [darkTheme, setDarkTheme] = useState(true)
  const [enableFlvStream, setEnableFlvStream] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)

  //mazic state
  const [mazicList, setMazicList] = useState([]);
  const [mazicPrefix, setMazicPrefix] = useState('mazic:');
  const [allChatMessages, setAllChatMessages] = useState([]); // Store all chat messages to reprocess when prefix changes
  
  // User lists
  const [friendsList, setFriendsList] = useState([])
  const [undesirablesList, setUndesirablesList] = useState([])
  const [showUserLists, setShowUserLists] = useState(false)
  
  // Moderation stats
  const [moderationStats, setModerationStats] = useState({
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
  })
  
  // Notifications state
  const [notifications, setNotifications] = useState([])
  
  // Refs
  const connectionRef = useRef(null)
  const flaggedCommentSoundRef = useRef(null)
  
  // Function to apply dark theme
  const applyTheme = (isDark) => {
    if (isDark) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  };
  
  // Update the setDarkTheme function to integrate with API and apply theme
  const handleThemeChange = async (isDark) => {
    setDarkTheme(isDark);
    applyTheme(isDark);
    
    // Save to localStorage as fallback
    localStorage.setItem('darkTheme', isDark);
    
    
  };
  
  // Initialize connection
  useEffect(() => {
    // With the proxy configuration, we can connect to the same origin
    // If running from file://, use the demo backend
    const backendUrl = location.protocol === 'file:' 
      ? "https://tiktok-chat-reader.zerody.one/" 
      : undefined; // Will connect to same origin, proxied to port 8081
    connectionRef.current = new TikTokConnection(backendUrl);
    
    // Set up the Ollama models listener immediately when connection is initialized
    connectionRef.current.on('ollamaModels', (models) => {
      console.log("Available Ollama models received:");
      console.log(models);
      setAvailableOllamaModels(models);
    });
    
    // Load all settings
    const loadSettingsFromApi = async () => {
      console.log("Loading settings from API");
      try {
        // Try to get preferences from API first
        
        
        const loadSetting = (key, stateSetter, defaultValue = null) => {
          const savedValue = localStorage.getItem(key);
          if (savedValue !== null) {
            try {
              if (typeof defaultValue === 'boolean') {
                // Handle boolean values
                stateSetter(savedValue === 'true');
              } else {
                // Handle other values
                stateSetter(savedValue);
              }
            } catch (e) {
              console.error(`Error loading setting ${key}:`, e);
            }
          }
        };
        
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('darkTheme');
        const isDark = savedTheme === null ? true : savedTheme === 'true';
        setDarkTheme(isDark);
        applyTheme(isDark);
        
        // Load other settings
        loadSetting('showModeration', setShowModeration, false);
        loadSetting('showAIResponses', setShowAIResponses, false);
        loadSetting('enableSoundNotifications', setEnableSoundNotifications, false);
        loadSetting('enableMentionNotifications', setEnableMentionNotifications, true);
        loadSetting('enableFlvStream', setEnableFlvStream, true);
        loadSetting('tiktokUsername', setYourUsername, '');
        loadSetting('openaiApiKey', setOpenaiApiKey, '');
        loadSetting('aiProvider', setAiProvider, 'openai');
        loadSetting('aiModel', setAiModel, '');
        loadSetting('autoScroll', setAutoScroll, true);
        loadSetting('mazicPrefix', setMazicPrefix, 'mazic:');
        
        // Apply other settings from API if available
        // ...

      } catch (error) {
        console.error('Error loading preferences from API:', error);
        
        // Fallback to localStorage for all settings
        const loadSetting = (key, stateSetter, defaultValue = null) => {
          const savedValue = localStorage.getItem(key);
          console.log("Loading setting "+key+" from localStorage: "+savedValue);
          if (savedValue !== null) {
            try {
              if (typeof defaultValue === 'boolean') {
                // Handle boolean values
                stateSetter(savedValue === 'true');
              } else {
                // Handle other values
                console.log("Setting "+key+" to "+savedValue);
                stateSetter(savedValue);
              }
            } catch (e) {
              console.error(`Error loading setting ${key}:`, e);
            }
          }
        };
        
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('darkTheme');
        const isDark = savedTheme === null ? true : savedTheme === 'true';
        setDarkTheme(isDark);
        applyTheme(isDark);
        
        // Load other settings
        loadSetting('showModeration', setShowModeration, false);
        loadSetting('showAIResponses', setShowAIResponses, false);
        loadSetting('enableSoundNotifications', setEnableSoundNotifications, false);
        loadSetting('enableMentionNotifications', setEnableMentionNotifications, true);
        loadSetting('enableFlvStream', setEnableFlvStream, true);
        loadSetting('tiktokUsername', setYourUsername, '');
        loadSetting('openaiApiKey', setOpenaiApiKey, '');
        loadSetting('aiProvider', setAiProvider, 'openai');
        loadSetting('aiModel', setAiModel, '');
        loadSetting('autoScroll', setAutoScroll, true);
        loadSetting('mazicPrefix', setMazicPrefix, 'mazic:');
      }
    };
    
    loadSettingsFromApi();
    
    // Load user lists from localStorage as fallback
    const loadedFriends = localStorage.getItem('friendsList');
    const loadedUndesirables = localStorage.getItem('undesirablesList');
    
    if (loadedFriends) {
      try {
        setFriendsList(JSON.parse(loadedFriends));
      } catch (e) {
        console.error('Error loading friends list', e);
      }
    }
    
    if (loadedUndesirables) {
      try {
        setUndesirablesList(JSON.parse(loadedUndesirables));
      } catch (e) {
        console.error('Error loading undesirables list', e);
      }
    }
    
    // Initialize sound
    flaggedCommentSoundRef.current = new Audio('https://www.soundjay.com/misc/small-bell-ring-01a.mp3');
    
    // Load user lists from API
    loadUserLists();
    
    // Request notification permission
    requestNotificationPermission();
    
    return () => {
      // Cleanup
      // Any cleanup code goes here
    };
  }, []);
  
  // Connect to TikTok LIVE
  const connect = async () => {
    if (!username) {
      setError('Please enter a username')
      return
    }
    
    setIsConnecting(true)
    setError('')
    
    try {
      await connectionRef.current.connect(username, {
        enableExtendedGiftInfo: true,
        aiProvider,
        aiModel,
        showModeration,
        showResponses: showAIResponses,
        openaiApiKey: aiProvider === 'openai' ? openaiApiKey : undefined
      })
      
      setIsConnected(true)
      setupEventListeners()
    } catch (err) {
      setError(`Connection failed: ${err}`)
    } finally {
      setIsConnecting(false)
    }
  }
  
  const disconnect = () => {
    // Properly disconnect from the socket
    if (connectionRef.current) {
      // Disconnect the socket before resetting state
      if (connectionRef.current.socket) {
        //console.log('Disconnecting socket...');
        connectionRef.current.socket.disconnect();
      }
      
      // Just reset our state
      connectionRef.current.isConnected = false;
      connectionRef.current.uniqueId = null;
      connectionRef.current.streamUrl = null;
    }
    
    // Reset all state
    setIsConnected(false)
    setChatMessages([])
    setGifts([])
    setLikes([])
    setViewerCount(0)
    setLikeCount(0)
    setDiamondsCount(0)
    //reload the page
    window.location.reload();
  }
  
  const setupEventListeners = () => {
    const conn = connectionRef.current
    
    // Viewer stats
    conn.on('roomUser', (data) => {
      setViewerCount(data.viewerCount)
    })
    
    conn.on('like', (data) => {
      const userStatus = checkUserStatus(data);
      setLikeCount(prevCount => prevCount + data.likeCount)
      console.log("Got the like :"+data.likeCount+" from "+data.nickname);

      // Update likes array using setLikes to maintain state properly
      setLikes(prevLikes => {
        // Check if user already exists in the likes array
        const existingLikerIndex = prevLikes.findIndex(liker => liker.uniqueId === data.uniqueId);
        
        if (existingLikerIndex !== -1) {
          // User exists, update their like count
          const updatedLikes = [...prevLikes];
          updatedLikes[existingLikerIndex] = {
            ...updatedLikes[existingLikerIndex],
            likeCount: updatedLikes[existingLikerIndex].likeCount + data.likeCount,
            userStatus
          };
          return updatedLikes;
        } else {
          // User doesn't exist, add them to the likes array
          return [...prevLikes, {
            uniqueId: data.uniqueId,
            nickname: data.nickname,
            likeCount: data.likeCount,
            userStatus
          }];
        }
      });
    })
    
    conn.on('gift', (data) => {
      if (data.diamondCount > 0) {
        setDiamondsCount(prevCount => prevCount + data.diamondCount)
      }
      
      // Add gift to the list
      setGifts(prevGifts => {
        const newGifts = [...prevGifts, data]
        // Keep only the most recent 200 gifts
        if (newGifts.length > 200) {
          return newGifts.slice(newGifts.length - 200)
        }
        return newGifts
      })
    })
    
    // Chat messages - now using socket approach
    conn.on('chat', (data) => {
      const userStatus = checkUserStatus(data);
      //get the prefix from local storage
      

      
      // We now receive initial message from the server with pending moderation/response flags
      // Add message to chat using sanitized text to prevent XSS
      const sanitizedComment = sanitize(data.comment)
      console.log("Got the comment :"+sanitizedComment);

      // Add to all chat messages for mazic filtering
      setAllChatMessages(prev => {
        const newMessages = [...prev, {
          ...data,
          sanitizedComment,
          comment: data.comment, // Ensure we keep the original comment
          nickname: data.nickname // Ensure we keep the nickname
        }];
        // Keep the most recent 10000 messages
        if (newMessages.length > 10000) {
          return newMessages.slice(newMessages.length - 10000);
        }
        return newMessages;
      });

      // Process this message with current mazic prefix
      processMessageWithCurrentPrefix(data);

      // Check for mentions
      if (enableMentionNotifications && yourUsername && data.comment.toLowerCase().includes(yourUsername.toLowerCase())) {
        // Show mention notification
        showMentionNotification(data)
      }
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, comment: sanitizedComment, userStatus}]
        // Keep only the most recent 1000 messages
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
      
      // If moderation is enabled, we will get updates via chatUpdate
      if (showModeration) {
        setIsGeneratingResponse(true)
      }
    })
    
    // Handle chat updates from server (moderation results and AI responses)
    conn.on('chatUpdate', (update) => {
      // Update the message in the chat list
      setChatMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.msgId === update.id) {
            if (update.type === 'moderation') {
              // If we have moderation results
              if (update.data.moderation?.flagged && enableSoundNotifications) {
                playFlaggedCommentSound()
                
                // Show notification for flagged content
                if (enableMentionNotifications) {
                  showModerationNotification(update.data, update.data.comment, update.data.moderation)
                }
              }
              
              // Update moderation stats
              if (update.data.moderation) {
                updateModerationStats(update.data.moderation)
              }
              
              return {
                ...msg,
                pendingModeration: false,
                moderation: update.data.moderation
              }
            } else if (update.type === 'response') {
              // Handle AI response update
              setIsGeneratingResponse(false)
              return {
                ...msg,
                pendingResponse: false,
                suggestedResponse: update.data.suggestedResponse
              }
            }
          }
          return msg
        })
      })
    })
    
    // Handle stream end
    conn.on('streamEnd', () => {
      console.warn('LIVE has ended')
      
      // Add to notifications
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'Stream Ended',
        message: 'The LIVE stream has ended',
        timestamp: new Date()
      }
      
      setNotifications(prev => [...prev, notification])
      
      // Remove after 5 seconds
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
      
      // Disconnect
      disconnect()
    })
    
    // Member join
    conn.on('member', (data) => {
      const userStatus = checkUserStatus(data)
      
      // Show notification if the user is a friend or undesirable
      if (userStatus.isFriend || userStatus.isUndesirable) {
        showUserJoinNotification(data, userStatus);
      }
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, type: 'join', userStatus}]
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
    })
    
    // Follow
    conn.on('follow', (data) => {
      const userStatus = checkUserStatus(data)
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, type: 'follow', userStatus}]
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
    })
  }
  
  const checkUserStatus = (data) => {
    // Check if user is in friends or undesirables list
    // userId from chat messages will match with tiktokId in our lists
    //console.log(data)
    const userId = data.uniqueId;
        
    // Handle both snake_case (from DB) and camelCase (from transformed data)
    const isFriend = friendsList.some(friend => friend.tiktokId === userId);
    
    const isUndesirable = undesirablesList.some(undesirable => undesirable.tiktokId === userId);

    
    
    return {
      isFriend,
      isUndesirable
    }
  }
  
  const playFlaggedCommentSound = () => {
    if (flaggedCommentSoundRef.current) {
      flaggedCommentSoundRef.current.play().catch(e => console.error('Error playing sound', e))
    }
  }
  
  const updateModerationStats = (moderationResult) => {
    setModerationStats(prevStats => {
      const newStats = {...prevStats}
      newStats.total += 1
      
      if (moderationResult.flagged) {
        newStats.flagged += 1
        
        // Update category counts if available
        if (moderationResult.categories) {
          Object.keys(moderationResult.categories).forEach(category => {
            if (moderationResult.categories[category] && newStats.categories[category] !== undefined) {
              newStats.categories[category] += 1
            }
          })
        }
      } else {
        newStats.safe += 1
      }
      
      return newStats
    })
  }
  
  // Load user lists from API
  const loadUserLists = async () => {
    try {
      const data = await UserApi.loadUserLists()
      // The API returns {friendsList, undesirablesList}, ensure we extract arrays
      setFriendsList(Array.isArray(data.friendsList) ? data.friendsList : [])
      setUndesirablesList(Array.isArray(data.undesirablesList) ? data.undesirablesList : [])
    } catch (error) {
      console.error('Error loading user lists:', error)
      
      // Fallback to localStorage if API fails
      const savedFriends = localStorage.getItem('friendsList')
      const savedUndesirables = localStorage.getItem('undesirablesList')
      
      if (savedFriends) {
        try {
          setFriendsList(JSON.parse(savedFriends))
        } catch (e) {
          console.error('Error parsing friends list from localStorage:', e)
          setFriendsList([])
        }
      }
      
      if (savedUndesirables) {
        try {
          setUndesirablesList(JSON.parse(savedUndesirables))
        } catch (e) {
          console.error('Error parsing undesirables list from localStorage:', e)
          setUndesirablesList([])
        }
      }
    }
  }
  
  // Add user to friends list
  const addToFriendsList = async (userId, nickname) => {
    try {
      const response = await UserApi.addToFriendsList(userId, nickname)
      // API now directly returns the updated array
      setFriendsList(response || [])
    } catch (error) {
      console.error('Error adding friend:', error)
      
      // Fallback - add locally
      const newFriend = {
        tiktokId: userId,
        nickname: nickname,
        addedAt: new Date().toISOString()
      }
      
      setFriendsList(prevList => {
        // Don't add duplicates
        if (prevList.some(item => item.tiktokId === userId)) {
          return prevList
        }
        
        const newList = [...prevList, newFriend]
        localStorage.setItem('friendsList', JSON.stringify(newList))
        return newList
      })
    }
    
    // Remove from undesirables if present
    setUndesirablesList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('undesirablesList', JSON.stringify(newList))
      return newList
    })
  }
  
  // Add user to undesirables list
  const addToUndesirablesList = async (userId, nickname, reason = '') => {
    try {
      if(reason == ""){
        //ask for reason in a input box
         reason = prompt("Enter reason for adding to undesirables list")
      }
      // Remove the prompt and let the UserLists component handle collecting the reason
      const response = await UserApi.addToUndesirablesList(userId, nickname, reason)
      // API now directly returns the updated array
      setUndesirablesList(response || [])
    } catch (error) {
      console.error('Error adding undesirable:', error)
      
      // Fallback - add locally
      const newUndesirable = {
        tiktokId: userId,
        nickname: nickname,
        reason: reason,
        addedAt: new Date().toISOString()
      }
      
      setUndesirablesList(prevList => {
        // Don't add duplicates
        if (prevList.some(item => item.tiktokId === userId)) {
          return prevList
        }
        
        const newList = [...prevList, newUndesirable]
        localStorage.setItem('undesirablesList', JSON.stringify(newList))
        return newList
      })
    }
    
    // Remove from friends if present
    setFriendsList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('friendsList', JSON.stringify(newList))
      return newList
    })
  }
  
  // Remove user from friends list
  const removeFriend = async (userId) => {
    try {
      const response = await UserApi.removeFriend(userId)
      // API now directly returns the updated array
      setFriendsList(response || [])
    } catch (error) {
      console.error('Error removing friend:', error)
      
      // Fallback - remove locally
      setFriendsList(prevList => {
        const newList = prevList.filter(item => item.tiktokId !== userId)
        localStorage.setItem('friendsList', JSON.stringify(newList))
        return newList
      })
    }
  }
  
  // Remove user from undesirables list
  const removeUndesirable = async (userId) => {
    try {
      const response = await UserApi.removeUndesirable(userId)
      // API now directly returns the updated array
      setUndesirablesList(response || [])
    } catch (error) {
      console.error('Error removing undesirable:', error)
      
      // Fallback - remove locally
      setUndesirablesList(prevList => {
        const newList = prevList.filter(item => item.tiktokId !== userId)
        localStorage.setItem('undesirablesList', JSON.stringify(newList))
        return newList
      })
    }
  }
  
  // Toggle user lists panel
  const toggleUserLists = () => {
    setShowUserLists(prev => !prev)
  }
  
  // Sanitize text to prevent XSS
  const sanitize = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // Function to show moderation notification
  const showModerationNotification = (data, text, moderationResult) => {
    // Get the reason for flagging
    let reason = '';
    if (moderationResult.categories) {
      for (const category in moderationResult.categories) {
        if (moderationResult.categories[category]) {
          reason += (reason ? ', ' : '') + category;
        }
      }
    }
    
    // Add to notifications
    const notification = {
      id: Date.now(),
      type: 'moderation',
      title: `Inappropriate content detected from ${data.uniqueId}`,
      message: text,
      reason: reason || 'Not specified',
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  }
  
  // Function to show mention notification
  const showMentionNotification = (data) => {
    // Add to notifications
    const notification = {
      id: Date.now(),
      type: 'mention',
      title: `${data.uniqueId} mentioned you`,
      message: data.comment,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
    
    // Try to show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${data.uniqueId} mentioned you`, {
        body: data.comment,
        icon: '/favicon.ico'
      });
    }
  }
  
  // Function to remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }
  
  // Function to request browser notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(() => {
        // Permission handled
      });
    }
  }
  
  // Function to show user join notification
  const showUserJoinNotification = (data, userStatus) => {
    // Determine user type for notification
    let userType = '';
    let notificationType = '';
    
    if (userStatus.isFriend) {
      userType = 'Friend';
      notificationType = 'friend-join';
    } else if (userStatus.isUndesirable) {
      userType = 'Undesirable';
      notificationType = 'undesirable-join';
    } else {
      // Not a special user, don't show notification
      return;
    }
    
    // Add to notifications
    const notification = {
      id: Date.now(),
      type: notificationType,
      title: `${userType} ${data.nickname} joined the stream`,
      message: `${data.nickname} has joined the stream`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
    
    // Try to show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${userType} ${data.nickname} joined`, {
        body: `${data.nickname} has joined the stream`
      });
    }
  }
  
  // Function to check if a message matches the current mazic prefix and add it to the list
  const processMessageWithCurrentPrefix = (data) => {
    const savedPrefix = localStorage.getItem('mazicPrefix');
      if (savedPrefix) {
        setMazicPrefix(savedPrefix);
      } else {
        setMazicPrefix('mazic:');
      }
    console.log("Got the prefix :"+savedPrefix);
    if (data.comment.toLowerCase().startsWith(savedPrefix.toLowerCase())) {
      console.log("Found the prefix");
      console.log("Got the comment :"+data.comment);
      const restOfComment = data.nickname + ": " + data.comment.slice(savedPrefix.length);
      setMazicList(prevList => [...prevList, restOfComment]);
    }
  };
  
  // Function to clear the mazic list
  const clearMazicList = () => {
    setMazicList([]);
  }
  
  // Function to remove a single message from the mazic list
  const removeFromMazicList = (index) => {
    setMazicList(prevList => {
      const newList = [...prevList];
      newList.splice(index, 1);
      return newList;
    });
  }
  
  // Update mazicPrefix and save to localStorage
  const updateMazicPrefix = (newPrefix) => {
    setMazicPrefix(newPrefix);
    localStorage.setItem('mazicPrefix', newPrefix);
    
    // Reprocess all existing messages with the new prefix
    setMazicList([]); // Clear existing list
    
    // Apply new prefix to all stored messages
    const newMazicMessages = [];
    
    allChatMessages.forEach(msg => {
      if (msg.comment && msg.comment.toLowerCase().startsWith(newPrefix.toLowerCase())) {
        const restOfComment = msg.nickname + ": " + msg.comment.slice(newPrefix.length);
        newMazicMessages.push(restOfComment);
      }
    });
    
    // Update the mazic list with all matching messages
    setMazicList(newMazicMessages);
    
    // Display a console log that future messages will be filtered with this prefix
    console.log(`Filtering messages with new prefix: "${newPrefix}"`);
    
    // Try to save to API if that functionality is added later
    
  };
  
  return (
    <div className={`app-container ${darkTheme ? 'dark-theme' : 'light-theme'}`}>
      <Notifications 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
      
      {/* Toggle button for user lists */}
      <button 
        id="toggleUserLists" 
        className="btn btn-primary position-fixed top-0 end-0 m-3"
        onClick={toggleUserLists}
      >
        <i className="bi bi-people-fill me-2"></i>Manage User Lists
      </button>
      
      {/* User Lists Panel */}
      <UserLists 
        friendsList={friendsList}
        undesirablesList={undesirablesList}
        removeFriend={removeFriend}
        removeUndesirable={removeUndesirable}
        addToFriendsList={addToFriendsList}
        addToUndesirablesList={addToUndesirablesList}
        showUserLists={showUserLists}
        toggleUserLists={toggleUserLists}
      />
      
      <header className="app-header">
        <h1>TikTok LIVE Chat Reader</h1>
        
        {!isConnected ? (
          <div className="connection-form">
            <ConnectionForm 
              username={username}
              setUsername={setUsername}
              connect={connect}
              isConnecting={isConnecting}
              error={error}
            />
            
            <Settings 
              darkTheme={darkTheme}
              setDarkTheme={handleThemeChange}
              showModeration={showModeration}
              setShowModeration={setShowModeration}
              showAIResponses={showAIResponses}
              setShowAIResponses={setShowAIResponses}
              enableSoundNotifications={enableSoundNotifications}
              setEnableSoundNotifications={setEnableSoundNotifications}
              enableFlvStream={enableFlvStream}
              setEnableFlvStream={setEnableFlvStream}
              enableMentionNotifications={enableMentionNotifications}
              setEnableMentionNotifications={setEnableMentionNotifications}
              yourUsername={yourUsername}
              setYourUsername={setYourUsername}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              aiModel={aiModel}
              setAiModel={setAiModel}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              availableOllamaModels={availableOllamaModels}
              setAvailableOllamaModels={setAvailableOllamaModels}
            />
          </div>
        ) : (
          <div className="connected-header">
            <h2>Connected to: {username}</h2>
            <StatsBar 
              viewerCount={viewerCount}
              likeCount={likeCount}
              diamondsCount={diamondsCount}
            />
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </header>
      
      {isConnected && (
        <div className="content-container">
          <div className="main-content">
            <VideoPlayer 
              username={username}
              enableFlvStream={enableFlvStream}
              connectionRef={connectionRef}
            />
            
            <div className="chat-gifts-container">
              <ChatContainer 
                chatMessages={chatMessages}
                showModeration={showModeration}
                showAIResponses={showAIResponses}
                addToFriendsList={addToFriendsList}
                addToUndesirablesList={addToUndesirablesList}
                autoScroll={autoScroll}
                setAutoScroll={setAutoScroll}
                isGeneratingResponse={isGeneratingResponse}
              />
              
              <GiftsContainer gifts={gifts} />
            </div>
          </div>
          
          <div className="side-panel">
            {showModeration && (
              <ModerationStats moderationStats={moderationStats} />
            )}
            
            <TopLikers likers={likes} />
            
            <MazicList 
              mazicList={mazicList} 
              clearMazicList={clearMazicList} 
              removeFromMazicList={removeFromMazicList}
              mazicPrefix={mazicPrefix}
              setMazicPrefix={updateMazicPrefix}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
