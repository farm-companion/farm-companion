/**
 * Map feature library exports
 */

export {
  CLUSTER_TIERS,
  CLUSTER_ZOOM_THRESHOLDS,
  CLUSTER_EASING,
  getClusterTier,
  getZoomAwareSize,
  generateClusterSVG,
  createSmartClusterRenderer,
  getClusterTargetZoom,
  animateZoomTo,
  getClusterAnimationClass,
  type ClusterTier,
} from './cluster-config'

export {
  CATEGORY_PINS,
  DEFAULT_PIN,
  getPinForFarm,
  generateCategoryMarkerSVG,
  type CategoryPinConfig,
} from './pin-icons'
