import { MenuItem } from './types';

export const INITIAL_MENU: Omit<MenuItem, 'id'>[] = [
  {
    name: '熟成紅茶',
    category: '熟成系列',
    priceM: 25,
    priceL: 30,
    description: '經典熟成風味，果香濃郁',
    isAvailable: true
  },
  {
    name: '麗春紅茶',
    category: '熟成系列',
    priceM: 25,
    priceL: 30,
    description: '花香調性，清爽不澀',
    isAvailable: true
  },
  {
    name: '太妃紅茶',
    category: '熟成系列',
    priceM: 30,
    priceL: 35,
    description: '太妃糖香氣，甜而不膩',
    isAvailable: true
  },
  {
    name: '胭脂紅茶',
    category: '熟成系列',
    priceM: 35,
    priceL: 40,
    description: '水蜜桃香氣，少女心爆發',
    isAvailable: true
  },
  {
    name: '雪花冷露',
    category: '冷露系列',
    priceM: 25,
    priceL: 30,
    description: '冬瓜茶清甜，消暑首選',
    isAvailable: true
  },
  {
    name: '露墨',
    category: '冷露系列',
    priceM: 25,
    priceL: 30,
    description: '冬瓜紅茶，經典復刻',
    isAvailable: true
  },
  {
    name: '熟成歐蕾',
    category: '歐蕾系列',
    priceM: 40,
    priceL: 50,
    description: '鮮奶與熟成紅茶的完美比例',
    isAvailable: true
  },
  {
    name: '白玉歐蕾',
    category: '歐蕾系列',
    priceM: 50,
    priceL: 60,
    description: 'Q彈白玉珍珠，口感豐富',
    isAvailable: true
  }
];

export const ICE_LEVELS = ['正常冰', '少冰', '微冰', '去冰', '完全去冰'];
export const SUGAR_LEVELS = ['正常糖', '七分糖', '半糖', '三分糖', '微糖', '無糖'];
