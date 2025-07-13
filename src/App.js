import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked'; // Import the marked library

// The backend (server.js) is responsible for reading and providing
// the 'poetry_book.txt' content to the AI.

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to call the Backend API (which then calls Gemini API)
  const callBackendAPI = async (prompt) => {
    setIsLoading(true);
    try {
      // IMPORTANT: Adjust this URL based on where your backend server is running.
      // During development, it's typically 'http://localhost:5000/api/chat'.
      // In production, if served by the same Express server, it might be '/api/chat'.
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt }) // Send only the user's query to the backend
      });

      const data = await response.json(); // Parse the response from your backend

      if (response.ok) { // Check if the backend response was successful (HTTP 2xx)
        let aiText = data.response; // Backend sends back the AI response directly
        let buttons = [];

        // Check for and parse buttons from the AI's response
        const buttonMatch = aiText.match(/BUTTONS: (.*)/i);
        if (buttonMatch && buttonMatch[1]) {
          buttons = buttonMatch[1].split(',').map(btn => btn.trim());
          aiText = aiText.replace(buttonMatch[0], '').trim(); // Remove the button string from the text
        }

        setMessages(prevMessages => [
          ...prevMessages,
          // Convert Markdown text to HTML using marked.js
          { text: marked.parse(aiText), sender: 'ai', type: 'html' }, // Changed type to 'html'
          ...(buttons.length > 0 ? [{ buttons: buttons, sender: 'ai', type: 'buttons' }] : [])
        ]);
      } else {
        // Handle errors received from the backend
        console.error("Error from backend:", data.error || "Unknown backend error");
        setMessages(prevMessages => [...prevMessages, { text: data.error || "Sorry, an error occurred on the server.", sender: 'ai', type: 'text' }]);
      }
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setMessages(prevMessages => [...prevMessages, { text: "There was a network error. Please ensure the backend server is running and accessible.", sender: 'ai', type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    setMessages(prevMessages => [...prevMessages, { text: inputText, sender: 'user', type: 'text' }]);
    callBackendAPI(inputText);
    setInputText('');
  };

  const handleButtonClick = (buttonText) => {
    setMessages(prevMessages => [...prevMessages, { text: buttonText, sender: 'user', type: 'text' }]);
    callBackendAPI(buttonText);
  };

  return (
    <div className="app-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #f0f2f5; /* Light background for the whole page */
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box; /* Include padding in element's total width and height */
        }

        .chat-container {
          width: 100%;
          max-width: 700px; /* Increased max-width for a more spacious feel */
          background-color: #ffffff;
          border-radius: 15px; /* More rounded corners */
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1); /* Softer, larger shadow */
          display: flex;
          flex-direction: column;
          height: 85vh; /* Slightly taller chat window */
          overflow: hidden; /* Ensures rounded corners apply correctly */
        }

        .chat-header {
          padding: 18px 25px;
          background-image: linear-gradient(to right, #4a90e2, #6a82fb); /* Gradient header */
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .chat-header h1 {
          font-size: 1.5rem; /* Larger title */
          font-weight: 600;
          margin: 0;
        }

        .chat-header span {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .messages-area {
          flex: 1;
          padding: 20px 25px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px; /* Slightly increased gap between messages */
          background-color: #f9fbfd; /* Very light background for messages area */
        }

        .message-row {
          display: flex;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .message-row.ai {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 75%; /* Slightly more width for bubbles */
          padding: 12px 18px;
          border-radius: 20px; /* More rounded, pill-like bubbles */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* Subtle shadow for bubbles */
          line-height: 1.5;
          font-size: 0.95rem; /* Slightly larger font for readability */
        }

        .message-bubble.user {
          background-color: #4a90e2; /* A shade of blue */
          color: #fff;
          border-bottom-right-radius: 5px; /* Slightly less rounded on the "tail" side */
        }

        .message-bubble.ai {
          background-color: #e6e6ea; /* Light gray for AI messages */
          color: #333;
          border-bottom-left-radius: 5px; /* Slightly less rounded on the "tail" side */
        }

        /* Styles for rendered Markdown within AI message bubbles */
        .message-bubble.ai p {
          margin: 0; /* Remove default paragraph margin */
          padding: 0;
        }

        .message-bubble.ai ul,
        .message-bubble.ai ol {
          margin: 10px 0 0 20px; /* Indent lists */
          padding: 0;
          list-style-type: disc; /* Default disc for unordered lists */
        }

        .message-bubble.ai ol {
          list-style-type: decimal; /* Default decimal for ordered lists */
        }

        .message-bubble.ai li {
          margin-bottom: 5px; /* Space between list items */
        }

        .message-bubble.ai strong {
          font-weight: 600; /* Make bold text stand out more */
        }
        .message-bubble.ai em { /* Italic */
            font-style: italic;
        }
        .message-bubble.ai h1,
        .message-bubble.ai h2,
        .message-bubble.ai h3,
        .message-bubble.ai h4,
        .message-bubble.ai h5,
        .message-bubble.ai h6 {
            margin-top: 15px;
            margin-bottom: 5px;
            font-weight: 600;
            line-height: 1.2;
        }
        .message-bubble.ai h1 { font-size: 1.3em; }
        .message-bubble.ai h2 { font-size: 1.2em; }
        .message-bubble.ai h3 { font-size: 1.1em; }
        .message-bubble.ai h4 { font-size: 1em; }


        .buttons-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px; /* Gap between buttons */
          margin-top: 10px;
          max-width: 75%;
          justify-content: flex-start; /* Align buttons to the start of the AI bubble */
        }

        .button-item {
          padding: 8px 15px;
          background-color: #e0f2f7; /* Light blue background */
          color: #2a7e9e; /* Darker blue text */
          border-radius: 25px; /* Pill-shaped buttons */
          transition: all 0.3s ease; /* Smooth transition for hover */
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem; /* Slightly smaller font for buttons */
          white-space: nowrap; /* Prevent buttons from wrapping text */
        }

        .button-item:hover {
          background-color: #cce9f2; /* Lighter blue on hover */
          transform: translateY(-2px); /* Slight lift effect */
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .loading-indicator {
          display: flex;
          justify-content: flex-start;
        }

        .loading-dots {
          max-width: 75%;
          padding: 12px 18px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          background-color: #e6e6ea;
          color: #333;
          border-bottom-left-radius: 5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background-color: #6a82fb; /* Blue dot color */
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        .dot:nth-child(3) { animation-delay: 0s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .message-input-form {
          padding: 15px 25px;
          border-top: 1px solid #e0e0e0; /* Lighter border */
          display: flex;
          gap: 10px;
          background-color: #ffffff; /* White background for input area */
        }

        .message-input {
          flex: 1;
          padding: 12px 20px;
          border: 1px solid #d0d0d0; /* Softer border */
          border-radius: 25px; /* More rounded input field */
          outline: none;
          font-size: 1rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .message-input:focus {
          border-color: #4a90e2; /* Blue border on focus */
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2); /* Soft blue glow */
        }

        .message-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f0f0f0;
        }

        .send-button {
          padding: 12px 25px;
          background-image: linear-gradient(to right, #4a90e2, #6a82fb); /* Gradient button */
          color: #fff;
          border-radius: 25px; /* Rounded button */
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15); /* More prominent shadow */
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }

        /* Disabled state for the send button */
        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-image: linear-gradient(to right, #a0a0a0, #b0b0b0); /* Greyed out gradient */
          transform: none; /* No lift effect when disabled */
          box-shadow: none; /* No shadow when disabled */
        }

        .send-button:hover:not(:disabled) { /* Apply hover only when not disabled */
          background-image: linear-gradient(to right, #3a7bd5, #556ee6); /* Slightly darker gradient on hover */
          transform: translateY(-2px); /* Lift effect */
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }


        /* Responsive adjustments */
        @media (max-width: 768px) {
          .chat-container {
            height: 95vh; /* Taller on smaller screens */
            border-radius: 0; /* No border-radius on very small screens for full width */
            box-shadow: none; /* No shadow on very small screens */
          }
          .app-container {
            padding: 0; /* Remove padding on very small screens */
          }
          .message-bubble, .buttons-container {
            max-width: 85%; /* Allow bubbles to take more width on small screens */
          }
          .chat-header h1 {
            font-size: 1.3rem;
          }
          .send-button {
            padding: 12px 20px;
          }
        }

        @media (max-width: 480px) {
          .chat-header, .messages-area, .message-input-form {
            padding: 15px; /* Reduce padding on very small screens */
          }
          .message-input {
            padding: 10px 15px;
            font-size: 0.9rem;
          }
          .send-button {
            font-size: 0.9rem;
            padding: 10px 18px;
          }
        }
        `}
      </style>
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <h1>From Behind a Young Man's Chest:<br/>Poetry Collection</h1> {/* Changed title here */}
          <span>Powered by AI</span>
        </div>

        {/* Chat Messages Area */}
        <div className="messages-area">
          {messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender}`}>
              {msg.type === 'text' && (
                <div className={`message-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
                </div>
              )}
              {msg.type === 'html' && (
                <div
                  className={`message-bubble ${msg.sender}`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                ></div>
              )}
              {msg.type === 'buttons' && (
                <div className="buttons-container">
                  {msg.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      onClick={() => handleButtonClick(button)}
                      className="button-item"
                    >
                      {button}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your poetry book..."
            className="message-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || inputText.trim() === ''}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
