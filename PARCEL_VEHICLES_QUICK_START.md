# 🚀 Quick Start: Parcel Vehicles & Pricing

**5-minute guide to setting up your parcel delivery fleet!**

---

## 🎯 WHAT IS THIS?

A dedicated page to manage **delivery vehicles** for your **parcel/package delivery service**. Different from ride vehicles - this is for transporting packages, not people!

---

## ⚡ 3-STEP QUICK START

### **STEP 1: Access Page**
```
http://localhost:3001/dashboard/parcel-vehicles
```
Click **"Add Parcel Vehicle"** button

### **STEP 2: Fill Details**

**Basic Info:**
- Name: "Pikkar Express Bike"
- Type: "express-bike"
- Description: "Fast delivery for small parcels"

**Pricing:**
- Base Price: ₹40
- Per KM: ₹10
- Per KG: ₹5
- Minimum: ₹60

**Capacity:**
- Max Weight: 10 kg
- Dimensions: 50 × 40 × 40 cm

**Features:**
- "Fast Delivery, Small Parcels, Same Day"

### **STEP 3: Save**
- Check pricing preview
- Click **"Add Parcel Vehicle"**
- Done! ✅

---

## 📦 PRE-LOADED VEHICLES

The page comes with 4 ready-to-use vehicles:

| Vehicle | Icon | Base | Per KM | Per KG | Max Weight |
|---------|------|------|--------|--------|------------|
| **Express Bike** | 🏍️ | ₹40 | ₹10 | ₹5 | 10 kg |
| **Van** | 🚐 | ₹80 | ₹15 | ₹8 | 100 kg |
| **Truck** | 🚚 | ₹150 | ₹25 | ₹12 | 500 kg |
| **Tempo** | 🚛 | ₹200 | ₹30 | ₹15 | 1000 kg |

**You can edit or add new ones!**

---

## 💡 PRICING EXPLAINED

### **Formula:**
```
Total = Base + (Distance × Per KM) + (Weight × Per KG)

If Total < Minimum:
    Total = Minimum
```

### **Example:**
**Scenario:** 5 kg parcel, 10 km distance using **Van**

```
Base Price:     ₹80
Distance:       10 km × ₹15 = ₹150
Weight:         5 kg × ₹8 = ₹40
────────────────────────────
Total:          ₹270
```

---

## 🎨 KEY FEATURES

### **1. Parcel-Specific Pricing**
- ✅ Base Price (starting charge)
- ✅ Per KM (distance-based)
- ✅ Per KG (weight-based) ⭐ **Unique to parcels!**
- ✅ Minimum Price (floor price)

### **2. 3D Capacity Management**
- ✅ Max Weight (KG)
- ✅ Max Length (CM)
- ✅ Max Width (CM)
- ✅ Max Height (CM)

### **3. Multi-View Icons**
- ✅ Side View (blue) - Required
- ✅ Top View (green) - Optional
- ✅ Front View (purple) - Optional

### **4. Live Preview**
- See instant price calculation
- Example: 5kg parcel, 10km
- Validates before saving

---

## 🚚 VEHICLE TYPES TO ADD

### **Common Delivery Vehicles:**

**1. Bike/Scooter** 🏍️
```
Use: Documents, small parcels
Weight: 5-10 kg
Size: Small boxes, envelopes
```

**2. Auto Rickshaw** 🛺
```
Use: Medium parcels
Weight: 20-30 kg
Size: Multiple boxes
```

**3. Van** 🚐
```
Use: E-commerce deliveries
Weight: 50-150 kg
Size: Appliances, multiple orders
```

**4. Pickup Truck** 🚚
```
Use: Furniture, large items
Weight: 200-500 kg
Size: Bulky deliveries
```

**5. Mini Truck/Tempo** 🚛
```
Use: Commercial, B2B
Weight: 500-1500 kg
Size: Bulk orders, wholesale
```

**6. Refrigerated Van** 🧊
```
Use: Perishable items
Weight: 100 kg
Features: Temperature controlled
```

---

## 🎯 USE CASES

### **E-commerce Delivery:**
```
Vehicle: Van
Pricing: Medium base, per kg important
Capacity: 100 kg, 150×100×100 cm
Features: Multiple Stops, Fragile Items
```

### **Document Courier:**
```
Vehicle: Bike
Pricing: Low base, quick turnaround
Capacity: 5 kg, 50×40×40 cm
Features: Fast, Same Day, Secure
```

### **Furniture Delivery:**
```
Vehicle: Truck
Pricing: High base, includes labor
Capacity: 500 kg, 300×180×200 cm
Features: Loading Help, Careful Handling
```

### **Food Delivery (Catering):**
```
Vehicle: Refrigerated Van
Pricing: Premium for temperature control
Capacity: 50 kg, refrigerated
Features: Cold Chain, Hygienic, Fast
```

---

## 📱 HOW IT LOOKS

### **Vehicle Card Example:**

```
┌─────────────────────────────────────┐
│  🚐     Pikkar Van                  │
│  • •    Medium parcels & packages   │
│         [Active]                    │
├─────────────────────────────────────┤
│  Base Price:    ₹80                 │
│  Per KM:        ₹15                 │
│  Per KG:        ₹8                  │
│  Min Price:     ₹120                │
├─────────────────────────────────────┤
│  📦 Max 100 kg                      │
│  📏 150 × 100 × 100 cm              │
├─────────────────────────────────────┤
│  [Multiple Stops] [Fragile Items]  │
│  [Secure]                           │
├─────────────────────────────────────┤
│  Deliveries: 1,800                  │
│  Revenue: ₹285k                     │
├─────────────────────────────────────┤
│  [Edit]          [Disable]          │
└─────────────────────────────────────┘
```

---

## ⚙️ CONFIGURATION TIPS

### **Pricing Strategy:**

**Budget Delivery:**
- Low base price
- Competitive per km
- Moderate per kg
- Attract price-sensitive customers

**Premium Delivery:**
- Higher base price
- Includes extras (loading, care)
- Same per km/kg
- Better service quality

**Weight-Based:**
- Lower base
- Standard per km
- **High per kg** ⭐
- Optimized for heavy items

### **Capacity Planning:**

**Overestimate slightly:**
```
If actual max is 95 kg → Set 100 kg
If actual max is 145 cm → Set 150 cm
```
Gives buffer for safe delivery.

**Standard Sizes:**
```
Small:  50 × 40 × 40 cm (10 kg)
Medium: 100 × 80 × 80 cm (50 kg)
Large:  150 × 120 × 120 cm (100 kg)
XLarge: 300 × 180 × 200 cm (500 kg)
```

---

## ❓ FAQ

**Q: Difference between this and Vehicle Pricing page?**
A: 
- **Vehicle Pricing** = Ride vehicles (passengers)
- **Parcel Vehicles** = Delivery vehicles (packages)

**Q: Do I need both pages?**
A: 
- If you offer **rides + deliveries** = Use both
- If **only rides** = Use Vehicle Pricing
- If **only deliveries** = Use Parcel Vehicles

**Q: Can same physical vehicle be on both pages?**
A: Yes! Example: A van can be on both:
- Vehicle Pricing (for passenger rides)
- Parcel Vehicles (for package deliveries)

**Q: How is weight charged?**
A: 
```
Weight × Per KG Rate
Example: 5 kg × ₹8 = ₹40
```

**Q: What if parcel is too big?**
A: The app should show only vehicles that can fit:
```
if (parcel.weight <= vehicle.maxWeight &&
    parcel.length <= vehicle.maxLength &&
    parcel.width <= vehicle.maxWidth &&
    parcel.height <= vehicle.maxHeight) {
  // Show this vehicle option
}
```

**Q: Can I disable weight pricing?**
A: Yes, set "Per KG" to ₹0. Then only distance matters.

**Q: Can I have volume-based pricing?**
A: Current system is weight + distance. For volume:
```
Calculate: L × W × H = Volume
Charge: Volume × Rate per cubic cm
(This requires custom backend logic)
```

---

## ✅ CHECKLIST

Before launching parcel service:

- [ ] Add all vehicle types you'll operate
- [ ] Set competitive pricing (research competitors)
- [ ] Set accurate capacity limits
- [ ] Upload professional vehicle icons
- [ ] Test price calculations
- [ ] Verify all vehicles are "Active"
- [ ] Train drivers on capacity limits
- [ ] Set up backend API integration
- [ ] Test booking flow end-to-end
- [ ] Launch! 🚀

---

## 🎊 YOU'RE READY!

**Access now:**
```
http://localhost:3001/dashboard/parcel-vehicles
```

**Quick actions:**
1. Review 4 pre-loaded vehicles
2. Edit pricing to match your market
3. Add your custom vehicle types
4. Upload professional icons
5. Launch parcel service!

---

**Status:** ✅ READY TO USE  
**Time Required:** 5 minutes setup  
**Difficulty:** Easy ⭐⭐☆☆☆

**Start managing your delivery fleet!** 📦🚚✨

