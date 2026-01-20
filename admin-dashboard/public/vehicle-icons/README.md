# 🚗 Vehicle Icons Folder

This folder is used to store vehicle type icons that are uploaded through the admin panel.

## 📁 Folder Structure

```
public/vehicle-icons/
├── bike.png
├── auto.png
├── sedan.png
├── suv.png
├── luxury.png
└── custom-vehicle-name.png
```

## 📸 Image Guidelines

### **Recommended Specifications:**
- **Format:** PNG with transparent background (preferred) or JPG
- **Size:** Max 2MB per image
- **Dimensions:** 512x512 px (recommended for best quality)
- **Aspect Ratio:** Square (1:1)
- **Style:** Simple, clear, recognizable silhouettes

### **Good Icon Examples:**
✅ Clean vehicle silhouette
✅ Transparent or white background
✅ High contrast
✅ Recognizable at small sizes

### **Avoid:**
❌ Overly detailed images
❌ Low resolution
❌ Dark backgrounds (use transparent)
❌ Text in images

## 🎨 Where to Get Icons

### **Free Resources:**
1. **Flaticon** - https://www.flaticon.com/search?word=vehicle
2. **Icons8** - https://icons8.com/icons/set/vehicle
3. **FontAwesome** - https://fontawesome.com/search?q=car
4. **Noun Project** - https://thenounproject.com/
5. **Freepik** - https://www.freepik.com/

### **Custom Design:**
- Use tools like **Figma**, **Canva**, or **Adobe Illustrator**
- Keep it simple and recognizable
- Use your brand colors if desired

## 📤 How to Upload

### **Method 1: Through Admin Panel** (Recommended)
1. Go to **Dashboard → Vehicle Pricing**
2. Click **"Add Vehicle Type"** or **Edit** existing
3. In the form, click **"Upload Image"** section
4. Choose your image file
5. Preview will show immediately
6. Click **Save**

### **Method 2: Manual Upload**
1. Place your icon file in this folder: `public/vehicle-icons/`
2. Name it appropriately (e.g., `bike.png`, `sedan.png`)
3. Use the file path in your code: `/vehicle-icons/bike.png`

## 💾 Storage in Database

When you upload through the admin panel, the image is converted to **Base64** format and stored directly in MongoDB. This means:

✅ No need for separate file server
✅ Easy backup (included in database backup)
✅ Fast retrieval
✅ Works across environments

**Note:** For production with many vehicles, consider using a CDN like:
- AWS S3 + CloudFront
- Cloudinary
- Google Cloud Storage
- Azure Blob Storage

## 🔄 Best Practices

### **For Small Scale (< 50 vehicles):**
✅ Store as Base64 in database (current implementation)
✅ Max 2MB per image
✅ PNG with transparency

### **For Large Scale (> 50 vehicles):**
✅ Upload to CDN/Cloud Storage
✅ Store only URL in database
✅ Implement image optimization
✅ Use lazy loading

## 📱 Icon Display Sizes

Your icons will be displayed at different sizes:

- **Vehicle Selection (Mobile App):** 64x64 px
- **Vehicle Card (Admin):** 64x64 px
- **Vehicle Details:** 128x128 px
- **Map Marker:** 32x32 px

Make sure your icon looks good at all these sizes!

## 🎯 Example Icons

Copy these sample icon URLs to get started quickly:

```javascript
// Sample vehicle icons (placeholder URLs)
bike: "https://via.placeholder.com/512/4CAF50/FFF?text=🏍️"
auto: "https://via.placeholder.com/512/FF9800/FFF?text=🛺"
sedan: "https://via.placeholder.com/512/2196F3/FFF?text=🚗"
suv: "https://via.placeholder.com/512/9C27B0/FFF?text=🚙"
luxury: "https://via.placeholder.com/512/000000/FFF?text=🚘"
```

## 🚀 Quick Start

1. Download vehicle icons from Flaticon or Icons8
2. Resize to 512x512 px using any image editor
3. Convert to PNG with transparent background
4. Upload through admin panel
5. Done! Icon will appear on all vehicle cards

---

**Need help?** Check the main documentation: `/VEHICLE_PRICING_SYSTEM.md`

