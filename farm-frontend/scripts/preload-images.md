# 🍎 Pre-loading Images Strategy for Farm Companion

## 📋 Overview
This guide helps you systematically upload images for all produce types across all months to ensure comprehensive coverage.

## 🎯 Goal
Have images for every produce type in every month they're in season, plus some off-season images for educational purposes.

## 📊 Produce Types & Seasons

### Current Produce List:
1. **Sweetcorn** - Months 7, 8, 9 (Jul-Sep) - Peak: 8
2. **Tomatoes** - Months 6, 7, 8, 9, 10 (Jun-Oct) - Peak: 7, 8, 9
3. **Strawberries** - Months 5, 6, 7 (May-Jul) - Peak: 6
4. **Blackberries** - Months 7, 8, 9 (Jul-Sep) - Peak: 8
5. **Runner Beans** - Months 7, 8, 9 (Jul-Sep) - Peak: 8
6. **Plums** - Months 8, 9 (Aug-Sep) - Peak: 8
7. **Apples** - Months 8, 9, 10, 11 (Aug-Nov) - Peak: 9, 10
8. **Pumpkins** - Months 9, 10 (Sep-Oct) - Peak: 10

## 📅 Monthly Upload Strategy

### January (Month 1)
- **Focus**: Storage/imported produce
- **Upload**: Apples (storage), any winter produce

### February (Month 2)
- **Focus**: Early spring preparations
- **Upload**: Any early spring produce

### March (Month 3)
- **Focus**: Early spring
- **Upload**: Any early spring produce

### April (Month 4)
- **Focus**: Spring produce
- **Upload**: Any spring produce

### May (Month 5)
- **Focus**: Late spring
- **Upload**: Strawberries (early season)

### June (Month 6)
- **Focus**: Early summer
- **Upload**: 
  - Strawberries (peak season)
  - Tomatoes (early season)

### July (Month 7)
- **Focus**: Mid-summer
- **Upload**:
  - Sweetcorn (early season)
  - Tomatoes (mid-season)
  - Strawberries (late season)
  - Blackberries (early season)
  - Runner Beans (early season)

### August (Month 8)
- **Focus**: Peak summer
- **Upload**:
  - Sweetcorn (peak season)
  - Tomatoes (peak season)
  - Blackberries (peak season)
  - Runner Beans (peak season)
  - Plums (peak season)
  - Apples (early season)

### September (Month 9)
- **Focus**: Late summer/early autumn
- **Upload**:
  - Sweetcorn (late season)
  - Tomatoes (late season)
  - Blackberries (late season)
  - Runner Beans (late season)
  - Plums (late season)
  - Apples (peak season)
  - Pumpkins (early season)

### October (Month 10)
- **Focus**: Autumn
- **Upload**:
  - Tomatoes (very late season)
  - Apples (peak season)
  - Pumpkins (peak season)

### November (Month 11)
- **Focus**: Late autumn
- **Upload**:
  - Apples (late season)

### December (Month 12)
- **Focus**: Winter storage
- **Upload**: Apples (storage), any winter produce

## 🚀 Upload Process

### Step 1: Prepare Images
- **Quality**: High-resolution, well-lit photos
- **Variety**: Different angles, stages of ripeness
- **Quantity**: 3-5 images per produce type per month
- **Format**: JPEG, PNG, or WebP

### Step 2: Upload via Admin Panel
1. Go to `/admin/produce/upload`
2. Select produce type
3. Select month
4. Upload images with descriptive alt text
5. Mark one as primary if desired

### Step 3: Verify Upload
1. Check API: `/api/images?produceSlug=[slug]&month=[month]`
2. Visit seasonal pages to confirm display
3. Test individual produce pages

## 📝 Image Guidelines

### Content Requirements:
- **Fresh produce** in good condition
- **Natural lighting** when possible
- **Clear visibility** of the produce
- **Appealing presentation** that makes people want to buy
- **Seasonal context** (e.g., apples on trees in autumn)

### Technical Requirements:
- **Minimum resolution**: 800x600 pixels
- **File size**: Under 5MB per image
- **Format**: JPEG preferred for photos
- **Alt text**: Descriptive and helpful

### Content to Avoid:
- **Damaged or spoiled produce**
- **Poor lighting or blurry images**
- **Overly processed or artificial-looking photos**
- **Images that don't represent the actual produce**

## 🔄 Maintenance Schedule

### Monthly Tasks:
- **Review current month's images** for quality
- **Upload new images** for upcoming months
- **Update any outdated images** as needed

### Seasonal Tasks:
- **Audit all images** for each produce type
- **Replace low-quality images** with better ones
- **Add variety** to image collections

## 📈 Success Metrics

### Coverage Goals:
- **100% coverage** for in-season months
- **At least 3 images** per produce type per month
- **High-quality images** that showcase the produce well

### Quality Goals:
- **Clear, appealing images** that encourage purchases
- **Accurate representation** of the produce
- **Consistent style** across all images

## 🛠️ Tools & Resources

### Upload Tools:
- **Admin Panel**: `/admin/produce/upload`
- **API Testing**: Use curl or Postman
- **Image Editor**: For basic cropping/editing

### Monitoring:
- **API Endpoints**: Check image availability
- **Frontend Pages**: Verify display
- **User Feedback**: Monitor for issues

## 🎯 Priority Order

### Phase 1: Peak Season Coverage
1. August (month 8) - Most produce types
2. September (month 9) - Many produce types
3. July (month 7) - Good variety

### Phase 2: Full Season Coverage
1. Complete all in-season months for each produce
2. Add variety within each month
3. Ensure consistent quality

### Phase 3: Off-Season Coverage
1. Add storage/imported images for off-season
2. Educational content for year-round learning
3. Preparation/planning content

## 📞 Support

If you encounter issues:
1. Check API logs for errors
2. Verify image format and size
3. Test with different browsers
4. Contact support if needed

---

**Remember**: Quality over quantity. Better to have fewer high-quality images than many poor ones.
