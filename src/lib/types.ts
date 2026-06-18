export type TransactionType = "income" | "expense"

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  type: TransactionType
  amount: number
  description: string
  date: string
  created_at: string
  is_recurring: boolean
  recurring_source_id: string | null
  categories?: Pick<Category, "name" | "color"> | null
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  current_age: number
  target_age: number
  target_amount: number
  initial_amount: number
  etf_enabled: boolean
  etf_annual_return: number
  created_at: string
}

export interface ActivityLogEntry {
  id: number
  user_id: string
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
  created_at: string
}

export type SavingsDirection = "deposit" | "withdrawal"

export interface SavingsAccount {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface SavingsEntry {
  id: string
  user_id: string
  account_id: string | null
  direction: SavingsDirection
  amount: number
  description: string
  date: string
  created_at: string
  savings_accounts?: Pick<SavingsAccount, "name" | "color"> | null
}
