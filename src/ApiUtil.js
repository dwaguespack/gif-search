class GiphyApi {
  API_KEY = "ve62PUc37AMEOfQHyEUJif2gVObK8SMg";
  BASE_URL = "https://api.giphy.com/v1/gifs";

  async getGifs(query, count) {
    return await fetch(
      `${this.BASE_URL}/search?api_key=${
        this.API_KEY
      }&rating=g&q=${encodeURIComponent(query)}&limit=${count}`
    );
  }

  async getRandomGif() {
    return await fetch(
      `${this.BASE_URL}/random?api_key=${this.API_KEY}&rating=g}`
    );
  }

  async getGifsOffset(query, count, offset) {
    return await fetch(
      `${this.BASE_URL}/search?api_key=${
        this.API_KEY
      }&rating=g&q=${encodeURIComponent(query)}&limit=${count}&offset=${offset}`
    );
  }
}
let giphy = new GiphyApi();
export default giphy;
