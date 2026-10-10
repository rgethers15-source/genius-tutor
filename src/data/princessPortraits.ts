/** Original cinematic royal portraits; learner-uploaded gallery art takes priority. */
export function princessPortrait(index: number): string {
 return `./royal/guide-${Math.max(0,Math.min(7,index))}.webp`;
}
