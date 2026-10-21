/* ============================================================
   The map. The walk runs down one street, away from you along -z,
   and time runs with it: 1940 at the wall, May 1943 at the far end.
   Every module reads its positions from here.
   ============================================================ */

export const PLAN = {
  half: 8,                                   // from the middle of the street to the house fronts
  book: { z: 6, y: 5.2 },                    // the cover hangs above the street; you come down through it
  wallZ: -60,                                // the wall across the street
  /* a ladder against it: where it stands, how it leans (metres back for each metre up), its first rung, the top of the wall */
  ladder: { x: 0.9, z0: -58.4, lean: -0.43, c0: 0.25, top: 3.2 },
  cross: { z0: -187, z1: -163 },             // Chłodna Street, outside the ghetto, under the bridge
  bridge: { stairA: -147, deckA: -159, deckB: -191, stairB: -203, y: 5.6 },
  yard: { x0: 8, x1: 36, z0: -320, z1: -250, trackX: 25 },   // Umschlagplatz
  bunker1: { x0: -7.7, x1: -5.3, stairTop: -362, stairBot: -372, roomEnd: -398, tunnelEnd: -436, exitTop: -446, floor: -3.4 },
  battle: { z0: -452, z1: -545, columnZ: -530 },
  mila: { z0: -512, z1: -498, z: -505 },                       // Miła Street, where it crosses Zamenhofa
  square: { z0: -606, z1: -549, half: 40, flagZ: -578 },       // Muranowski Square
  /* Świętojerska, at the brushmakers' block: the mine goes off here on 20 April */
  brush: { z0: -606, z1: -646, blast: [2.6, 1.7, -626.5] },
  burn: { z0: -646, z1: -700 },
  bunker2: { x0: -7.7, x1: -5.3, stairTop: -702, stairBot: -712, roomEnd: -738, exitTop: -748, floor: -3.6 },
  ruinZ: -765,
  synagogue: { x: -58, z: -806 },
  field: { z0: -850, z1: -1010 },
  mound: { z: -986 },
};

/* What the fire has done to a house standing at z. r is the house's own luck. */
export function fate(z, r) {
  const P = PLAN;
  if (z > P.battle.z0) return { burn: 0, ruin: 0 };
  if (z > P.battle.z1) return { burn: r < 0.4 ? 0.3 + r * 0.6 : 0.04, ruin: 0 };
  if (z > P.square.z0) return { burn: 0.3 + r * 0.45, ruin: r * 0.12 };
  if (z > P.brush.z1) return { burn: 0.06 + r * 0.14, ruin: r * 0.03 };
  if (z > P.burn.z1) {
    const t = (P.burn.z0 - z) / (P.burn.z0 - P.burn.z1);
    return { burn: 0.75 + 0.25 * r, ruin: Math.min(0.8, t * 0.5 + r * 0.18) };
  }
  if (z > P.ruinZ) return { burn: 0.5, ruin: 0.6 + r * 0.3 };
  return { burn: 0.2, ruin: 0.86 + r * 0.1 };
}
