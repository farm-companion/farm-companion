"""
Simple description generator for Google Places data.
Provides basic enhancement functions for place data.
"""

def enhance_place_data_with_description(place: dict) -> dict:
    """
    Enhance place data with basic description and offerings.
    
    Args:
        place: Dictionary containing place data from Google Places API
        
    Returns:
        Enhanced place data with additional fields
    """
    # Create a copy to avoid modifying the original
    enhanced = place.copy()
    
    # Add basic description if not present
    if 'description' not in enhanced:
        name = enhanced.get('name', 'Farm Shop')
        types = enhanced.get('types', [])
        
        # Generate a simple description based on types
        if 'farm' in types or 'farm_shop' in types:
            enhanced['description'] = f"{name} offers fresh, locally-sourced produce and farm products."
        elif 'food' in types:
            enhanced['description'] = f"{name} provides quality food products and farm-fresh ingredients."
        else:
            enhanced['description'] = f"{name} offers a variety of local products and farm goods."
    
    # Ensure offerings field exists
    if 'offerings' not in enhanced:
        enhanced['offerings'] = []
    
    # Add basic offerings based on types if none exist
    if not enhanced['offerings']:
        if 'farm' in types or 'farm_shop' in types:
            enhanced['offerings'].extend(['Fresh Produce', 'Local Products', 'Farm Goods'])
        elif 'food' in types:
            enhanced['offerings'].extend(['Food Products', 'Local Ingredients'])
    
    return enhanced
