import React, { useEffect, useState } from "react";
import "./App.css";
import giphy from "./ApiUtil";

function App() {
  const [query, setQuery] = useState(""); // the query text
  const [gifs, setGifs] = useState([]); // the gifs that appear in the view
  const [limitModal, setLimitModal] = useState(false); // the API rate limit alert
  const [copied, setCopied] = useState(false); // the copied GIF alert
  const [copiedId, setCopiedId] = useState(null); // the ID of the copied GIF
  const [rateLimitTimer, setRateLimitTimer] = useState(null); // the timer for the rate limit alert
  const [copiedTimer, setCopiedTimer] = useState(null); // the timer for the copied alert
  const [page, setPage] = useState(0); // the number used to paginate the display
  const [cache, setCache] = useState([]); // the cached GIFs from all previous searches
  const [initialState, setInitialState] = useState(true); // whether the app is in its initial state

  let displayedGifCount = 0; // number of GIFs in current display

  useEffect(() => {
    // populates view with initial 3 random gifs
    (async () => {
      try {
        const response = [
          await giphy.getRandomGif(),
          await giphy.getRandomGif(),
          await giphy.getRandomGif(),
        ];
        if (response[0].ok && response[1].ok && response[2].ok) {
          const data1 = await response[0].json();
          const data2 = await response[1].json();
          const data3 = await response[2].json();
          setGifs([data1.data, data2.data, data3.data]);
        } else if (
          response[1].status === 429 ||
          response[1].status === 429 ||
          response[2].status === 429
        ) {
          showLimitModal();
        } else {
          throw new Error("Response was not ok");
        }
      } catch (err) {
        console.error("Error fetching GIFs:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchGifs = async (e) => {
    e.preventDefault();
    if (!query) return;
    let foundCacheItem = searchCache(query);
    if (foundCacheItem) {
      // resuse results of previous query
      setGifs([...foundCacheItem.data]);
      setPage(0);
      return;
    }
    try {
      // the free GIPHY API key allows max limit=50
      const response = await giphy.getGifs(query, 50);
      if (response.ok) {
        const data = await response.json();
        setGifs(data.data);
        let cacheItem = { query: query, data: data.data, offset: 1 };
        addToCache(cacheItem);
        setPage(0);
        setInitialState(false);
      } else if (response.status === 429) {
        showLimitModal();
      } else {
        throw new Error("Response was not ok");
      }
    } catch (err) {
      console.error("Error fetching GIFs:", err);
    }
  };

  function searchCache(query) {
    return cache.find((item) => item.query === query);
  }

  function addToCache(cacheItem) {
    setCache([...cache, cacheItem]);
  }

  function showLimitModal() {
    // show rate limit modal and close it after 8 seconds
    setLimitModal(true);
    if (rateLimitTimer) {
      clearTimeout(rateLimitTimer);
    }
    setRateLimitTimer(setTimeout(() => setLimitModal(false), 8000));
  }

  function copyUrlToClipboard(gif) {
    let url = gif.images.fixed_height.mp4;
    navigator.clipboard.writeText(url).then((res) => console.log(res));
    // changes the GIF text to 'Copied!' for 6 seconds
    setCopied(true);
    setCopiedId(gif.id);
    if (copiedTimer) {
      clearTimeout(copiedTimer);
    }
    setCopiedTimer(setTimeout(() => setCopied(false), 6000));
  }

  async function handleNext() {
    displayedGifCount = 0;
    if ((page + 1) * 10 >= gifs.length) {
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
      const response = await giphy.getGifsOffset(
        query,
        50,
        cacheItem.offset * 50
      );
      if (response.ok) {
        const data = await response.json();
        let newData = [...cacheItem.data, ...data.data];
        setGifs(newData);
        updateCacheItem({
          query: query,
          data: newData,
          offset: cacheItem.offset + 1,
        });
      } else if (response.status === 429) {
        showLimitModal();
      } else {
        throw new Error("Response was not ok");
      }
    } catch (err) {
      console.error("Error fetching GIFs:", err);
    }
  }

  function updateCacheItem(newCacheItem) {
    // replaces the old cache item for the given query with the new one
    // used to add more GIFs to an existing cached query
    let index = cache.findIndex((item) => item.query === newCacheItem.query);
    let newCache = [...cache];
    newCache[index] = newCacheItem;
    setCache(newCache);
  }

  function showGifAt(index) {
    // limits the grid to 10 GIFs per page
    if (index >= page * 10 && index < (page + 1) * 10) {
      displayedGifCount = displayedGifCount + 1;
      return true;
    }
    return false;
  }

  return (
    <div className="App">
      {limitModal && (
        <div className="rate-limit-modal">GIPHY API rate limit reached!</div>
      )}
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

      <div className="history-list">
        {cache.map((cacheItem) => (
          <button
            className="history-list-item"
            onClick={() => recallHistory(cacheItem.query)}
          >
            {cacheItem.query}
          </button>
        ))}
      </div>

      <div className="gif-grid">
        {gifs.map(
          (gif, index) =>
            showGifAt(index) && (
              <div
                key={gif.id}
                className="gif-item"
                onClick={() => copyUrlToClipboard(gif)}
              >
                <figure>
                  <video
                    src={gif.images.fixed_height.mp4}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />{" "}
                  <figcaption>
                    {copied && gif.id === copiedId ? "Copied!" : gif.title}
                  </figcaption>
                </figure>
              </div>
            )
        )}
      </div>
      {page > 0 && (
        <button className="nav-button" onClick={hanldePrevious}>
          &lt;&lt; Previous
        </button>
      )}
      {displayedGifCount === 10 && !initialState && (
        <button className="nav-button" onClick={handleNext}>
          Next &gt;&gt;
        </button>
      )}
    </div>
  );
}

export default App;
