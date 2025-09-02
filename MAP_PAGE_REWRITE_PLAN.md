# 🗺️ MAP PAGE COMPLETE REWRITE - TASKMASTER PLAN

## 🎯 OBJECTIVE
Completely remove and rewrite the map page to create a clean, reliable Google Maps implementation without any legacy code or conflicting dependencies.

## 📋 PHASE 1: COMPLETE CLEANUP (Day 1)

### Task 1.1: Remove All Existing Map Components
- [ ] **Delete** `src/components/GoogleMapComponent.tsx`
- [ ] **Delete** `src/components/SmartMapComponent.tsx`
- [ ] **Delete** `src/components/VirtualizedFarmList.tsx`
- [ ] **Delete** `src/components/ResponsiveInfoWindow.tsx`
- [ ] **Delete** `src/components/FarmSearchBar.tsx`
- [ ] **Delete** `src/components/FarmDetailSheet.tsx`
- [ ] **Remove** any map-related imports from other components

### Task 1.2: Clean Up Map Page
- [ ] **Backup** current `/map` page
- [ ] **Create** minimal placeholder map page
- [ ] **Remove** all complex map logic
- [ ] **Remove** all map-related state management

### Task 1.3: Remove Map Dependencies
- [ ] **Check** `package.json` for map-related packages
- [ ] **Remove** `@vis.gl/react-google-maps` if not needed elsewhere
- [ ] **Remove** any other map-specific dependencies
- [ ] **Clean** `node_modules` and reinstall

### Task 1.4: Clean Up API Routes
- [ ] **Review** `/api/farms/route.ts` for map-specific logic
- [ ] **Simplify** farm data structure if needed
- [ ] **Remove** any map-specific API endpoints

## 📋 PHASE 2: NEW MAP ARCHITECTURE (Day 2)

### Task 2.1: Plan New Map Structure
- [ ] **Design** simple, clean map component architecture
- [ ] **Plan** farm marker system
- [ ] **Plan** search and filtering
- [ ] **Plan** responsive design

### Task 2.2: Set Up Google Maps Integration
- [ ] **Verify** Google Maps API key is working
- [ ] **Test** basic Google Maps loading
- [ ] **Configure** proper map styling
- [ ] **Set up** error handling for map loading

### Task 2.3: Create Basic Map Component
- [ ] **Create** `src/components/Map.tsx` (simple, clean)
- [ ] **Implement** basic map rendering
- [ ] **Add** proper TypeScript types
- [ ] **Test** map loads correctly

## 📋 PHASE 3: FARM MARKERS & DATA (Day 3)

### Task 3.1: Farm Data Integration
- [ ] **Load** farm data from JSON file
- [ ] **Create** farm marker component
- [ ] **Add** markers to map
- [ ] **Test** markers display correctly

### Task 3.2: Farm Information Display
- [ ] **Create** simple farm info popup
- [ ] **Display** farm name, location, description
- [ ] **Add** link to farm detail page
- [ ] **Test** popup functionality

### Task 3.3: Search & Filtering
- [ ] **Create** simple search input
- [ ] **Implement** farm name search
- [ ] **Add** location-based filtering
- [ ] **Test** search functionality

## 📋 PHASE 4: ENHANCEMENTS & POLISH (Day 4)

### Task 4.1: User Experience
- [ ] **Add** loading states
- [ ] **Add** error handling
- [ ] **Add** "no results" states
- [ ] **Test** all user flows

### Task 4.2: Performance Optimization
- [ ] **Optimize** marker rendering
- [ ] **Add** lazy loading for farm data
- [ ] **Implement** efficient search
- [ ] **Test** performance on mobile

### Task 4.3: Final Testing & Deployment
- [ ] **Test** on all devices
- [ ] **Test** all browsers
- [ ] **Test** map interactions
- [ ] **Deploy** and verify

## 🎯 SUCCESS CRITERIA

### ✅ Technical Requirements
- [ ] Map loads reliably without errors
- [ ] Farm markers display correctly
- [ ] Search functionality works
- [ ] Responsive design works on all devices
- [ ] No console errors
- [ ] Fast loading times

### ✅ User Experience Requirements
- [ ] Intuitive map navigation
- [ ] Easy farm discovery
- [ ] Clear farm information
- [ ] Smooth interactions
- [ ] Accessible design

### ✅ Code Quality Requirements
- [ ] Clean, readable code
- [ ] Proper TypeScript types
- [ ] No unused dependencies
- [ ] Proper error handling
- [ ] Good performance

## 🚀 EXECUTION COMMANDS

```bash
# Phase 1: Cleanup
rm src/components/GoogleMapComponent.tsx
rm src/components/SmartMapComponent.tsx
rm src/components/VirtualizedFarmList.tsx
rm src/components/ResponsiveInfoWindow.tsx
rm src/components/FarmSearchBar.tsx
rm src/components/FarmDetailSheet.tsx

# Phase 2: New Implementation
npm install @googlemaps/js-api-loader
# Create new Map.tsx component
# Test basic map loading

# Phase 3: Add Features
# Add farm markers
# Add search functionality
# Add farm info popups

# Phase 4: Polish & Deploy
npm run build
npm run test
git add . && git commit -m "Complete map page rewrite"
git push origin fix/contact-page-reliability
```

## 📝 NOTES

- **Keep it simple**: Start with basic functionality and add features incrementally
- **Test frequently**: Test each phase before moving to the next
- **Document changes**: Keep track of what we remove and what we add
- **Backup everything**: Keep backups of the old code in case we need to reference it

## 🎯 READY TO START?

This plan will give us a clean, reliable map page without any legacy issues. Each phase builds on the previous one, ensuring we have a solid foundation.

**Shall we begin with Phase 1: Complete Cleanup?**
