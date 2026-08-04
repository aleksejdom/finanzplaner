export type TransactionType = "income" | "expense"

export interface Category {
  id: string
  userId: string
  name: string
  type: TransactionType
  color: string
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  description: string
  date: string
  createdAt: Date
  isRecurring: boolean
  recurringSourceId: string | null
  category?: Pick<Category, "name" | "color"> | null
}

export interface SavingsGoal {
  id: string
  userId: string
  name: string
  currentAge: number
  targetAge: number
  targetAmount: number
  initialAmount: number
  etfEnabled: boolean
  etfAnnualReturn: number
  createdAt: Date
}

export interface ActivityLogEntry {
  id: number
  userId: string
  action: "created" | "updated" | "deleted"
  entity: string
  details: {
    id?: string
    type?: TransactionType
    direction?: SavingsDirection
    amount?: number
    description?: string
    date?: string
    previous?: { amount?: number; description?: string; date?: string }
  }
  createdAt: Date
}

export type SavingsDirection = "deposit" | "withdrawal"

export interface SavingsAccount {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
}

export interface SavingsEntry {
  id: string
  userId: string
  accountId: string | null
  direction: SavingsDirection
  amount: number
  description: string
  date: string
  createdAt: Date
  account?: Pick<SavingsAccount, "name" | "color"> | null
}
