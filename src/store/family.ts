import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Relative {
  id: string
  name: string
  gender: 'male' | 'female'
  relation: string
  relationLabel: string
  side: 'paternal' | 'maternal' | 'spouse'
  verified: boolean
  birthday?: string
  hometown?: string
  phone?: string
  avatar?: string
  createdAt: number
}

export interface VerifyRequest {
  id: string
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  relation: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  createdAt: number
}

export const useFamilyStore = defineStore('family', () => {
  const relatives = ref<Relative[]>([])
  const verifyRequests = ref<VerifyRequest[]>([])

  const stats = computed(() => ({
    total: relatives.value.length,
    verified: relatives.value.filter(r => r.verified).length,
    unverified: relatives.value.filter(r => !r.verified).length,
    familyCount: new Set(relatives.value.map(r => r.side)).size,
  }))

  const pendingVerifyCount = computed(() =>
    verifyRequests.value.filter(v => v.status === 'pending').length
  )

  const recentRelatives = computed(() =>
    [...relatives.value].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  )

  function relativesBySide(side: string) {
    return relatives.value.filter(r => r.side === side)
  }

  function addRelative(data: Omit<Relative, 'id' | 'createdAt'>) {
    relatives.value.push({
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
    })
  }

  function removeRelative(id: string) {
    relatives.value = relatives.value.filter(r => r.id !== id)
  }

  function addVerifyRequest(data: Omit<VerifyRequest, 'id' | 'createdAt' | 'status'>) {
    verifyRequests.value.push({
      ...data,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: Date.now(),
    })
  }

  function approveVerify(id: string) {
    const req = verifyRequests.value.find(v => v.id === id)
    if (req) req.status = 'approved'
  }

  function rejectVerify(id: string, reason?: string) {
    const req = verifyRequests.value.find(v => v.id === id)
    if (req) {
      req.status = 'rejected'
      req.rejectReason = reason
    }
  }

  async function loadRelatives() {
    // TODO: 从 API 加载
    // 模拟数据
    if (relatives.value.length === 0) {
      relatives.value = [
        { id: '1', name: '张伟', gender: 'male', relation: 'father', relationLabel: '父亲', side: 'paternal', verified: true, createdAt: Date.now() },
        { id: '2', name: '李芳', gender: 'female', relation: 'mother', relationLabel: '母亲', side: 'maternal', verified: true, createdAt: Date.now() },
        { id: '3', name: '张明', gender: 'male', relation: 'brother', relationLabel: '哥哥', side: 'paternal', verified: false, createdAt: Date.now() },
      ]
    }
  }

  return {
    relatives, verifyRequests, stats, pendingVerifyCount, recentRelatives,
    relativesBySide, addRelative, removeRelative, loadRelatives,
    addVerifyRequest, approveVerify, rejectVerify,
  }
})
