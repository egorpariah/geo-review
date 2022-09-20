import YandexMap from './yandex-map.mjs';

export default class GeoReview {
  constructor() {
    this.formTemplate = document.querySelector('#formTemplate').innerHTML;
    this.createCluster = this.createCluster.bind(this);
    this.map = new YandexMap('map', this.onClick.bind(this));

    this.map.init().then(this.onInit.bind(this));
  }

  async onInit() {
    this.map.clusterer.createCluster = this.createCluster;

    const coords = await this.callApi('coords');

    for (const item of coords) {
      const list = await this.callApi('list', { coords: item.coords });

      for (let i = 0; i < item.total; i++) {
        const propsAndOptions = await this.setPlacemarkBalloon(list[i], item.coords);
        this.map.createPlacemark(item.coords, ...propsAndOptions);
      }
    }

    document.body.addEventListener('click', this.onDocumentClick.bind(this));
    document.body.addEventListener('click', this.onAddressClick.bind(this));
  }

  async callApi(method, body = {}) {
    const res = await fetch(`/${method}`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await res.json();
  }

  getCurrentDate() {
    const today = new Date();

    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return dd + '.' + mm + '.' + yyyy;
  }

  createForm(coords, reviews) {
    const root = document.createElement('div');
    root.innerHTML = this.formTemplate;
    const reviewsList = root.querySelector('.reviews');
    const reviewForm = root.querySelector('[data-role="review-form"]');
    reviewForm.dataset.coords = JSON.stringify(coords);

    if (reviews.length !== 0) reviewsList.classList.add('reviews--filled');

    for (const review of reviews) {
      const div = document.createElement('div');
      div.classList.add('reviews__item', 'review');
      div.innerHTML = `<div class="review__header">
        <span>${review.name}</span> ${review.place} ${this.getCurrentDate()}
        </div>
        <p class="review__text">${review.text}</p>`;
      reviewsList.appendChild(div);
    }

    return root;
  }

  async onClick(coords, target) {
    if (target.properties && target.properties.get('cluster')) {
      const geoObjects = target.getGeoObjects();
      const geoObjectsCoords = geoObjects.map((item) => item.geometry.getCoordinates());

      if (!this.isArrayElemsEqual(geoObjectsCoords, this.isArraysEqual)) {
        this.map.openClusterBalloon(target);

        return;
      }
    }

    this.map.openBalloon(coords, 'Загрузка...');
    const address = await this.map.getAddress(coords);
    const list = await this.callApi('list', { coords });
    const form = this.createForm(coords, list);

    this.map.setBalloonContent({
      contentHeader: `<h2 class="reviewform-header">${address}</h2>`,
      content: form.innerHTML,
    });
  }

  async onDocumentClick(e) {
    e.preventDefault();

    if (e.target.dataset.role === 'review-add') {
      const reviewForm = document.querySelector('[data-role="review-form"]');
      const coords = JSON.parse(reviewForm.dataset.coords);
      const data = {
        coords,
        review: {
          name: document.querySelector('[data-role="review-name"]').value,
          place: document.querySelector('[data-role="review-place"]').value,
          text: document.querySelector('[data-role="review-text"]').value,
        },
      };

      try {
        await this.callApi('add', data);
        this.validateForm(reviewForm);
        const propsAndOptions = await this.setPlacemarkBalloon(data.review, coords);
        await this.map.createPlacemark(coords, ...propsAndOptions);
        this.map.closeBalloon();
      } catch (e) {
        const formError = document.querySelector('.form__error');
        formError.innerText = e.message;
      }
    }
  }

  async onAddressClick(e) {
    if (e.target.dataset.role === 'review-address') {
      const balloonHeader = document.querySelector('.reviewform-header--carousel');
      const coords = JSON.parse(balloonHeader.dataset.coords);

      await this.onClick(coords, e.target);
      this.map.map.setCenter(coords, 13);
      this.map.map.balloon.autoPan();
    }
  }

  isArraysEqual(arr1, arr2) {
    return (
      arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index])
    );
  }

  isArrayElemsEqual(array, fn = (a, b) => a === b) {
    for (let i = 1; i < array.length; i++) {
      if (!fn(array[0], array[i])) return false;
    }

    return true;
  }

  createCluster(center, geoObjects) {
    const geoObjectsCoords = geoObjects.map((item) => item.geometry.getCoordinates());

    let trueCenter = center;

    if (this.isArrayElemsEqual(geoObjectsCoords, this.isArraysEqual)) {
      trueCenter = geoObjects[0].geometry.getCoordinates();
    }

    const clusterPlacemark = ymaps.Clusterer.prototype.createCluster.call(
      this.map.clusterer,
      trueCenter,
      geoObjects
    );

    clusterPlacemark.properties.set({ cluster: true });

    return clusterPlacemark;
  }

  validateForm(form) {
    form.querySelectorAll('.form__input').forEach((element) => {
      if (!element.checkValidity()) throw new Error('Заполните форму');
    });

    return true;
  }

  async setPlacemarkBalloon(review, coords) {
    const properties = {
      balloonContentHeader: `<div data-role="review-address" data-coords=${JSON.stringify(
        coords
      )}
        class="reviewform-header reviewform-header--carousel">${await this.map.getAddress(
          coords
        )}</div>`,
      balloonContent: `<div class="reviews__item review review--carousel">
        <div class="review__header">
        <span>${review.name}</span> ${review.place} ${this.getCurrentDate()}
        </div>
        <p class="review__text">${review.text}</p>
        </div>`,
    };
    const options = { openBalloonOnClick: false };

    return [properties, options];
  }
}
