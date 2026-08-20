import checklist from "@/data/stickers.json";

const order = new Map(checklist.map((sticker, index) => [`${sticker.section}\u0000${sticker.code}`, index]));

export function sortByChecklist<T extends { team: string; number: string }>(stickers: T[]): T[] {
  return [...stickers].sort((a, b) => {
    const aPosition = order.get(`${a.team}\u0000${a.number}`) ?? Number.MAX_SAFE_INTEGER;
    const bPosition = order.get(`${b.team}\u0000${b.number}`) ?? Number.MAX_SAFE_INTEGER;
    return aPosition - bPosition;
  });
}
