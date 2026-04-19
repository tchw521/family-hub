// 通用工具函数

// 格式化日期
export function formatDate(date: string | number | Date, fmt = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  const map: Record<string, string> = {
    'YYYY': d.getFullYear().toString(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0'),
  }
  let result = fmt
  for (const [k, v] of Object.entries(map)) {
    result = result.replace(k, v)
  }
  return result
}

// 手机号脱敏
export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 姓名脱敏
export function maskName(name: string): string {
  if (name.length <= 1) return name
  return name[0] + '*'.repeat(name.length - 1)
}

// 生日计算年龄
export function calcAge(birthday: string): number {
  const birth = new Date(birthday)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 距今时间描述
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}个月前`
  return `${Math.floor(months / 12)}年前`
}

// 防抖
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
