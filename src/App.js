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
  const [page, setPage] = useState(0);
  const [cache, setCache] = useState([]);


  const searchGifs = async (e) => {
    e.preventDefault();
    if (!query) return;
    let foundCacheItem = searchCache(query);
    if(foundCacheItem) {
      // resuse results of previous query
      setGifs([...foundCacheItem.data]);
      setPage(0);
      return;
    }
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=g&q=${encodeURIComponent(query)}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data);
        console.log(gifs.length);
        let cacheItem = {'query':query, 'data': data.data};
        updateCache(cacheItem);
        setPage(0);
      } else if(response.status === 429) {
        showLimitModal();
      } else {
        throw new Error('Response was not ok');
      }
    } catch (err) {
      console.error('Error fetching GIFs:', err);
    }
  };

  function searchCache(query) {
    return cache.find((item) => item.query === query);
  }

  function updateCache(cacheItem) {
    setCache([...cache, cacheItem]);
  }

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

  function handleNext() {
    setPage(page + 1);
  }

  function hanldePrevious() {
    setPage(page - 1);
  }

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
        {gifs.map((gif, index) => (
          <div key={gif.id} className="gif-item" onClick={() => copyUrlToClipboard(gif)} hidden={!((index >= page*10) && (index < (page+1)*10))}>
            <figure>
              <video
                src={gif.images.fixed_height.mp4}
                autoPlay
                loop
                muted
                playsInline
              /> <figcaption>{(copied && gif.id === copiedId) ? 'Copied!' : gif.title}</figcaption>
            </figure>
          </div>
        ))}
      </div>
      <button class='nav-button' onClick={hanldePrevious} hidden={page === 0}>&lt;&lt; Previous</button>
      <button class='nav-button' onClick={handleNext}>Next &gt;&gt;</button>
    </div>
  );
}

export default App;
