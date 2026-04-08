# 🛰️ El-Tarf Land Cover Classification

![Google Earth Engine](https://img.shields.io/badge/Google_Earth_Engine-4285F4?logo=googleearth&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Sentinel-2](https://img.shields.io/badge/Sentinel--2-satellite_imagery-1B3A5C)

A Google Earth Engine script that maps land cover in the El-Tarf province of northeastern Algeria from Sentinel-2 imagery, using a Random Forest classifier. Built during an internship at ASAL (Algerian Space Agency).

## 🧠 How It Works

The model is trained on neighbouring Mediterranean countries with similar landscapes, then applied to El-Tarf.

1. **Study area:** El-Tarf boundary from FAO GAUL
2. **Training region:** Tunisia, Morocco, Spain, Italy, Greece and Turkey
3. **Imagery:** cloud-filtered Sentinel-2 median composites for 2020
4. **Features:** bands B2, B3, B4, B8, B11 and B12, plus the NDVI, NDWI, NDBI and MNDWI indices
5. **Labels:** 300 stratified sample points per class from ESA WorldCover
6. **Model:** Random Forest with 100 trees
7. **Output:** classified map shown next to WorldCover, and exported as a 10 m GeoTIFF to Google Drive

## 🗺️ Classes

Tree cover, shrubland, grassland, cropland, built-up, bare or sparse vegetation, water, wetland and other WorldCover classes.

## 🚀 How to Run

You need a [Google Earth Engine](https://earthengine.google.com/) account.

1. Open the [Earth Engine Code Editor](https://code.earthengine.google.com/)
2. Paste `land_cover_classification.js` into a new script and click **Run**
3. Compare the layers in the map view
4. Start the export from the **Tasks** tab

## 📂 Data

| Dataset | Source | Use |
|---------|--------|-----|
| Sentinel-2 Surface Reflectance | `COPERNICUS/S2_SR_HARMONIZED` | Input imagery |
| ESA WorldCover v200 | `ESA/WorldCover/v200` | Training labels and reference map |
| FAO GAUL 2015 | `FAO/GAUL/2015` | Administrative boundaries |

## 👤 Author

**Adel Merad** — [GitHub](https://github.com/adelmerad)
