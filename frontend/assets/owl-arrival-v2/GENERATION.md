# Whole-owl arrival frame study v2

Generated with the built-in image generator from the existing `arrival-v1/midstroke.webp` owl reference. Two 2 × 2 transparent atlases keep the same owl, frontal camera and body scale while changing wing articulation. They are stored here as source studies; the runtime copies are in `public/assets/owl/arrival-v2/`.

The eight tile eye midpoints were measured from blue-iris pixels. The flight cycle is ordered by the mean vertical position of opaque pixels at the outer edges of both wings, descending from the raised pose and returning through the same poses. Runtime interpolation crossfades between registered whole-owl frames. The old v1 atlas still supplies the final landing and perch poses.

The source prompt asked for a registered 4 × 4 sheet of the same complete snowy owl, changing only wing position through a chronological flap cycle, with real transparency, no backdrop or props, and consistent eye placement. The generated atlas was visually inspected before use. Original v1 frames remain intact.
