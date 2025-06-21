import React, { useEffect, useState } from 'react';
import './App.css';

const API_KEY = 've62PUc37AMEOfQHyEUJif2gVObK8SMg';

function App() {
  const [query, setQuery] = useState(''); // the query text
  const [gifs, setGifs] = useState([]); // the gifs that appear in the view
  const [limitModal, setLimitModal] = useState(false); // the API rate limit alert
  const [copied, setCopied] = useState(false); // the copied GIF alert
  const [copiedId, setCopiedId] = useState(null); // the ID of the copied GIF
  const [rateLimitTimer, setRateLimitTimer] = useState(null); // the timer for the rate limit alert
  const [copiedTimer, setCopiedTimer] = useState(null); // the timer for the copied alert
  const [page, setPage] = useState(0); // the number used to paginate the display
  const [cache, setCache] = useState([]); // the cached GIFs from all previous searches


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
      // the free GIPHY API key allows max limit=50
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=g&q=${encodeURIComponent(query)}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data);
        let cacheItem = {'query':query, 'data': data.data, 'offset':1};
        addToCache(cacheItem);
        setPage(0);
      } else if(response.status === 429) {
        showLimitModal();
      } else {
        throw new Error('Response was not ok');
      }
    } catch (err) {
      console.error('Error fetching GIFs:', err);
    }
  }

  function searchCache(query) {
    return cache.find((item) => item.query === query);
  }

  function addToCache(cacheItem) {
    setCache([...cache, cacheItem]);
  }

  function showLimitModal() {
    // show rate limit modal and close it after 8 seconds
    setLimitModal(true);
    if(rateLimitTimer) {
      clearTimeout(rateLimitTimer);
    }
    setRateLimitTimer(setTimeout(() => setLimitModal(false), 8000));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function copyUrlToClipboard(gif) {
    let url = gif.images.fixed_height.mp4;
    navigator.clipboard.writeText(url).then(res => console.log(res));
    // changes the GIF text to 'Copied!' for 6 seconds
    setCopied(true);
    setCopiedId(gif.id);
    if(copiedTimer) {
      clearTimeout(copiedTimer);
    }
    setCopiedTimer(setTimeout(() => setCopied(false), 6000));
  }

  async function handleNext(e) {
    e.preventDefault();
    if((page+1)*10 >= gifs.length) {
      await requestMoreGifs();
    }
    setPage(page + 1);
  }

  function hanldePrevious() {
    setPage(page - 1);
  }

  function recallHistory(query) {
    let cacheItem = cache.find((item) => item.query === query);
    setQuery(query);
    setPage(0);
    setGifs([...cacheItem.data]);
  }

  async function requestMoreGifs() {
    // call endpoint with offset
    let cacheItem = searchCache(query);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&rating=g&q=${encodeURIComponent(query)}&limit=50&offset=${cacheItem.offset*50}`
      );
      if (response.ok) {
        const data = await response.json();
        let newData = [...cacheItem.data, ...data.data];
        setGifs(newData);
        updateCacheItem({'query':query, 'data':newData, 'offset': cacheItem.offset + 1});
      } else if(response.status === 429) {
        showLimitModal();
      } else {
        throw new Error('Response was not ok');
      }
    } catch (err) {
        console.error('Error fetching GIFs:', err);
    }
  }

  function updateCacheItem(newCacheItem) {
    let index = cache.findIndex((item) => item.query === newCacheItem.query);
    let newCache = [...cache];
    newCache[index] = newCacheItem;
    setCache(newCache);
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

      <div className="history-list">
        {cache.map((cacheItem) => (<button className="history-list-item" onClick={() => recallHistory(cacheItem.query)}>{cacheItem.query}</button>))}
      </div>

      <div className="gif-grid">
        {gifs.map((gif, index) => (
          ((index >= page*10) && (index < (page+1)*10)) && (
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
        )))}
      </div>
      <button className='nav-button' onClick={hanldePrevious} hidden={page === 0}>&lt;&lt; Previous</button>
      <button className='nav-button' onClick={handleNext}>Next &gt;&gt;</button>
    </div>
  );
}

export default App;
