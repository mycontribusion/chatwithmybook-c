import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import './App.css';


const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callBackendAPI = async (prompt) => {
    setIsLoading(true);

    if (!API_URL) {
      console.error("API_URL is not defined.");
      setMessages(prev => [...prev, {
        text: "Configuration error: Backend URL is not set.",
        sender: 'ai',
        type: 'text'
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      });

      const data = await response.json();

      if (response.ok) {
        let aiText = data.response || '';
        const buttonMatch = aiText.match(/BUTTONS: (.*)/i);
        let buttons = [];

        if (buttonMatch) {
          buttons = buttonMatch[1].split(',').map(btn => btn.trim());
          aiText = aiText.replace(buttonMatch[0], '').trim();
        }

        setMessages(prev => [
          ...prev,
          { text: marked.parse(aiText), sender: 'ai', type: 'html' },
          ...(buttons.length > 0 ? [{ buttons, sender: 'ai', type: 'buttons' }] : [])
        ]);
      } else {
        setMessages(prev => [...prev, {
          text: data.error || "Server responded with an error.",
          sender: 'ai',
          type: 'text'
        }]);
      }
    } catch (error) {
      console.error("Error contacting backend:", error);
      setMessages(prev => [...prev, {
        text: "Network error. Please check your connection or try again later.",
        sender: 'ai',
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    setMessages(prev => [...prev, { text: trimmedText, sender: 'user', type: 'text' }]);
    callBackendAPI(trimmedText);
    setInputText('');
  };

  const handleButtonClick = (text) => {
    setMessages(prev => [...prev, { text, sender: 'user', type: 'text' }]);
    callBackendAPI(text);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="chat-container">
        <div className="chat-header">
          <h1>From Behind a Young Man's Chest</h1>
          <span>Powered by AI</span>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.sender}`}>
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
                  {msg.buttons.map((btn, i) => (
                    <button key={i} onClick={() => handleButtonClick(btn)} className="button-item">
                      {btn}
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

        {/* Input */}
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            className="message-input"
            placeholder="Ask about your poetry book..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
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
