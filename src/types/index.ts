export interface KnowledgeBaseEntry {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "ai" | "staff";
  body: string;
  created_at: string;
}

export interface PendingItem {
  id: string;
  conversation_id: string;
  question: string;
  status: "open" | "answered";
  created_at: string;
}

export interface AwaitingApprovalItem {
  id: string;
  conversation_id: string;
  ai_suggestion: string;
  ai_confidence: number | null;
  status: "pending" | "approved" | "edited" | "rejected";
  created_at: string;
}
