// ============================================================
// 1. STUDY AREA — El-Tarf, Algeria
// ============================================================
var gaul = ee.FeatureCollection('FAO/GAUL/2015/level1');
var elTarf = gaul.filter(ee.Filter.and(
  ee.Filter.eq('ADM0_NAME', 'Algeria'),
  ee.Filter.eq('ADM1_NAME', 'El-Tarf')
));
Map.centerObject(elTarf, 9);
Map.addLayer(elTarf, {color: 'blue'}, 'El-Tarf Boundary');

// ============================================================
// 2. WORLDCOVER — Ground Truth
// ============================================================
var worldCover = ee.ImageCollection('ESA/WorldCover/v200').first();

// WorldCover classes:
// 10 = Tree cover
// 20 = Shrubland
// 30 = Grassland
// 40 = Cropland
// 50 = Built-up
// 60 = Bare / sparse vegetation
// 80 = Water
// 70, 90, 95, 100 = other (snow, wetland, mangrove, moss)

// ============================================================
// 3. MEDITERRANEAN COUNTRIES — Training Region
// ============================================================
var medCountries = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.inList('ADM0_NAME', [
    'Tunisia', 'Morocco', 'Spain', 'Italy', 'Greece', 'Turkey'
  ]));

// ============================================================
// 4. SENTINEL-2 COMPOSITE — Mediterranean (for training)
// ============================================================
var s2Med = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(medCountries)
  .filterDate('2020-01-01', '2020-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(medCountries);

// ============================================================
// 5. ADD INDICES — richer features for classifier
// ============================================================
function addIndices(img) {
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndwi = img.normalizedDifference(['B3', 'B8']).rename('NDWI');
  var ndbi = img.normalizedDifference(['B11', 'B8']).rename('NDBI');
  var mndwi = img.normalizedDifference(['B3', 'B11']).rename('MNDWI');
  return img.addBands([ndvi, ndwi, ndbi, mndwi]);
}

var s2MedFull = addIndices(s2Med);

// Bands used for classification
var bands = ['B2','B3','B4','B8','B11','B12','NDVI','NDWI','NDBI','MNDWI'];

// ============================================================
// 6. SAMPLE POINTS FROM WORLDCOVER (Mediterranean)
// ============================================================
var worldCoverMed = worldCover.clip(medCountries);

var samples = s2MedFull.select(bands)
  .addBands(worldCoverMed.rename('landcover'))
  .stratifiedSample({
    numPoints: 300,        // points per class
    classBand: 'landcover',
    region: medCountries.geometry(),
    scale: 10,
    seed: 42,
    geometries: true
  });

print('Sample count:', samples.size());

// ============================================================
// 7. TRAIN RANDOM FOREST CLASSIFIER
// ============================================================
var classifier = ee.Classifier.smileRandomForest(100)
  .train({
    features: samples,
    classProperty: 'landcover',
    inputProperties: bands
  });

// ============================================================
// 8. SENTINEL-2 COMPOSITE — El-Tarf, Algeria (to classify)
// ============================================================
var s2Algeria = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(elTarf)
  .filterDate('2020-01-01', '2020-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(elTarf);

var s2AlgeriaFull = addIndices(s2Algeria);

// ============================================================
// 9. CLASSIFY EL-TARF
// ============================================================
var classified = s2AlgeriaFull.select(bands).classify(classifier);

// ============================================================
// 10. DISPLAY RESULT
// ============================================================
var classVis = {
  min: 10,
  max: 100,
  palette: [
    '006400', // 10 Tree cover (dark green)
    'ffbb22', // 20 Shrubland
    'ffff4c', // 30 Grassland
    'f096ff', // 40 Cropland
    'fa0000', // 50 Built-up
    'b4b4b4', // 60 Bare
    'f0f0f0', // 70 Snow (unlikely here)
    '0064c8', // 80 Water
    '0096a0', // 90 Wetland
    '00cf75', // 95 Mangrove
    'fae6a0'  // 100 Moss
  ]
};

Map.addLayer(classified, classVis, 'Classified El-Tarf');
Map.addLayer(worldCover.clip(elTarf), classVis, 'WorldCover El-Tarf (reference)');

// ============================================================
// 11. ACCURACY ASSESSMENT
// ============================================================
var validation = classified.addBands(worldCoverMed.rename('landcover'))
  .sample({
    region: medCountries.geometry(),
    scale: 10,
    numPixels: 500,
    seed: 99
  });

var confMatrix = ee.ConfusionMatrix(
  validation.select(['classification', 'landcover'])
);
print('Confusion Matrix:', confMatrix);
print('Overall Accuracy:', confMatrix.accuracy());
print('Kappa:', confMatrix.kappa());

// ============================================================
// 12. EXPORT CLASSIFIED MAP
// ============================================================
Export.image.toDrive({
  image: classified,
  description: 'classified_elTarf_worldcover',
  folder: 'Forest_classification',
  region: elTarf.geometry(),
  scale: 10,
  crs: 'EPSG:32632',
  fileFormat: 'GeoTIFF',
  maxPixels: 1E10
});
