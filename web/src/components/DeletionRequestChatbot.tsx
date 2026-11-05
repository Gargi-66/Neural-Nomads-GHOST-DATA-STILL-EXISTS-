import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Bot, User, X, Minimize2, RotateCcw, 
  CheckCircle2, ShieldCheck, FileText, Sparkles, ChevronRight,
  KeyRound, Loader2
} from 'lucide-react';

interface RemediationStepItem {
  step_no: number;
  phase: 'FINDING' | 'REMEDIATION' | 'VERIFICATION';
  system_id: string;
  resource_id: string;
  operation: string;
  state: string;
  evidence_id?: string;
}

interface IntakeReceipt {
  ticketId: string;
  userName: string;
  userEmail: string;
  jurisdiction: string;
  deletionScope: string;
  requestText: string;
  receivedAt: string;
  auditCutoff: string;
  status: 'INCOMPLETE' | 'COMPLETE' | 'NOT_APPLICABLE' | string;
  verdictReason: string;
  customerId?: string;
  targetSystems: string[];
  hash: string;
  steps: RemediationStepItem[];
  isDemoFallback?: boolean;
  idempotent?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  receipt?: IntakeReceipt;
  quickReplies?: string[];
  isError?: boolean;
}

export const DeletionRequestChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'quick_form'>('chat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat conversational step machine
  const [inputMessage, setInputMessage] = useState('');
  const [step, setStep] = useState<'welcome' | 'ask_email' | 'ask_reason' | 'ask_details' | 'ask_otp' | 'completed'>('welcome');
  
  // Collected user data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    jurisdiction: 'GDPR Article 17 (Right to Erasure)',
    deletionScope: 'ALL_PERSONAL_DATA',
    requestText: 'Please permanently delete my account, profile, and all associated personal data across all services and backups.',
    otpCode: '849-201'
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Hello! I am the AEGIS Live Deletion Intake Assistant. I can record your affirmative right-to-erasure request, verify ownership via OTP, and run the real DAG audit engine.',
      timestamp: 'Just now',
      quickReplies: ['Submit Deletion Request', 'What data gets deleted?', 'Check GDPR / CCPA rights']
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Synthetic hash calculation for offline fallback
  const generateFallbackHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + '7e4b9f201d4a8c3e81aa9118edfb5920';
  };

  // Dispatch live request to FastAPI backend
  const submitToIntakeAPI = async (
    name: string,
    email: string,
    framework: string,
    scope: string,
    statement: string,
    otp: string
  ): Promise<IntakeReceipt> => {
    const payload = {
      full_name: name.trim() || 'Anonymous Subject',
      email: email.trim(),
      legal_framework: framework,
      deletion_scope: scope,
      request_text: statement,
      custom_statement: '',
      otp_code: otp.replace('-', '').trim()
    };

    const endpoints = ['/api/intake', 'http://localhost:8000/api/intake'];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          // Notify other components of live submission
          try {
            window.dispatchEvent(new CustomEvent('aegis_live_case_created', { detail: data }));
          } catch (_) {}

          return {
            ticketId: data.ticket_id,
            userName: data.full_name,
            userEmail: data.email,
            jurisdiction: data.legal_framework,
            deletionScope: data.deletion_scope,
            requestText: data.verdict_reason || statement,
            receivedAt: data.submitted_at.replace('T', ' ').slice(0, 19) + ' UTC',
            auditCutoff: data.audit_at.replace('T', ' ').slice(0, 19) + ' UTC',
            status: data.status,
            verdictReason: data.verdict_reason,
            customerId: data.customer_id,
            targetSystems: data.resources?.map((r: any) => r.system_id).filter(Boolean) || ['account_service'],
            hash: data.receipt_hash,
            steps: data.steps || [],
            isDemoFallback: false,
            idempotent: data.idempotent
          };
        } else if (response.status === 400) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Invalid verification request');
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Invalid OTP')) {
          throw err;
        }
      }
    }

    // Offline Demo Fallback if backend server is not running
    const ticketId = `CASE-LIVE-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    return {
      ticketId,
      userName: name || 'Valued User',
      userEmail: email || 'user@example.com',
      jurisdiction: framework,
      deletionScope: scope,
      requestText: statement,
      receivedAt: nowIso.replace('T', ' ').slice(0, 19) + ' UTC',
      auditCutoff: nowIso.replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'INCOMPLETE',
      verdictReason: 'Offline Simulation: 2 non-compliant data replicas detected in regional search index.',
      targetSystems: ['account_service', 'search_service', 'replica_eu_central'],
      hash: generateFallbackHash(`${email}_${ticketId}`),
      steps: [
        {
          step_no: 1,
          phase: 'FINDING',
          system_id: 'search_service',
          resource_id: 'search_018',
          operation: 'REPORT_REMAINING_RECORD',
          state: 'PRESENT',
          evidence_id: 'evidence_89'
        },
        {
          step_no: 2,
          phase: 'REMEDIATION',
          system_id: 'search_service',
          resource_id: 'search_018',
          operation: 'DELETE_RECORD',
          state: 'ABSENT'
        },
        {
          step_no: 3,
          phase: 'VERIFICATION',
          system_id: 'account_service',
          resource_id: 'account_98',
          operation: 'VERIFY_RECORD_ABSENT',
          state: 'ABSENT'
        }
      ],
      isDemoFallback: true
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // State machine for guided conversation
    setTimeout(() => {
      handleBotResponse(text);
    }, 400);
  };

  const handleBotResponse = async (userText: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lower = userText.toLowerCase();

    if (lower.includes('what data') || lower.includes('what gets deleted')) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Under AEGIS zero-trust policy, all 18 infrastructure microservices (Postgres primary, regional replicas, Kafka WAL streams, S3 invoice attachments, and Elasticsearch clusters) are scanned for direct and historical aliases.',
          timestamp: timeStr,
          quickReplies: ['Submit Deletion Request', 'Mariam Nasser (Known User)', 'Stranger (Unknown User)']
        }
      ]);
      return;
    }

    if (lower.includes('gdpr') || lower.includes('ccpa') || lower.includes('rights')) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'AEGIS complies with GDPR Article 17 and CCPA §1798.105. Statutory financial records are preserved as anonymized account tombstones, while prohibited PII is completely expunged.',
          timestamp: timeStr,
          quickReplies: ['Submit Deletion Request']
        }
      ]);
      return;
    }

    if (step === 'welcome' || lower.includes('submit deletion')) {
      setStep('ask_email');
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Please provide your Full Name and Registered Email (e.g. "Mariam Nasser, nasser.mariam@gmail.com" or click a preset below).',
          timestamp: timeStr,
          quickReplies: [
            'Mariam Nasser, nasser.mariam@gmail.com',
            'Oliver Bennett, oliver-bennett@gmail.com',
            'Jane Doe, stranger_unknown@example.com'
          ]
        }
      ]);
      return;
    }

    if (step === 'ask_email') {
      const parts = userText.split(/,|;/);
      const name = parts[0]?.trim() || 'Customer';
      const email = parts[1]?.trim() || (userText.includes('@') ? userText.trim() : 'nasser.mariam@gmail.com');
      
      setFormData(prev => ({ ...prev, name, email }));
      setStep('ask_reason');

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Got it, ${name}. Which legal framework applies to your erasure request?`,
          timestamp: timeStr,
          quickReplies: ['GDPR Article 17 (EU)', 'CCPA Right to Delete (US)', 'LGPD Article 18 (BR)']
        }
      ]);
      return;
    }

    if (step === 'ask_reason') {
      setFormData(prev => ({ ...prev, jurisdiction: userText }));
      setStep('ask_details');

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'What is your deletion instruction or scope (e.g. purge all accounts and backups, remove search indexes)?',
          timestamp: timeStr,
          quickReplies: [
            'Delete all personal data and backups immediately',
            'Please close my account and erase all search traces',
            'Do not delete, only export my data'
          ]
        }
      ]);
      return;
    }

    if (step === 'ask_details') {
      setFormData(prev => ({ ...prev, requestText: userText }));
      setStep('ask_otp');

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Security Verification: To prevent unauthorized deletion, please enter the 6-digit confirmation code sent to your registered address.',
          timestamp: timeStr,
          quickReplies: ['849-201 (Demo OTP Code)', '849201']
        }
      ]);
      return;
    }

    if (step === 'ask_otp') {
      const enteredOtp = userText.replace(/[^\d]/g, '');
      setIsSubmitting(true);

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Verifying OTP with identity authority & executing AEGIS DAG audit...',
          timestamp: timeStr
        }
      ]);

      try {
        const receipt = await submitToIntakeAPI(
          formData.name,
          formData.email,
          formData.jurisdiction,
          formData.deletionScope,
          formData.requestText,
          enteredOtp || formData.otpCode
        );

        setStep('completed');
        setIsSubmitting(false);

        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now() + 1}`,
            sender: 'bot',
            text: `Intake audit verified! Here is your cryptographic receipt from the AEGIS intelligence engine:`,
            timestamp: timeStr,
            receipt
          },
          {
            id: `bot-${Date.now() + 2}`,
            sender: 'bot',
            text: `Audit Result: ${receipt.status} — ${receipt.verdictReason}`,
            timestamp: timeStr,
            quickReplies: ['Submit Another Request', 'Start Over']
          }
        ]);
      } catch (err: any) {
        setIsSubmitting(false);
        setMessages(prev => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text: `Verification Failed: ${err.message || 'Invalid OTP code'}. Please enter the official demo code '849-201' to verify ownership.`,
            timestamp: timeStr,
            isError: true,
            quickReplies: ['849-201']
          }
        ]);
      }
    }
  };

  const handleReset = () => {
    setStep('welcome');
    setFormData({
      name: '',
      email: '',
      jurisdiction: 'GDPR Article 17 (Right to Erasure)',
      deletionScope: 'ALL_PERSONAL_DATA',
      requestText: 'Please permanently delete my account, profile, and all associated personal data across all services and backups.',
      otpCode: '849-201'
    });
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: 'Intake session reset. How can I help you record a live deletion request today?',
        timestamp: 'Just now',
        quickReplies: ['Submit Deletion Request', 'What data gets deleted?']
      }
    ]);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const receipt = await submitToIntakeAPI(
        formData.name,
        formData.email,
        formData.jurisdiction,
        formData.deletionScope,
        formData.requestText,
        formData.otpCode
      );

      setActiveMode('chat');
      setStep('completed');
      setIsSubmitting(false);

      setMessages(prev => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: 'user',
          text: `Submitted Deletion Request: ${formData.jurisdiction} for ${formData.email}`,
          timestamp: 'Just now'
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: 'bot',
          text: 'Affirmative request audited and stored in AEGIS Live Lakehouse:',
          timestamp: 'Just now',
          receipt
        }
      ]);
    } catch (err: any) {
      setIsSubmitting(false);
      alert(`Submission rejected: ${err.message}`);
    }
  };

  return (
    <>
      {/* =========================================================================
          1. FLOATING ACTION TRIGGER (Bottom-Right Corner)
          ========================================================================= */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 select-none">
        
        {/* Helper tooltip badge when closed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EFE5DB] text-stone-700 shadow-md text-xs font-semibold cursor-pointer hover:border-[#EA580C] hover:text-[#EA580C] transition group"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C] group-hover:rotate-12 transition-transform" />
            <span>Submit Live Erasure Request</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
          </div>
        )}

        {/* Floating Bubble Button */}
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#EA580C] hover:bg-[#D94E1B] text-white shadow-xl shadow-orange-500/30 flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 group relative"
            title="Open Live Deletion Intake Assistant"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"></span>
          </button>
        )}

        {/* =========================================================================
            2. EXPANDED CHATBOT WIDGET
            ========================================================================= */}
        {isOpen && (
          <div className={`w-[380px] sm:w-[430px] max-w-[calc(100vw-1.5rem)] bg-white rounded-3xl border border-[#EFE5DB] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[88vh]'
          }`}>
            
            {/* Header */}
            <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#EFE5DB] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center relative shadow-xs">
                  <Bot className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                    AEGIS Live Intake
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      Active API
                    </span>
                  </h3>
                  <span className="text-[10px] text-stone-500 font-sans block leading-tight">
                    Zero-Trust Forensic Erasure Pipeline
                  </span>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-1 text-stone-400">
                <button
                  onClick={handleReset}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                  title="Close widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher: Guided Chat vs Fast Form */}
            {!isMinimized && (
              <div className="px-3 pt-2 pb-1.5 bg-[#FAF7F2] border-b border-[#EFE5DB] flex items-center justify-between text-[11px] font-semibold">
                <div className="inline-flex p-0.5 bg-stone-200/60 rounded-xl w-full">
                  <button
                    onClick={() => setActiveMode('chat')}
                    className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMode === 'chat' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-[#EA580C]" />
                    Intake Assistant
                  </button>
                  <button
                    onClick={() => setActiveMode('quick_form')}
                    className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeMode === 'quick_form' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-blue-600" />
                    Direct Form
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            {!isMinimized && (
              <>
                {/* VIEW A: INTERACTIVE CHAT MODE */}
                {activeMode === 'chat' && (
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs bg-[#FAF7F2]/40">
                    {messages.map((m) => {
                      const isBot = m.sender === 'bot';
                      return (
                        <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}>
                          <div className="flex items-end gap-1.5 max-w-[88%]">
                            {isBot && (
                              <div className="w-5 h-5 rounded-full bg-[#FFEAE0] text-[#D94E1B] flex items-center justify-center shrink-0 mb-0.5">
                                <Bot className="w-3 h-3" />
                              </div>
                            )}

                            <div className={`p-3 rounded-2xl leading-relaxed text-xs ${
                              m.isError
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : isBot 
                                  ? 'bg-white text-stone-800 border border-[#EFE5DB] shadow-2xs rounded-bl-xs' 
                                  : 'bg-[#EA580C] text-white font-medium rounded-br-xs shadow-2xs'
                            }`}>
                              {m.text}
                            </div>

                            {!isBot && (
                              <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 mb-0.5">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Render Cryptographic Intake Receipt Card if attached */}
                          {m.receipt && (
                            <div className="w-full mt-1.5 p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2.5 font-mono text-[10px]">
                              
                              {/* Header & Status */}
                              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                                <span className="font-bold text-stone-900 flex items-center gap-1 truncate">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{m.receipt.ticketId}</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                  m.receipt.status === 'COMPLETE'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : m.receipt.status === 'INCOMPLETE'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-stone-100 text-stone-700 border border-stone-300'
                                }`}>
                                  {m.receipt.status}
                                </span>
                              </div>

                              {/* Subject & Cutoff */}
                              <div className="grid grid-cols-2 gap-2 text-stone-600 font-sans">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Subject</span>
                                  <span className="font-semibold text-stone-900 truncate block">{m.receipt.userName}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Verified Email</span>
                                  <span className="font-semibold text-[#EA580C] truncate block">{m.receipt.userEmail}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Customer ID</span>
                                  <span className="font-semibold text-stone-800">{m.receipt.customerId || 'unresolved'}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-stone-400 block font-mono">Framework</span>
                                  <span className="font-semibold text-stone-800 truncate block">{m.receipt.jurisdiction}</span>
                                </div>
                              </div>

                              {/* Verdict Reason */}
                              <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#EFE5DB] font-sans text-stone-700 text-[10px]">
                                <span className="font-bold text-stone-900 block mb-0.5 font-mono text-[9px] uppercase">Audit Verdict</span>
                                {m.receipt.verdictReason}
                              </div>

                              {/* DAG Steps Preview */}
                              {m.receipt.steps && m.receipt.steps.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-mono flex items-center justify-between">
                                    <span>Remediation DAG ({m.receipt.steps.length} Steps)</span>
                                    <span className="text-emerald-700 font-semibold">Topologically Sorted</span>
                                  </div>
                                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono text-[9px]">
                                    {m.receipt.steps.map((st) => (
                                      <div key={st.step_no} className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="font-bold text-stone-500">#{st.step_no}</span>
                                          <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                            st.phase === 'FINDING' ? 'bg-amber-100 text-amber-800' :
                                            st.phase === 'REMEDIATION' ? 'bg-blue-100 text-blue-800' :
                                            'bg-emerald-100 text-emerald-800'
                                          }`}>
                                            {st.phase}
                                          </span>
                                          <span className="text-stone-800 truncate">{st.operation}</span>
                                        </div>
                                        <span className="text-stone-400 shrink-0 font-sans text-[8px]">{st.system_id}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Cryptographic SHA-256 Hash */}
                              <div className="space-y-1 text-stone-500 font-mono text-[9px] pt-1.5 border-t border-stone-100">
                                <div className="flex justify-between items-center">
                                  <span>Cutoff Time:</span>
                                  <strong className="text-stone-800">{m.receipt.auditCutoff}</strong>
                                </div>
                                <div className="flex justify-between items-center truncate">
                                  <span>Receipt Hash:</span>
                                  <code className="text-[#EA580C] truncate max-w-[190px]" title={m.receipt.hash}>
                                    {m.receipt.hash}
                                  </code>
                                </div>
                              </div>

                              {m.receipt.isDemoFallback && (
                                <div className="text-[8px] text-stone-400 text-center font-mono">
                                  [OFFLINE SIMULATION MODE &bull; START FASTAPI FOR LIVE LAKEHOUSE WRITE]
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick replies suggestion chips */}
                          {m.quickReplies && m.quickReplies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1 pl-6">
                              {m.quickReplies.map((qr) => (
                                <button
                                  key={qr}
                                  disabled={isSubmitting}
                                  onClick={() => handleSendMessage(qr)}
                                  className="px-2.5 py-1 rounded-full bg-white border border-[#EFE5DB] text-[10px] text-stone-700 font-medium hover:border-[#EA580C] hover:text-[#EA580C] hover:bg-[#FFEAE0]/30 transition shadow-2xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                >
                                  <span>{qr}</span>
                                  <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* VIEW B: DIRECT FORM MODE */}
                {activeMode === 'quick_form' && (
                  <form onSubmit={handleFormSubmit} className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs bg-[#FAF7F2]/40">
                    <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Direct intake files into AEGIS <code>data/live_intake.db</code> with real cryptographic receipt generation.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mariam Nasser"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Registered Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. nasser.mariam@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                          Legal Framework
                        </label>
                        <select
                          value={formData.jurisdiction}
                          onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                          className="w-full px-2.5 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-[#EA580C] shadow-2xs cursor-pointer"
                        >
                          <option value="GDPR Article 17 (Right to Erasure)">GDPR Art. 17</option>
                          <option value="CCPA §1798.105 (California Consumer Privacy Act)">CCPA §1798.105</option>
                          <option value="LGPD Article 18 (Brazil)">LGPD Art. 18</option>
                          <option value="Voluntary Account Termination">Voluntary Termination</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                          Scope
                        </label>
                        <select
                          value={formData.deletionScope}
                          onChange={(e) => setFormData({ ...formData, deletionScope: e.target.value })}
                          className="w-full px-2.5 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 font-medium focus:outline-none focus:border-[#EA580C] shadow-2xs cursor-pointer"
                        >
                          <option value="ALL_PERSONAL_DATA">All Personal Data & Backups</option>
                          <option value="ACCOUNT_AND_REPLICAS">Account & Replicas Only</option>
                          <option value="MARKETING_ONLY">Marketing Profiles Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Verification Code (OTP) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.otpCode}
                          onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                          placeholder="849-201"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#EA580C] shadow-2xs"
                        />
                        <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                      <span className="text-[9px] text-stone-400 block">Default Demo Key: <code>849-201</code></span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                        Affirmative Erasure Request Statement
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={formData.requestText}
                        onChange={(e) => setFormData({ ...formData, requestText: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] shadow-2xs leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-[#EA580C] hover:bg-[#D94E1B] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Auditing Lakehouse...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submit & Verify Erasure</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Input Bar (Only visible in chat mode) */}
                {activeMode === 'chat' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-2.5 bg-white border-t border-[#EFE5DB] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      disabled={isSubmitting}
                      placeholder={step === 'ask_otp' ? 'Enter 6-digit OTP code (e.g. 849-201)...' : 'Type reply or deletion instruction...'}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#EFE5DB] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#EA580C] disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isSubmitting}
                      className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#D94E1B] cursor-pointer shrink-0"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
};
