export default class YandexMap {
  constructor(mapId, onClick) {
    this.mapId = mapId;
    this.onClick = onClick;
  }

  async init() {
    await this.injectYMapsScript();
    await this.loadYMaps();
    this.initMap();
  }

  injectYMapsScript() {
    return new Promise((resolve) => {
      const ymapsScript = document.createElement('script');
      ymapsScript.src =
        'https://api-maps.yandex.ru/2.1/?apikey=596d923d-0af8-461b-b3f3-2c85fe254273&lang=ru_RU';
      document.body.appendChild(ymapsScript);
      ymapsScript.addEventListener('load', resolve);
    });
  }

  loadYMaps() {
    return new Promise((resolve) => ymaps.ready(resolve));
  }

  initMap() {
    this.clusterer = new ymaps.Clusterer({
      clusterDisableClickZoom: true,
      clusterOpenBalloonOnClick: false,
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
      clusterBalloonPagerSize: 5,
    });

    this.clusterer.events.add('click', (e) => {
      const target = e.get('target');
      const coords = target.geometry.getCoordinates();
      this.onClick(coords, target);
    });
    this.map = new ymaps.Map(
      this.mapId,
      {
        center: [55.76, 37.63],
        zoom: 12,
      },
      {
        balloonMaxHeight: 'none',
      }
    );
    this.map.cursors.push('arrow');
    this.map.events.add('click', (e) => {
      this.onClick(e.get('coords'), e.get('target'));
    });
    this.map.geoObjects.add(this.clusterer);
  }

  openBalloon(coords, content) {
    this.map.balloon.open(coords, content);
  }

  openClusterBalloon(cluster) {
    this.clusterer.balloon.open(cluster);
  }

  setBalloonContent(content) {
    this.map.balloon.setData(content);
  }

  closeBalloon() {
    this.map.balloon.close();
  }

  async createPlacemark(coords, properties, options) {
    const placemark = new ymaps.Placemark(coords, properties, options);
    this.clusterer.add(placemark);
  }

  async getAddress(coords) {
    const addressObjects = await ymaps.geocode(coords, { results: 1 });
    const address = addressObjects.geoObjects.get(0).getAddressLine();
    return address;
  }
}
