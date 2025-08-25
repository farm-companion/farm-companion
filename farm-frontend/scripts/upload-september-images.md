# 🍂 September Image Upload Guide

## 🎯 Immediate Goal
Upload images for all produce types that are in season during September (Month 9).

## 📊 September Produce List

### Primary Focus (In Season):
1. **Sweetcorn** - Late season, still available
2. **Tomatoes** - Late season, still available  
3. **Blackberries** - Late season, still available
4. **Runner Beans** - Late season, still available
5. **Plums** - Late season, still available
6. **Apples** - **PEAK SEASON** 🎯
7. **Pumpkins** - Early season, starting to appear

## 🚀 Quick Upload Checklist

### Step 1: Prepare Images
- [ ] **Apples** (3-5 images) - Peak season, focus on variety
- [ ] **Pumpkins** (3-5 images) - Early season, small pumpkins
- [ ] **Sweetcorn** (2-3 images) - Late season, mature cobs
- [ ] **Tomatoes** (2-3 images) - Late season, ripening
- [ ] **Blackberries** (2-3 images) - Late season, dark berries
- [ ] **Runner Beans** (2-3 images) - Late season, mature pods
- [ ] **Plums** (2-3 images) - Late season, ripe fruit

### Step 2: Upload Process
For each produce type:

1. **Go to**: `/admin/produce/upload`
2. **Select Produce**: [produce name]
3. **Select Month**: 9 (September)
4. **Alt Text**: Descriptive text like "Fresh September apples from local orchard"
5. **Upload**: 2-5 high-quality images
6. **Mark Primary**: Choose the best image as primary
7. **Submit**: Upload and verify

### Step 3: Verification
After each upload, verify:
- [ ] API returns images: `/api/images?produceSlug=[slug]&month=9`
- [ ] Images appear on seasonal page: `/seasonal`
- [ ] Images appear on individual page: `/seasonal/[slug]`

## 📝 Image Suggestions by Produce

### 🍎 Apples (PEAK SEASON)
- **Varieties**: Different apple types (Bramley, Cox, etc.)
- **Context**: On trees, in baskets, at farm shops
- **Quality**: Bright, fresh, appealing
- **Quantity**: 5 images recommended

### 🎃 Pumpkins (EARLY SEASON)
- **Size**: Small to medium pumpkins
- **Context**: In fields, at farm shops, early harvest
- **Quality**: Fresh, unblemished
- **Quantity**: 3-4 images recommended

### 🌽 Sweetcorn (LATE SEASON)
- **Stage**: Mature, fully developed cobs
- **Context**: In fields, harvested, at markets
- **Quality**: Golden kernels, fresh husks
- **Quantity**: 2-3 images recommended

### 🍅 Tomatoes (LATE SEASON)
- **Stage**: Ripening, some green, some red
- **Context**: On vines, harvested, at markets
- **Quality**: Natural ripening process
- **Quantity**: 2-3 images recommended

### 🫐 Blackberries (LATE SEASON)
- **Stage**: Dark, ripe berries
- **Context**: On bushes, harvested, at markets
- **Quality**: Deep color, fresh appearance
- **Quantity**: 2-3 images recommended

### 🫘 Runner Beans (LATE SEASON)
- **Stage**: Mature, long pods
- **Context**: On plants, harvested, at markets
- **Quality**: Fresh, green, crisp
- **Quantity**: 2-3 images recommended

### 🍑 Plums (LATE SEASON)
- **Stage**: Ripe, colorful fruit
- **Context**: On trees, harvested, at markets
- **Quality**: Rich colors, fresh appearance
- **Quantity**: 2-3 images recommended

## 🔄 Quick Upload Commands

### Test API for September Images:
```bash
# Check existing September images
curl "https://farm-produce-images-e26nfxge7-abdur-rahman-morris-projects.vercel.app/api/images?produceSlug=apples&month=9"

# Check all produce types for September
curl "https://farm-produce-images-e26nfxge7-abdur-rahman-morris-projects.vercel.app/api/images?month=9"
```

### Upload Test Image (if needed):
```bash
# Upload test image for September apples
curl -X POST https://farm-produce-images-e26nfxge7-abdur-rahman-morris-projects.vercel.app/api/upload \
  -F "images=@test-image.jpg" \
  -F "produceSlug=apples" \
  -F "month=9" \
  -F "alt=Fresh September apples" \
  -F "isPrimary=false"
```

## 📈 Success Metrics

### Coverage Goals:
- [ ] **Apples**: 5 images (peak season)
- [ ] **Pumpkins**: 3-4 images (early season)
- [ ] **All other produce**: 2-3 images each
- [ ] **Total**: 20+ images for September

### Quality Goals:
- [ ] All images are high-quality and appealing
- [ ] Alt text is descriptive and helpful
- [ ] Images represent September conditions
- [ ] Variety in angles and presentation

## 🎯 Next Steps After September

### October (Month 10):
- **Focus**: Apples (peak), Pumpkins (peak), Tomatoes (very late)
- **Priority**: High - peak season for key produce

### November (Month 11):
- **Focus**: Apples (late season)
- **Priority**: Medium - limited produce

### December (Month 12):
- **Focus**: Storage apples, winter produce
- **Priority**: Low - planning for next year

## 💡 Tips for Success

1. **Start with Apples** - Peak season, most important
2. **Use natural lighting** - Best for food photography
3. **Show variety** - Different types, stages, presentations
4. **Include context** - Farm shops, markets, fields
5. **Test immediately** - Verify uploads work before moving on

---

**Remember**: September is a key month with many produce types in season. Focus on quality over quantity, especially for apples which are at peak season.
