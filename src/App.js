import React, { useEffect, useState } from 'react';
import './App.css';

const API_KEY = 've62PUc37AMEOfQHyEUJif2gVObK8SMg';

function App() {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [limitModal, setLimitModal] = useState(false);

  const searchGifs = async (e) => {
    e.preventDefault();
    if (!query) return;
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=g&q=${encodeURIComponent(query)}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data); 
      } else if(response.status === 429) {
        showLimitModal();
      } else {
        throw new Error('Response was not ok');
      }
    } catch (err) {
      console.error('Error fetching GIFs:', err);
    }
  };

  function showLimitModal() {
    setLimitModal(true);
    setTimeout(() => setLimitModal(false), 10000);
  }

  useEffect(() => {
    (async () => {
      try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}&rating=g}`
      );
      if (response.ok) {
        const data = await response.json();
        setGifs([data.data]);
      } else if(response.status === 429) {
        showLimitModal();
      } else {
        throw new Error('Response was not ok');
      }
    } catch (err) {
      console.error('Error fetching GIFs:', err);
    }
    })()
  },[]);

  return (
    <div className="App">
      <h1>GIF Search</h1>
      <form onSubmit={searchGifs}>
        <input
          type="text"
          placeholder="Search for GIFs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="gif-grid">
        {gifs.map((gif) => (
          <div key={gif.id} className="gif-item">
            <video
              src={gif.images.fixed_height.mp4}
              autoPlay
              loop
              muted
              playsInline
              width="200"
              height="200"
            />
          </div>
        ))}
      </div>
      <div>{limitModal && (<div className="rate-limit-modal">GIPHY API rate limit reached!</div>)}</div>
      
    </div>
  );
}

export default App;
