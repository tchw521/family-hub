// 家族关系计算 - 五服 + 详细称谓系统
// 五服：传统中国家族关系体系，用于区分亲疏远近

export type RelationLevel = 0 | 1 | 2 | 3 | 4 | 5 // 0=自己, 1-5=五服, 6+=五服之外

export interface RelationInfo {
  label: string          // 显示称谓（如"舅舅"）
  reverseLabel: string   // 反向称谓（如"外甥"）
  level: RelationLevel   // 五服代数
  side: 'paternal' | 'maternal' | 'spouse' | 'self'
  gender?: 'male' | 'female'
}

// 完整关系映射表（包含所有常见称谓）
const RELATION_MAP: Record<string, RelationInfo> = {
  // ===== 自己 =====
  'self': { label: '自己', reverseLabel: '自己', level: 0, side: 'self' },

  // ===== 一服：直系血亲 =====
  'father': { label: '父亲', reverseLabel: '儿子/女儿', level: 1, side: 'paternal', gender: 'male' },
  'mother': { label: '母亲', reverseLabel: '儿子/女儿', level: 1, side: 'maternal', gender: 'female' },
  'son': { label: '儿子', reverseLabel: '父亲/母亲', level: 1, side: 'self', gender: 'male' },
  'daughter': { label: '女儿', reverseLabel: '父亲/母亲', level: 1, side: 'self', gender: 'female' },
  'husband': { label: '丈夫', reverseLabel: '妻子', level: 1, side: 'spouse', gender: 'male' },
  'wife': { label: '妻子', reverseLabel: '丈夫', level: 1, side: 'spouse', gender: 'female' },

  // ===== 二服：祖孙/兄弟姐妹 =====
  'grandfather_p': { label: '爷爷', reverseLabel: '孙子/孙女', level: 2, side: 'paternal', gender: 'male' },
  'grandmother_p': { label: '奶奶', reverseLabel: '孙子/孙女', level: 2, side: 'paternal', gender: 'female' },
  'grandfather_m': { label: '外公', reverseLabel: '外孙/外孙女', level: 2, side: 'maternal', gender: 'male' },
  'grandmother_m': { label: '外婆', reverseLabel: '外孙/外孙女', level: 2, side: 'maternal', gender: 'female' },
  'brother_older': { label: '哥哥', reverseLabel: '弟弟/妹妹', level: 2, side: 'self', gender: 'male' },
  'brother_younger': { label: '弟弟', reverseLabel: '哥哥/姐姐', level: 2, side: 'self', gender: 'male' },
  'sister_older': { label: '姐姐', reverseLabel: '弟弟/妹妹', level: 2, side: 'self', gender: 'female' },
  'sister_younger': { label: '妹妹', reverseLabel: '哥哥/姐姐', level: 2, side: 'self', gender: 'female' },
  'brother': { label: '哥哥', reverseLabel: '弟弟/妹妹', level: 2, side: 'self', gender: 'male' },
  'sister': { label: '姐姐', reverseLabel: '弟弟/妹妹', level: 2, side: 'self', gender: 'female' },
  'grandson': { label: '孙子', reverseLabel: '爷爷/奶奶', level: 2, side: 'self', gender: 'male' },
  'granddaughter': { label: '孙女', reverseLabel: '爷爷/奶奶', level: 2, side: 'self', gender: 'female' },

  // ===== 三服：曾祖/伯叔姑舅姨/曾孙 =====
  'great_grandfather_p': { label: '曾祖父', reverseLabel: '玄孙/玄孙女', level: 3, side: 'paternal', gender: 'male' },
  'great_grandmother_p': { label: '曾祖母', reverseLabel: '玄孙/玄孙女', level: 3, side: 'paternal', gender: 'female' },
  'great_grandfather_m': { label: '外曾祖父', reverseLabel: '外玄孙/外玄孙女', level: 3, side: 'maternal', gender: 'male' },
  'great_grandmother_m': { label: '外曾祖母', reverseLabel: '外玄孙/外玄孙女', level: 3, side: 'maternal', gender: 'female' },
  'uncle_p_older': { label: '伯父', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
  'uncle_p_younger': { label: '叔叔', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
  'uncle_p': { label: '叔叔', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
  'aunt_p_older': { label: '姑妈', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'aunt_p_younger': { label: '姑姑', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'aunt_p': { label: '姑姑', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'uncle_m': { label: '舅舅', reverseLabel: '外甥/外甥女', level: 3, side: 'maternal', gender: 'male' },
  'aunt_m': { label: '阿姨', reverseLabel: '外甥/外甥女', level: 3, side: 'maternal', gender: 'female' },
  'great_uncle': { label: '舅爷爷', reverseLabel: '表侄/表侄女', level: 3, side: 'maternal', gender: 'male' },
  'great_aunt': { label: '姑奶奶', reverseLabel: '表侄/表侄女', level: 3, side: 'paternal', gender: 'female' },
  'great_aunt_m': { label: '舅奶奶', reverseLabel: '表侄/表侄女', level: 3, side: 'maternal', gender: 'female' },
  'great_nephew': { label: '外甥孙', reverseLabel: '舅舅/舅妈', level: 3, side: 'maternal', gender: 'male' },
  'great_niece': { label: '外甥孙女', reverseLabel: '舅舅/舅妈', level: 3, side: 'maternal', gender: 'female' },
  'nephew': { label: '侄子', reverseLabel: '叔叔/伯伯', level: 3, side: 'paternal', gender: 'male' },
  'niece': { label: '侄女', reverseLabel: '叔叔/伯伯', level: 3, side: 'paternal', gender: 'female' },
  'grandnephew': { label: '侄孙', reverseLabel: '伯叔', level: 3, side: 'paternal', gender: 'male' },
  'grandniece': { label: '侄孙女', reverseLabel: '伯叔', level: 3, side: 'paternal', gender: 'female' },

  // ===== 四服：高祖/堂兄弟姐妹/玄孙 =====
  'greatgreat_grandfather': { label: '高祖父', reverseLabel: '后代', level: 4, side: 'paternal', gender: 'male' },
  'greatgreat_grandmother': { label: '高祖母', reverseLabel: '后代', level: 4, side: 'paternal', gender: 'female' },
  'cousin_p_older_male': { label: '堂哥', reverseLabel: '堂弟/堂妹', level: 4, side: 'paternal', gender: 'male' },
  'cousin_p_younger_male': { label: '堂弟', reverseLabel: '堂哥/堂姐', level: 4, side: 'paternal', gender: 'male' },
  'cousin_p_older_female': { label: '堂姐', reverseLabel: '堂弟/堂妹', level: 4, side: 'paternal', gender: 'female' },
  'cousin_p_younger_female': { label: '堂妹', reverseLabel: '堂哥/堂姐', level: 4, side: 'paternal', gender: 'female' },
  'cousin_p': { label: '堂兄弟', reverseLabel: '堂兄弟', level: 4, side: 'paternal', gender: 'male' },
  'cousin_m_older_male': { label: '表哥', reverseLabel: '表弟/表妹', level: 4, side: 'maternal', gender: 'male' },
  'cousin_m_younger_male': { label: '表弟', reverseLabel: '表姐/表妹', level: 4, side: 'maternal', gender: 'male' },
  'cousin_m_older_female': { label: '表姐', reverseLabel: '表弟/表妹', level: 4, side: 'maternal', gender: 'female' },
  'cousin_m_younger_female': { label: '表妹', reverseLabel: '表姐/表哥', level: 4, side: 'maternal', gender: 'female' },
  'cousin_m': { label: '表兄弟姐妹', reverseLabel: '表兄弟姐妹', level: 4, side: 'maternal' },
  'great_nephew_2': { label: '外曾孙', reverseLabel: '太外公', level: 4, side: 'maternal', gender: 'male' },
  'great_niece_2': { label: '外曾孙女', reverseLabel: '太外公', level: 4, side: 'maternal', gender: 'female' },

  // ===== 配偶方的亲属 =====
  'spouse_father': { label: '岳父/公公', reverseLabel: '女婿/儿媳', level: 1, side: 'spouse', gender: 'male' },
  'spouse_mother': { label: '岳母/婆婆', reverseLabel: '女婿/儿媳', level: 1, side: 'spouse', gender: 'female' },
  'spouse_brother_older': { label: '大舅子/大伯子', reverseLabel: '妹夫/弟媳', level: 2, side: 'spouse', gender: 'male' },
  'spouse_brother_younger': { label: '小舅子/小叔子', reverseLabel: '姐夫/嫂子', level: 2, side: 'spouse', gender: 'male' },
  'spouse_sister_older': { label: '大姨子/大姑子', reverseLabel: '妹夫/弟媳', level: 2, side: 'spouse', gender: 'female' },
  'spouse_sister_younger': { label: '小姨子/小姑子', reverseLabel: '姐夫/嫂子', level: 2, side: 'spouse', gender: 'female' },
  'spouse_uncle': { label: '伯丈/叔丈', reverseLabel: '侄女婿', level: 3, side: 'spouse', gender: 'male' },
  'spouse_aunt': { label: '姑丈/姨丈', reverseLabel: '侄女婿', level: 3, side: 'spouse', gender: 'male' },

  // ===== 常见复合称呼 =====
  'jiùmā': { label: '舅妈', reverseLabel: '外甥/外甥女', level: 3, side: 'maternal', gender: 'female' },
  'gūmā': { label: '姑妈', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'yímā': { label: '姨妈', reverseLabel: '外甥/外甥女', level: 3, side: 'maternal', gender: 'female' },
  'bómā': { label: '伯母', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'shěnmā': { label: '婶婶', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'female' },
  'gūnǎinai': { label: '姑奶奶', reverseLabel: '表侄/表侄女', level: 3, side: 'paternal', gender: 'female' },
  'jiùnǎinai': { label: '舅奶奶', reverseLabel: '表侄/表侄女', level: 3, side: 'maternal', gender: 'female' },
  'yí父': { label: '姨父', reverseLabel: '外甥/外甥女', level: 3, side: 'maternal', gender: 'male' },
  'gūfù': { label: '姑父', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
  'bófu': { label: '伯父', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
  'shěnfù': { label: '叔父', reverseLabel: '侄子/侄女', level: 3, side: 'paternal', gender: 'male' },
}

// 中文关系名到英文 key 的映射
const RELATION_KEY_MAP: Record<string, string> = {
  '父亲': 'father', '妈妈': 'mother', '母亲': 'mother',
  '老公': 'husband', '丈夫': 'husband', '老婆': 'wife', '妻子': 'wife',
  '儿子': 'son', '女儿': 'daughter',
  '爷爷': 'grandfather_p', '奶奶': 'grandmother_p',
  '外公': 'grandfather_m', '外婆': 'grandmother_m',
  '哥哥': 'brother', '弟弟': 'brother_younger',
  '姐姐': 'sister', '妹妹': 'sister_younger',
  '叔叔': 'uncle_p', '伯父': 'uncle_p_older', '伯伯': 'uncle_p_older',
  '姑姑': 'aunt_p', '姑妈': 'aunt_p_older',
  '舅舅': 'uncle_m', '舅妈': 'jiùmā',
  '阿姨': 'aunt_m', '姨妈': 'aunt_m', '姨父': 'yí父',
  '侄子': 'nephew', '侄女': 'niece',
  '外甥': 'nephew', '外甥女': 'niece',
  '孙子': 'grandson', '孙女': 'granddaughter',
  '外孙': 'grandson', '外孙女': 'granddaughter',
  '曾祖父': 'great_grandfather_p', '曾祖母': 'great_grandmother_p',
  '姑奶奶': 'great_aunt', '舅奶奶': 'great_aunt_m',
  '堂哥': 'cousin_p_older_male', '堂弟': 'cousin_p_younger_male',
  '堂姐': 'cousin_p_older_female', '堂妹': 'cousin_p_younger_female',
  '表哥': 'cousin_m_older_male', '表弟': 'cousin_m_younger_male',
  '表姐': 'cousin_m_older_female', '表妹': 'cousin_m_younger_female',
  '岳父': 'spouse_father', '公公': 'spouse_father',
  '岳母': 'spouse_mother', '婆婆': 'spouse_mother',
  '大舅子': 'spouse_brother_older', '小舅子': 'spouse_brother_younger',
  '大姨子': 'spouse_sister_older', '小姨子': 'spouse_sister_younger',
  '大伯子': 'spouse_brother_older', '小叔子': 'spouse_brother_younger',
  '大姑子': 'spouse_sister_older', '小姑子': 'spouse_sister_younger',
  '儿媳': 'wife', '女婿': 'husband',
}

// 获取关系信息
export function getRelationInfo(relation: string): RelationInfo {
  // 先尝试直接匹配
  if (RELATION_MAP[relation]) {
    return RELATION_MAP[relation]
  }
  // 尝试通过中文名映射
  const key = RELATION_KEY_MAP[relation]
  if (key && RELATION_MAP[key]) {
    return RELATION_MAP[key]
  }
  // 默认返回"其他"
  return { label: relation, reverseLabel: '其他', level: 5, side: 'self' }
}

// 获取五服等级
export function getWuFuLevel(relation: string): RelationLevel {
  return getRelationInfo(relation).level
}

// 判断是否在五服之内（level <= 5）
export function isWithinWuFu(relation: string): boolean {
  const level = getWuFuLevel(relation)
  return level <= 5
}

// 五服颜色配置
export const WUFU_COLORS: Record<RelationLevel, { bg: string; text: string; border: string; name: string }> = {
  0: { bg: '#F28C38', text: '#FFFFFF', border: '#F28C38', name: '自己' },
  1: { bg: '#E85D3A', text: '#FFFFFF', border: '#E85D3A', name: '一等亲（父母/子女）' },
  2: { bg: '#F5A623', text: '#FFFFFF', border: '#F5A623', name: '二等亲（祖孙/兄弟姐妹）' },
  3: { bg: '#7C6F5B', text: '#FFFFFF', border: '#7C6F5B', name: '三等亲（叔伯姑舅姨/曾祖）' },
  4: { bg: '#C5C0BA', text: '#2D2A26', border: '#C5C0BA', name: '四等亲（堂表/高祖）' },
  5: { bg: '#EDE8E2', text: '#8C8580', border: '#C5C0BA', name: '五等亲（族亲）' },
  6: { bg: '#F7F5F2', text: '#C5C0BA', border: '#EDE8E2', name: '五服之外' },
}

// 获取关系对应的颜色
export function getRelationColor(relation: string): { bg: string; text: string; border: string } {
  const level = getWuFuLevel(relation)
  const color = WUFU_COLORS[level] || WUFU_COLORS[6]
  return { bg: color.bg, text: color.text, border: color.border }
}

// 简化版：仅获取背景色
export function getRelationBgColor(relation: string): string {
  return getRelationColor(relation).bg
}

// 获取所有关系选项（用于添加亲属时的选择）
export function getRelationOptions() {
  return [
    { label: '父亲', key: 'father', level: 1 },
    { label: '母亲', key: 'mother', level: 1 },
    { label: '儿子', key: 'son', level: 1 },
    { label: '女儿', key: 'daughter', level: 1 },
    { label: '配偶', key: 'wife', level: 1 },
    { label: '爷爷', key: 'grandfather_p', level: 2 },
    { label: '奶奶', key: 'grandmother_p', level: 2 },
    { label: '外公', key: 'grandfather_m', level: 2 },
    { label: '外婆', key: 'grandmother_m', level: 2 },
    { label: '哥哥', key: 'brother', level: 2 },
    { label: '弟弟', key: 'brother_younger', level: 2 },
    { label: '姐姐', key: 'sister', level: 2 },
    { label: '妹妹', key: 'sister_younger', level: 2 },
    { label: '孙子', key: 'grandson', level: 2 },
    { label: '孙女', key: 'granddaughter', level: 2 },
    { label: '叔叔', key: 'uncle_p', level: 3 },
    { label: '伯父', key: 'uncle_p_older', level: 3 },
    { label: '姑姑', key: 'aunt_p', level: 3 },
    { label: '姑妈', key: 'aunt_p_older', level: 3 },
    { label: '舅舅', key: 'uncle_m', level: 3 },
    { label: '舅妈', key: 'jiùmā', level: 3 },
    { label: '阿姨', key: 'aunt_m', level: 3 },
    { label: '姨妈', key: 'aunt_m', level: 3 },
    { label: '姨父', key: 'yí父', level: 3 },
    { label: '姑父', key: 'gūfù', level: 3 },
    { label: '侄子', key: 'nephew', level: 3 },
    { label: '侄女', key: 'niece', level: 3 },
    { label: '外甥', key: 'nephew', level: 3 },
    { label: '外甥女', key: 'niece', level: 3 },
    { label: '曾祖父', key: 'great_grandfather_p', level: 4 },
    { label: '曾祖母', key: 'great_grandmother_p', level: 4 },
    { label: '姑奶奶', key: 'great_aunt', level: 4 },
    { label: '舅奶奶', key: 'great_aunt_m', level: 4 },
    { label: '堂哥', key: 'cousin_p_older_male', level: 4 },
    { label: '堂弟', key: 'cousin_p_younger_male', level: 4 },
    { label: '堂姐', key: 'cousin_p_older_female', level: 4 },
    { label: '堂妹', key: 'cousin_p_younger_female', level: 4 },
    { label: '表哥', key: 'cousin_m_older_male', level: 4 },
    { label: '表弟', key: 'cousin_m_younger_male', level: 4 },
    { label: '表姐', key: 'cousin_m_older_female', level: 4 },
    { label: '表妹', key: 'cousin_m_younger_female', level: 4 },
    { label: '岳父', key: 'spouse_father', level: 1 },
    { label: '婆婆', key: 'spouse_mother', level: 1 },
    { label: '大舅子', key: 'spouse_brother_older', level: 2 },
    { label: '小舅子', key: 'spouse_brother_younger', level: 2 },
    { label: '大姨子', key: 'spouse_sister_older', level: 2 },
    { label: '小姨子', key: 'spouse_sister_younger', level: 2 },
    { label: '其他', key: 'other', level: 5 },
  ]
}
