# Animation Audit - Apple Design Philosophy

## Current State
- Total animation instances: 669
- Excessive animations (pulse/bounce/ping): 37
- Hover transforms: 58

## Apple Philosophy: Purposeful Motion Only
Animations should:
- Provide feedback for user actions
- Guide attention to important changes
- Smooth state transitions
- Be subtle and respectful of user time

Animations should NOT:
- Be decorative or "fun"
- Compete for attention
- Pulse indefinitely without purpose
- Scale/rotate/bounce unnecessarily

## Keep (Purposeful)
✅ Loading skeletons (animate-pulse)
✅ Spinner animations (animate-spin)
✅ Fade-in on mount (fade-in)
✅ Button/link hover feedback (simple opacity/color change)
✅ Focus states (ring transitions)
✅ Accordion expand/collapse
✅ Modal enter/exit

## Remove (Excessive)
❌ Decorative background pulses (radial gradients)
❌ Pulse on static badges ("Best This Month")
❌ Ping animations (attention-grabbing noise)
❌ Bounce animations (too playful)
❌ Multiple transforms on hover (scale + translate + rotate)
❌ Pulse on decorative dots
❌ Competing transitions on same element

## Implementation
1. Remove decorative animate-pulse from backgrounds
2. Simplify hover states to color/opacity only
3. Remove pulse from static content
4. Keep loading states and essential feedback
5. Document approved animation patterns
