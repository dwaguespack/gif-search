import React, { useEffect, useState } from 'react';
import './App.css';

const API_KEY = 've62PUc37AMEOfQHyEUJif2gVObK8SMg';

function App() {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [limitModal, setLimitModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [timer, setTimer] = useState(null);
  const [page, getPage] = useState(1);


  const searchGifs = async (e) => {
    e.preventDefault();
    if (!query) return;
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=g&q=${encodeURIComponent(query)}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        // TODO: change this to 3
        if(gifs.length === 1) {
          // this only occurs when the app first loads
          setGifs(data.data);
        } else {
          // add 10 new gifs to array
        setGifs(gifs.concat(data.data)); 
        }
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
    // show rate limit modal and close it after 8 seconds
    setLimitModal(true);
    setTimer(setTimeout(() => setLimitModal(false), 8000));
  }

  useEffect(() => {
    // populates view with initial 3 random gifs
    (async () => {
      try {
        // TODO: call 2 more times
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

  function copyUrlToClipboard(gif) {
    let url = gif.images.fixed_height.mp4;
    navigator.clipboard.writeText(url).then(res => console.log(res));
    setCopied(true);
    setCopiedId(gif.id);
    if(timer) {
      clearTimeout(timer);
    }
    setTimer(setTimeout(() => setCopied(false), 8000));
  };

  return (
    <div className="App">
      <h1>GIF Search</h1>
      <p>Click on a GIF to copy its URL.</p>
      <form onSubmit={searchGifs}>
        <input
          type="text"
          placeholder="Search for GIFs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div>{limitModal && (<div className="rate-limit-modal">GIPHY API rate limit reached!</div>)}</div>

      <div className="gif-grid">
        {gifs.map((gif) => (
          <div key={gif.id} className="gif-item" onClick={() => copyUrlToClipboard(gif)}>
            <figure>
              <video
                src={gif.images.fixed_height.mp4}
                autoPlay
                loop
                muted
                playsInline
                width="200"
                height="200"
              /> <figcaption>{(copied && gif.id === copiedId) ? 'Copied!' : gif.title}</figcaption>
            </figure>
          </div>
        ))}
      </div>
      <button class='more-button'>More</button>
    </div>
  );
}

export default App;
