const socket = io();
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const signedInText = document.getElementById('signed-in-text');

let typingTimeout;
let isTyping = false;

// Custom prompt function that appears in center of screen
function showCustomPrompt() {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-prompt-overlay';
        
        // Create prompt box
        const promptBox = document.createElement('div');
        promptBox.className = 'custom-prompt-box';
        
        promptBox.innerHTML = `
            <h2>Welcome to Chat Room!</h2>
            <input type="text" id="username-input" placeholder="Enter your name..." autocomplete="off" />
            <button id="join-button">Join Chat</button>
        `;
        
        overlay.appendChild(promptBox);
        document.body.appendChild(overlay);
        
        const input = document.getElementById('username-input');
        const button = document.getElementById('join-button');
        
        // Focus on input
        setTimeout(() => input.focus(), 100);
        
        // Handle button click
        button.addEventListener('click', () => {
            const username = input.value.trim();
            if (username) {
                document.body.removeChild(overlay);
                resolve(username);
            } else {
                input.focus();
            }
        });
        
        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const username = input.value.trim();
                if (username) {
                    document.body.removeChild(overlay);
                    resolve(username);
                }
            }
        });
    });
}

// Ask for username when page loads with custom prompt
let username;
showCustomPrompt().then((name) => {
    username = name;
    
    // Display "Signed in as: [username]"
    signedInText.innerHTML = `Signed in as: <strong>${username}</strong>`;
    
    appendSystemMessage(`${username} joined the chat`);
    socket.emit('new-user', username);
});

// Function to scroll to bottom of message container
function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Function to append system messages
function appendSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('system-message');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// Function to show typing indicator
function showTypingIndicator(username) {
    // Remove any existing typing indicator
    removeTypingIndicator();
    
    const typingElement = document.createElement('div');
    typingElement.classList.add('typing-indicator');
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
        <span class="typing-text">${username} is typing</span>
        <span class="typing-dots">
            <span>.</span><span>.</span><span>.</span>
        </span>
    `;
    messageContainer.appendChild(typingElement);
    scrollToBottom();
}

// Function to remove typing indicator
function removeTypingIndicator() {
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

// Function to append chat messages
function appendMessage(message, sender, timestamp, isYou = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isYou ? 'you' : 'other');
    
    // Create message structure with sender name and timestamp
    const senderElement = document.createElement('div');
    senderElement.classList.add('message-sender');
    senderElement.innerText = sender;
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.innerText = message;
    
    const timestampElement = document.createElement('div');
    timestampElement.classList.add('message-timestamp');
    timestampElement.innerText = timestamp;
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// Handle typing indicator
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing');
    }
    
    clearTimeout(typingTimeout);
    
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('stop-typing');
    }, 1000);
});

// Handle form submission
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message) {
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Stop typing indicator when sending message
        isTyping = false;
        socket.emit('stop-typing');
        clearTimeout(typingTimeout);
        
        appendMessage(message, 'You', timestamp, true);
        socket.emit('send-chat-message', message);
        messageInput.value = '';
    }
});

// Listen for incoming messages
socket.on('chat-message', (data) => {
    removeTypingIndicator();
    appendMessage(data.message, data.name, data.timestamp, false);
});

// Listen for user connection
socket.on('user-connected', (username) => {
    appendSystemMessage(`${username} joined the chat`);
});

// Listen for user disconnection
socket.on('user-disconnected', (username) => {
    appendSystemMessage(`${username} left the chat`);
});

// Listen for typing indicator
socket.on('user-typing', (username) => {
    showTypingIndicator(username);
});

// Listen for stop typing
socket.on('user-stop-typing', (username) => {
    removeTypingIndicator();
});