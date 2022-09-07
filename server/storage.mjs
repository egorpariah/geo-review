import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data.json');

class Storage {
  constructor() {
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, '{}');
      this.data = {};
    } else {
      this.data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  }

  validateCoords(coords) {
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error('Invalid coords data');
    }
  }

  validateReview(review) {
    if (!review || !review.name || !review.place || !review.text) {
      throw new Error('Invalid review data');
    }
  }

  getIndex(coords) {
    return `${coords[0]}_${coords[1]}`;
  }

  add(data) {
    this.validateCoords(data.coords);
    this.validateReview(data.review);
    const index = this.getIndex(data.coords);
    this.data[index] = this.data[index] || [];
    this.data[index].push(data.review);
    this.updateStorage();
  }

  getCoords() {
    const coords = [];

    for (const item in this.data) {
      coords.push({
        coords: item.split('_'),
        total: this.data[item].length,
      });
    }

    return coords;
  }

  getByCoords(coords) {
    this.validateCoords(coords);
    const index = this.getIndex(coords);

    return this.data[index] || [];
  }

  updateStorage() {
    fs.writeFile(dataPath, JSON.stringify(this.data), () => {});
  }
}

export { Storage };
